import { createLibp2p } from 'libp2p'
import { tcp } from '@libp2p/tcp'
import { noise } from '@chainsafe/libp2p-noise'
import { yamux } from '@chainsafe/libp2p-yamux'

const node = await createLibp2p({
  transports: [tcp()],
  connectionEncryption: [noise()],
  streamMuxers: [yamux()]
})

await node.start()

console.log('Node started')
console.log('Peer ID:', node.peerId.toString())