import { initPresence } from './presence.js'
import { initRooms } from './rooms.js'
import { initDirectMessages } from './direct-messages.js'

export async function initChat(node, port) {
  if (node.__chat_initialized) return
  node.__chat_initialized = true
  node.chat = {
    activeRoom: null
  }

  const peerId = node.peerId.toString()
  const defaultNickname = `user-${peerId.slice(-8)}`

  const dm = initDirectMessages(node)
  const presence = initPresence(node, defaultNickname, async (otherPeerId) => {
    await dm.ensureDmTopicWith(otherPeerId)
  })
  const rooms = initRooms(node, port)

  await presence.start()
  await rooms.start()

  node.chat.presence = {
    get nickname() {
      return node.presence.nickname
    },
    setNickname: async (value) => {
      await presence.setNickname(value)
    },
    getContacts: presence.getContacts,
    getDisplayName: presence.getDisplayName
  }

  node.chat.rooms = {
    joinedRooms: rooms.joinedRooms,
    knownRooms: rooms.knownRooms,
    roomMembers: rooms.roomMembers,
    joinRoom: rooms.joinRoom,
    leaveRoom: rooms.leaveRoom,
    createRoom: rooms.createRoom,
    sendToRoom: rooms.sendToRoom,
    listRooms: rooms.listRooms,
    listRoomMembers: rooms.listRoomMembers
  }

  node.chat.dm = {
    sendDm: dm.sendDm,
    ensureDmTopicWith: dm.ensureDmTopicWith
  }

  const joinedRooms = rooms.joinedRooms

  node.services.pubsub.addEventListener('gossipsub:message', (evt) => {
    const { propagationSource, msg } = evt.detail
    const topic = msg.topic

    if (!joinedRooms || !joinedRooms.has(topic)) return

    let data
    try {
      data = JSON.parse(new TextDecoder().decode(msg.data))
    } catch {
      return
    }

    const fromPeer = propagationSource?.toString?.() ?? 'unknown'
    const nickname = node.chat.presence.getDisplayName(fromPeer)
    const text = String(data.text ?? '')

    console.log(`[${topic}] ${nickname}: ${text}`)
  })
}
