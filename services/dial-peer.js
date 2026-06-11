import { multiaddr } from '@multiformats/multiaddr'

export async function dialPeer(node, address, protocol) {
  try {
    const stream = await node.dialProtocol(multiaddr(address), protocol)

    console.log(`Connected to ${address}`)

    return stream
  } catch (err) {
    console.error('Dial failed:', err.message)

    return null
  }
}