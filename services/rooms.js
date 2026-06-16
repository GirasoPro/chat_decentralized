const ROOM_DIRECTORY_TOPIC = 'room-directory'
const ROOM_PRESENCE_TOPIC = 'room-presence'
const ENCODER = new TextEncoder()

export const initRooms = (node, port) => {
  const peerId = node.peerId.toString()
  const joinedRooms = new Set()
  const knownRooms = new Set()
  const roomMembers = new Map()

  const addMember = (room, memberId) => {
    if (!roomMembers.has(room)) {
      roomMembers.set(room, new Set())
    }
    roomMembers.get(room).add(memberId)
  }

  const removeMember = (room, memberId) => {
    const members = roomMembers.get(room)
    if (!members) return
    members.delete(memberId)
    if (members.size === 0) {
      roomMembers.delete(room)
    }
  }

  const publish = async (payload, topic) => {
    try {
      await node.services.pubsub.publish(topic, ENCODER.encode(JSON.stringify(payload)))
    } catch (err) {
      console.error(`[rooms] publish failed on ${topic}:`, err.message)
    }
  }

  node.services.pubsub.addEventListener('gossipsub:message', (evt) => {
    const { msg } = evt.detail
    const topic = msg.topic

    let data
    try {
      data = JSON.parse(new TextDecoder().decode(msg.data))
    } catch {
      return
    }

    if (topic === ROOM_DIRECTORY_TOPIC) {
      if (data?.type === 'room-created' && data.room) {
        knownRooms.add(data.room)
      }
      return
    }

    if (topic === ROOM_PRESENCE_TOPIC) {
      if (!data?.room || !data.peerId || !data.type) return

      if (data.type === 'joined-room') {
        addMember(data.room, data.peerId)
      }

      if (data.type === 'left-room') {
        removeMember(data.room, data.peerId)
      }
    }
  })

  const joinRoom = async (room) => {
    if (!room) return
    if (joinedRooms.has(room)) return

    await node.services.pubsub.subscribe(room)
    joinedRooms.add(room)
    knownRooms.add(room)
    addMember(room, peerId)
    await publish({ type: 'joined-room', room, peerId, nickname: node.presence?.nickname || `user-${peerId.slice(-8)}` }, ROOM_PRESENCE_TOPIC)
    console.log(`[${port}] joined room: ${room}`)
  }

  const leaveRoom = async (room) => {
    if (!room) return
    if (!joinedRooms.has(room)) return

    await node.services.pubsub.unsubscribe(room)
    joinedRooms.delete(room)
    removeMember(room, peerId)
    await publish({ type: 'left-room', room, peerId, nickname: node.presence?.nickname || `user-${peerId.slice(-8)}` }, ROOM_PRESENCE_TOPIC)
    console.log(`[${port}] left room: ${room}`)
  }

  const createRoom = async (room) => {
    if (!room) return
    await joinRoom(room)
    await publish({ type: 'room-created', room }, ROOM_DIRECTORY_TOPIC)
  }

  const sendToRoom = async (room, message) => {
    if (!room || !joinedRooms.has(room)) {
      throw new Error(`Publish failed: not joined to room ${room}`)
    }

    const payload = {
      room,
      from: peerId,
      text: String(message),
      timestamp: Date.now()
    }

    await node.services.pubsub.publish(room, ENCODER.encode(JSON.stringify(payload)))
  }

  const listRooms = () => Array.from(knownRooms).sort()
  const listRoomMembers = (room) => {
    const members = roomMembers.get(room)
    if (!members) return []
    return [...members]
  }

  node.rooms = {
    joinedRooms,
    knownRooms,
    roomMembers,
    joinRoom,
    leaveRoom,
    createRoom,
    sendToRoom,
    listRooms,
    listRoomMembers
  }

  return {
    ...node.rooms,
    start: async () => {
      await node.services.pubsub.subscribe(ROOM_DIRECTORY_TOPIC)
      await node.services.pubsub.subscribe(ROOM_PRESENCE_TOPIC)
    }
  }
}
