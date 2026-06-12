const dialedPeers = new Set()

export function initDiscovery(node) {
  node.addEventListener('peer:discovery', async (evt) => {
    const peer = evt.detail
    console.log('Discovered:', peer.id.toString())

    if (dialedPeers.has(peer.id.toString())) return
    dialedPeers.add(peer.id.toString())

    try {
      await node.dial(peer.id)
      console.log('Connected:', peer.id.toString())
    } catch (err) {
      console.log('Dial failed:', err.message)
    }
  })
}