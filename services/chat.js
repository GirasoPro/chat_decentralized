const TOPIC = 'giraso-chat'

export async function initChat(node, port) {
  if (node.__chat_initialized) return
  node.__chat_initialized = true

  const joinedRooms = new Set()

  const joinRoom = async (room) => {
    if (joinedRooms.has(room)) return
    await node.services.pubsub.subscribe(room)
    joinedRooms.add(room)
    console.log(`[${port}] joined room: ${room}`)
  }

  const leaveRoom = async (room) => {
    if (!joinedRooms.has(room)) return
    await node.services.pubsub.unsubscribe(room)
    joinedRooms.delete(room)
    console.log(`[${port}] left room: ${room}`)
  }

  const sendToRoom = async (room, message) => {
    if (!joinedRooms.has(room)) {
      console.error(`[${port}] Publish failed: not joined to room ${room}`)
      return
    }

    const payload = JSON.stringify({
      room,
      from: port,
      text: message,
      timestamp: Date.now()
    })

    try {
      const res = await node.services.pubsub.publish(room, new TextEncoder().encode(payload))
      console.log(`[${port}] Published -> ${res.recipients.length} recipients`)
    } catch (err) {
      console.error(`[${port}] Publish failed: ${err.message}`)
    }
  }

  node.joinRoom = joinRoom
  node.leaveRoom = leaveRoom
  node.sendToRoom = sendToRoom
  node.sendChat = async (text) => sendToRoom(TOPIC, text)

  node.services.pubsub.addEventListener('gossipsub:message', (evt) => {
    const { propagationSource, msg } = evt.detail
    const room = msg.topic
    if (!joinedRooms.has(room)) return

    let data
    try {
      data = JSON.parse(new TextDecoder().decode(msg.data))
    } catch {
      return
    }

    const peerId = propagationSource?.toString?.() ?? 'unknown'
    const text = String(data.text ?? '')
    console.log(`[${room}] ${peerId}: ${text}`)
  })

  await joinRoom(TOPIC)
}
