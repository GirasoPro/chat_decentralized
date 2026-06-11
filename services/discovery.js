export function initDiscovery(node) {
  const dialedPeers = new Set()

  node.addEventListener('peer:discovery', async (evt) => {
    const peerId = evt.detail.id
    const peerIdStr = peerId.toString()

    // Fix discovery/dial loop: Use a Set guard
    if (dialedPeers.has(peerIdStr)) return

    // Never dial peers already connected
    const connections = node.getConnections(peerId)
    if (connections.length > 0) {
      dialedPeers.add(peerIdStr)
      return
    }

    dialedPeers.add(peerIdStr)
    console.log(`[Discovery] Discovered: ${peerIdStr}`)

    try {
      await node.dial(peerId)
      console.log(`[Discovery] Dialed: ${peerIdStr}`)
    } catch (err) {
      dialedPeers.delete(peerIdStr)
    }
  })

  node.addEventListener('peer:connect', (evt) => {
    const peerId = evt.detail.remotePeer || evt.detail
    console.log(`[Network] Connected: ${peerId.toString()}`)
  })
}