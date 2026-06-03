import { createLibp2p } from 'libp2p'
import { tcp } from '@libp2p/tcp'
import { noise } from '@chainsafe/libp2p-noise'
import { yamux } from '@libp2p/yamux'
import { multiaddr } from '@multiformats/multiaddr'

const CHAT_PROTOCOL = '/giraso/chat/1.0.0'
const PEER_A_ID = '12D3KooWSud9Z6zQyjo5Gm8zikBPpE8qP7Z3TtGN1hEoUKbfitsN'

const node = await createLibp2p({
  transports: [tcp()],
  connectionEncrypters: [noise()],
  streamMuxers: [yamux()],
})

await node.start()
console.log('✅ Peer B started:', node.peerId.toString())

// Open a chat stream directly to Peer A
const addr = multiaddr(`/ip4/127.0.0.1/tcp/4001/p2p/${PEER_A_ID}`)
console.log(`\n🔗 Opening chat stream to Peer A (${PEER_A_ID})...`)

try {
  const stream = await node.dialProtocol(addr, CHAT_PROTOCOL)
  console.log('✅ Chat stream open! Talking to A...\n')

  let writeInterval

  // ── READ: incoming messages from A ────────────────────────────────────────
  const readPromise = (async () => {
    try {
      for await (const chunk of stream) {
        // chunk can be Uint8Array or Uint8ArrayList. Convert to Uint8Array.
        const bytes = chunk instanceof Uint8Array ? chunk : chunk.subarray()
        const msg = new TextDecoder().decode(bytes)
        console.log(`💬 [A → B] ${msg}`)
      }
    } catch (err) {
      console.log('ℹ️  A disconnected:', err.message)
    }
  })()

  // ── WRITE: send messages to A every 4 seconds ─────────────────────────────
  let count = 0
  writeInterval = setInterval(() => {
    try {
      if (stream.status !== 'open') {
        clearInterval(writeInterval)
        return
      }
      count++
      const msg = `Hey from B! (msg #${count})`
      console.log(`📤 [B → A] ${msg}`)
      stream.send(new TextEncoder().encode(msg))
    } catch (err) {
      console.log('ℹ️  Error sending to A:', err.message)
      clearInterval(writeInterval)
    }
  }, 4000)

  // Wait for A to disconnect
  await readPromise
  clearInterval(writeInterval)
  console.log('🔌 Peer A stream closed.\n')
} catch (err) {
  console.error('❌ Failed to connect/dial Peer A:', err.message)
  console.log('\n💡 Please check if Peer A is running first on port 4001.')
}