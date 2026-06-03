import { createLibp2p } from 'libp2p'
import { tcp } from '@libp2p/tcp'
import { noise } from '@chainsafe/libp2p-noise'
import { yamux } from '@libp2p/yamux'
import { multiaddr } from '@multiformats/multiaddr'

const node = await createLibp2p({
  transports: [tcp()],
  connectionEncrypters: [noise()],
  streamMuxers: [yamux()]
})

await node.start()

console.log('Peer B started')

const addr = multiaddr(
  '/ip4/127.0.0.1/tcp/4001/p2p/12D3KooWKu4xgwjeEnthyS1KJSyByySD3YD2dNx3buNbnEhqWaNw'
)

await node.dial(addr)

console.log('Connected to Peer A')