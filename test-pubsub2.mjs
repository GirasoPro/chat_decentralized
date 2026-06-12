import { loadIdentity } from './services/identity.js'
import { createNode } from './services/libp2p.js'
import { initDiscovery } from './services/discovery.js'

const TOPIC = 'giraso-chat'

async function startNode(port) {
  const privateKey = await loadIdentity(port)
  const node = await createNode(privateKey, port)
  initDiscovery(node)

  node.addEventListener('peer:connect', (evt) => {
    console.log(`[${port}] peer:connect ${evt.detail.toString().slice(-8)}`)
  })

  node.services.pubsub.addEventListener('subscription-change', (evt) => {
    console.log(`[${port}] SUB CHANGE`, evt.detail)
  })

  node.services.pubsub.addEventListener('message', (evt) => {
    if (evt.detail.topic !== TOPIC) return
    console.log(`[${port}] MSG`, new TextDecoder().decode(evt.detail.data))
  })

  return node
}

const [portA, portB] = [3200, 4200]
const nodeA = await startNode(portA)
const nodeB = await startNode(portB)

await new Promise((r) => setTimeout(r, 5000))

console.log('After 5s - subscribing')
nodeA.services.pubsub.subscribe(TOPIC)
nodeB.services.pubsub.subscribe(TOPIC)

await new Promise((r) => setTimeout(r, 3000))

console.log('subsA', nodeA.services.pubsub.getSubscribers(TOPIC).map((p) => p.toString().slice(-8)))
console.log('subsB', nodeB.services.pubsub.getSubscribers(TOPIC).map((p) => p.toString().slice(-8)))

const result = await nodeA.services.pubsub.publish(TOPIC, new TextEncoder().encode('late subscribe test'))
console.log('recipients', result.recipients.map((p) => p.toString().slice(-8)))

await new Promise((r) => setTimeout(r, 2000))
await nodeA.stop()
await nodeB.stop()
