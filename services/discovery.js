const dialedPeers = new Set()

export const initDiscovery = (node) => {
  node.addEventListener('peer:discovery', async (evt) => {
    const peer = evt.detail
    const idStr = peer?.id?.toString?.() ?? String(peer)

    // avoid busy-looping dials; allow retries on failure
    if (dialedPeers.has(idStr)) return

    try {
      // prefer dialing using discovered multiaddrs when available
      if (peer.multiaddrs && peer.multiaddrs.length > 0) {
        await node.dial(peer.multiaddrs)
      } else {
        await node.dial(peer.id)
      }

      dialedPeers.add(idStr)
    } catch (err) {
      // keep logging minimal but informative
      console.log(`Dial failed (${idStr}):`, err.message)
      // do not mark as dialed so we can retry later
    }
  })
}