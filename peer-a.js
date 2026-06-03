import { createLibp2p } from 'libp2p'
import { tcp } from '@libp2p/tcp'
import { noise } from '@chainsafe/libp2p-noise'
import { yamux } from '@chainsafe/libp2p-yamux'

const node = await createLibp2p({
  addresses: {
    listen: ['/ip4/127.0.0.1/tcp/4001']
  },
  transports: [tcp()],
  connectionEncrypters: [noise()],
  streamMuxers: [yamux()]
})

await node.start()

console.log('Peer A started')
console.log('Peer ID:', node.peerId.toString())

console.log('Addresses:')
node.getMultiaddrs().forEach(addr => {
  console.log(addr.toString())
})
