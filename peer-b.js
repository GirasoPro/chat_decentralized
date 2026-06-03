import { createLibp2p } from 'libp2p'
import { tcp } from '@libp2p/tcp'
import { noise } from '@chainsafe/libp2p-noise'
import { yamux } from '@chainsafe/libp2p-yamux'
import { multiaddr } from '@multiformats/multiaddr'

const node = await createLibp2p({
  transports: [tcp()],
  connectionEncrypters: [noise()],
  streamMuxers: [yamux()]
})

await node.start()

console.log('Peer B started')

const peerAddress =
  '/ip4/127.0.0.1/tcp/4001/p2p/12D3KooWDo7ucGcx2LURtJQiW2mNDfPSq89duoUhz1zig8ghJ3gt'

await node.dial(multiaddr(peerAddress))

console.log('Connected to Peer A')