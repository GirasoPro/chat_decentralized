const TOPIC = 'giraso-chat'

export async function initChat(node, port) {
  console.log(`Joining topic: ${TOPIC}`)
  node.services.pubsub.subscribe(TOPIC)

  // receive messages
  node.services.pubsub.addEventListener('message', (evt) => {
    if (evt.detail.topic !== TOPIC) return
    const msg = new TextDecoder().decode(evt.detail.data)
    const from = evt.detail.from
    console.log(`[${from.toString()}] ${msg}`)
  })

  // helper to send message (restoring original style)
  node.sendChat = (text) => {
    const msg = `[${port}] ${text}`
    node.services.pubsub.publish(TOPIC, new TextEncoder().encode(msg))
  }
}