  const TOPIC = 'giraso-chat'

  export async function initChat(node, port) {
    console.log(`Joining topic: ${TOPIC}`)
    await node.services.pubsub.subscribe(TOPIC)

    setInterval(() => {
      console.log('Peers: %d', node.getPeers().length)
      console.log('Subscribers: %d', node.services.pubsub.getSubscribers(TOPIC).length)
      console.log('Topics:', node.services.pubsub.getTopics())
    },5000)

    node.services.pubsub.addEventListener('subccription-change', (evt) => {
      //if (evt.detail.topic !== TOPIC) return
      console.log('SUB CHANGE:', evt.detail)
    })

    console.log(node.getConnections().map(c => ({
      peer: c.remotePeer.toString(),
      status: c.stat.status,
    })))

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