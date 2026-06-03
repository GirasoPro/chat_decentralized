import { createLibp2p } from 'libp2p'
import { tcp } from '@libp2p/tcp'
import { noise } from '@chainsafe/libp2p-noise'
import { yamux } from '@libp2p/yamux'
import { generateKeyPair, privateKeyToProtobuf, privateKeyFromProtobuf } from '@libp2p/crypto/keys'
import fs from 'fs'

const CHAT_PROTOCOL = '/giraso/chat/1.0.0'
const KEY_FILE = './peer-a-key.bin'

// Load or generate persistent private key
let privateKey
if (fs.existsSync(KEY_FILE)) {
  const bytes = fs.readFileSync(KEY_FILE)
  privateKey = privateKeyFromProtobuf(bytes)
  console.log('🔑 Loaded persistent private key from', KEY_FILE)
} else {
  privateKey = await generateKeyPair('Ed25519')
  const bytes = privateKeyToProtobuf(privateKey)
  fs.writeFileSync(KEY_FILE, bytes)
  console.log('🔑 Generated new persistent private key and saved to', KEY_FILE)
}

const node = await createLibp2p({
  privateKey,
  addresses: { listen: ['/ip4/127.0.0.1/tcp/4001'] },
  transports: [tcp()],
  connectionEncrypters: [noise()],
  streamMuxers: [yamux()],
})

await node.start()

const peerId = node.peerId.toString()
console.log('✅ Peer A started:', peerId)
console.log('📍 Listening on:', node.getMultiaddrs().map(a => a.toString()).join('\n'))
console.log('\n⚠️  Make sure this matches PEER_A_ID in peer-b.js:\n  ', peerId, '\n')
console.log('⏳ Waiting for Peer B to connect...\n')

// ── KEY FIX: Positional arguments (stream, connection) instead of destructuring ──
node.handle(CHAT_PROTOCOL, async (stream, connection) => {
  const remotePeer = connection.remotePeer.toString().slice(-8)
  console.log(`\n🔗 Peer B connected! (…${remotePeer})`)

  let writeInterval

  // ── READ: incoming messages from B ──────────────────────────────────────
  const readPromise = (async () => {
    try {
      for await (const chunk of stream) {
        // chunk can be Uint8Array or Uint8ArrayList. Convert to Uint8Array.
        const bytes = chunk instanceof Uint8Array ? chunk : chunk.subarray()
        const msg = new TextDecoder().decode(bytes)
        console.log(`💬 [B → A] ${msg}`)
      }
    } catch (err) {
      console.log('ℹ️  B disconnected:', err.message)
    }
  })()

  // ── WRITE: send messages to B every 3 seconds ────────────────────────── 
  let count = 0
  writeInterval = setInterval(() => {
    try {
      if (stream.status !== 'open') {
        clearInterval(writeInterval)
        return
      }
      count++
      const msg = `Hello from A! (msg #${count})`
      console.log(`📤 [A → B] ${msg}`)
      stream.send(new TextEncoder().encode(msg))
    } catch (err) {
      console.log('ℹ️  Error sending to B:', err.message)
      clearInterval(writeInterval)
    }
  }, 3000)

  // Wait for B to disconnect
  await readPromise
  clearInterval(writeInterval)
  console.log('🔌 Peer B stream closed.\n')
})