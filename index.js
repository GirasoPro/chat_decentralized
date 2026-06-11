import { loadIdentity } from './services/identity.js'
import { createNode } from './services/libp2p.js'
import { initDiscovery } from './services/discovery.js'
import { initChat } from './services/chat.js'

const PORT = process.argv[2] || 4001

const privateKey = await loadIdentity(PORT)
const node = await createNode(privateKey, PORT)

console.log(`Node started on ${PORT}`)
console.log(node.peerId.toString())

// enable pubsub chat
await initChat(node, PORT)

// simple CLI input (reverted to original working code style)
process.stdin.on('data', (data) => {
  const msg = data.toString().trim()

  if (msg.length > 0) {
    node.sendChat(msg)
  }
})

console.log('Type messages and press Enter...\n')