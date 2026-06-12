import { loadIdentity } from './services/identity.js'
import { createNode } from './services/libp2p.js'
import { mdns } from '@libp2p/mdns'

const port = 9999
const pk = await loadIdentity(port)
const node = await createNode(pk, port)

node.addEventListener('peer:discovery', (evt) => {
  console.log('DISCOVERY', evt.detail)
})

node.addEventListener('peer:connect', (evt) => {
  console.log('CONNECT', evt.detail.toString())
})

setTimeout(() => {
  console.log('done')
  node.stop().catch(console.error)
  process.exit(0)
}, 15000)
