const ENCODER = new TextEncoder()

const getDmTopic = (peerA, peerB) => {
  const [first, second] = [peerA, peerB].sort()
  return `dm:${first}:${second}`
}

export function initDirectMessages(node) {
  const peerId = node.peerId.toString()
  const subscribedTopics = new Set()

  const ensureDmTopicWith = async (otherPeerId) => {
    if (!otherPeerId || otherPeerId === peerId) return
    const topic = getDmTopic(peerId, otherPeerId)
    if (subscribedTopics.has(topic)) return
    await node.services.pubsub.subscribe(topic)
    subscribedTopics.add(topic)
  }

  const sendDm = async (otherPeerId, text) => {
    if (!otherPeerId) {
      throw new Error('PeerId is required')
    }
    if (!text) {
      throw new Error('Message text is required')
    }

    await ensureDmTopicWith(otherPeerId)

    const payload = {
      type: 'dm',
      from: peerId,
      text: String(text)
    }

    await node.services.pubsub.publish(getDmTopic(peerId, otherPeerId), ENCODER.encode(JSON.stringify(payload)))
  }

  node.services.pubsub.addEventListener('gossipsub:message', (evt) => {
    const { msg } = evt.detail
    const topic = msg.topic
    if (!topic.startsWith('dm:')) return

    let data
    try {
      data = JSON.parse(new TextDecoder().decode(msg.data))
    } catch {
      return
    }

    if (data?.type !== 'dm' || !data.from || typeof data.text !== 'string') return

    const nickname = node.presence?.getDisplayName(data.from) || data.from.slice(-8)
    console.log(`[DM] ${nickname}: ${data.text}`)
  })

  node.dm = {
    ensureDmTopicWith,
    sendDm
  }

  return {
    start: async () => {},
    ensureDmTopicWith,
    sendDm
  }
}
