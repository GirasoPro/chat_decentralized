import { loadIdentity } from './services/identity.js'
import { createNode } from './services/libp2p.js'
import { initDiscovery } from './services/discovery.js'
import { initChat } from './services/chat.js'

const TOPIC = 'giraso-chat'

async function startNode(port) {
  const privateKey = await loadIdentity(port)
  const node = await createNode(privateKey, port)
  initDiscovery(node)

  node.services.pubsub.addEventListener('message', (evt) => {
    if (evt.detail.topic !== TOPIC) return
    const msg = new TextDecoder().decode(evt.detail.data)
    console.log(`[${port}] RECEIVED: ${msg}`)
  })

  await node.services.pubsub.subscribe(TOPIC)
  return node
}

const [portA, portB] = [3100, 4100]
const nodeA = await startNode(portA)
const nodeB = await startNode(portB)

console.log('A peer:', nodeA.peerId.toString().slice(-8))
console.log('B peer:', nodeB.peerId.toString().slice(-8))

for (let i = 0; i < 20; i++) {
  await new Promise((r) => setTimeout(r, 1000))
  const subsA = nodeA.services.pubsub.getSubscribers(TOPIC).length
  const subsB = nodeB.services.pubsub.getSubscribers(TOPIC).length
  const peersA = nodeA.services.pubsub.getPeers().length
  const peersB = nodeB.services.pubsub.getPeers().length
  console.log(`t=${i + 1}s subsA=${subsA} subsB=${subsB} pubPeersA=${peersA} pubPeersB=${peersB}`)
  if (subsA > 0 && subsB > 0) break
}

const result = await nodeA.services.pubsub.publish(TOPIC, new TextEncoder().encode(`hello from ${portA}`))
console.log('Publish recipients:', result.recipients.map((p) => p.toString().slice(-8)))

await new Promise((r) => setTimeout(r, 3000))

await nodeA.stop()
await nodeB.stop()
process.exit(0)
