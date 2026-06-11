import { loadIdentity } from './services/identity.js'
import { createNode } from './services/libp2p.js'
import { handleChatStream } from './services/chat-handler.js'
import { dialPeer } from './services/dial-peer.js'

const CHAT_PROTOCOL = '/giraso/chat/1.0.0'
const PORT = process.argv[2] || 4001
const PEER_ADDR = process.argv[3]
const privateKey = await loadIdentity(PORT)

const node = await createNode(privateKey, PORT)
const addr = node.getMultiaddrs().find(a => a.toString().includes(`/tcp/${PORT}`))

console.log(`Peer ${PORT} started`)

console.log('Adress: %s', addr)

node.handle(
  CHAT_PROTOCOL,
  async (stream, connection) => {
    await handleChatStream(node, PORT, stream, connection)
  }
)

if (PEER_ADDR) {
  const stream = await dialPeer(node, PEER_ADDR, CHAT_PROTOCOL)

  if (stream) {
    stream.send(new TextEncoder().encode(`Hello from ${PORT}`))
  }
}