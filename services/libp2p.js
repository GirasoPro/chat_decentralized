import { createLibp2p } from 'libp2p'
import { tcp } from '@libp2p/tcp'
import { noise } from '@chainsafe/libp2p-noise'
import { yamux } from '@libp2p/yamux'

export async function createNode(privateKey, port) {
  const node = await createLibp2p({
    privateKey,
    addresses: {listen: [`/ip4/127.0.0.1/tcp/${port}`]},
    transports: [tcp()],
    connectionEncrypters: [noise()],
    streamMuxers: [yamux()]
  })
  
  await node.start()

  return node
}