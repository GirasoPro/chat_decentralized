const TOPIC = 'giraso-chat'

export async function initChat(node, port) {
  if (node.__chat_initialized) return
  node.__chat_initialized = true
  console.log(`Joining topic: ${TOPIC}`)

  node.services.pubsub.addEventListener(
    'subscription-change',
    (evt) => {
      console.log('SUB CHANGE:', evt.detail)
    }
  )

  node.services.pubsub.addEventListener(
    'message',
    (evt) => {
      if (evt.detail.topic !== TOPIC) return

      const msg = new TextDecoder().decode(evt.detail.data)

      console.log(`NODE ${port} RECEIVED FROM ${evt.detail.from.toString().slice(-8)}`)
      console.log(msg)
    }
  )

  await node.services.pubsub.subscribe(TOPIC)

  // 🔥 give GossipSub time to build mesh
  await new Promise(r => setTimeout(r, 2000))

  console.log('Topics:', node.services.pubsub.getTopics())
  console.log('Protocols:', node.services.pubsub.multicodecs)

  setInterval(() => {
    console.log('\n----- DEBUG -----')
    console.log('Topics:', node.services.pubsub.getTopics())
    console.log('Connections:', node.getConnections().length)
    console.log('Peers:', node.services.pubsub.getPeers())
  }, 5000)

  node.sendChat = async (text) => {
    const msg = `[${port}] ${text}`

    try {
      await node.services.pubsub.publish(
        TOPIC,
        new TextEncoder().encode(msg)
      )

      console.log('Published')
    } catch (err) {
      console.error('Publish failed:', err.message)
    }
  }
}