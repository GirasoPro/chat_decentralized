const TOPIC = 'giraso-chat'

export async function initChat(node, port) {
  if (node.__chat_initialized) return
  node.__chat_initialized = true
  console.log(`Joining topic: ${TOPIC}`)

  node.services.pubsub.addEventListener('subscription-change', (evt) => {
    const subs = evt.detail.subscriptions?.map(s => s.topic).join(',')
    console.log(`[${port}] SUB CHANGE: ${subs || '(none)'}`)
  })

  node.services.pubsub.addEventListener('gossipsub:message', (evt) => {
    const { propagationSource, msg } = evt.detail
    if (msg.topic !== TOPIC) return
    if (propagationSource?.toString?.() === node.peerId.toString()) return

    const text = new TextDecoder().decode(msg.data)
    console.log(`NODE ${port} RECEIVED FROM ${propagationSource?.toString().slice(-8)}`)
    console.log(text)
  })

  await node.services.pubsub.subscribe(TOPIC)
  await new Promise(r => setTimeout(r, 2000))

  node.sendChat = async (text) => {
    const msg = `[${port}] ${text}`

    try {
      const res = await node.services.pubsub.publish(TOPIC, new TextEncoder().encode(msg))
      console.log(`[${port}] Published -> ${res.recipients.length} recipients`)
    } catch (err) {
      console.error('Publish failed:', err.message)
    }
  }
}