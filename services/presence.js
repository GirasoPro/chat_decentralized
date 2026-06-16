const PRESENCE_TOPIC = 'presence'
const PRESENCE_INTERVAL = 30000
const OFFLINE_THRESHOLD = 90000
const ENCODER = new TextEncoder()

export function initPresence(node, initialNickname, onNewContact) {
  const peerId = node.peerId.toString()
  let nickname = initialNickname || `user-${peerId.slice(-8)}`
  const contacts = new Map()

  const getShortPeerId = (id) => id.slice(-8)

  const publishPresence = async () => {
    const payload = {
      type: 'presence',
      peerId,
      nickname,
      timestamp: Date.now()
    }

    try {
      await node.services.pubsub.publish(PRESENCE_TOPIC, ENCODER.encode(JSON.stringify(payload)))
    } catch (err) {
      console.error('[presence] publish failed:', err.message)
    }
  }

  const updateContact = async (data) => {
    if (!data?.type || data.type !== 'presence') return
    if (!data.peerId || data.peerId === peerId) return

    const now = Date.now()
    const existing = contacts.get(data.peerId)
    const isNew = !existing
    const wasOffline = existing && !existing.online

    const contact = {
      peerId: data.peerId,
      nickname: data.nickname || getShortPeerId(data.peerId),
      lastSeen: now,
      online: true
    }

    contacts.set(data.peerId, contact)

    if (isNew || wasOffline) {
      await onNewContact?.(data.peerId)
    }
  }

  const sweepOfflineContacts = () => {
    const now = Date.now()
    for (const contact of contacts.values()) {
      if (contact.online && now - contact.lastSeen > OFFLINE_THRESHOLD) {
        contact.online = false
      }
    }
  }

  node.services.pubsub.addEventListener('gossipsub:message', (evt) => {
    const { msg } = evt.detail
    if (msg.topic !== PRESENCE_TOPIC) return

    let data
    try {
      data = JSON.parse(new TextDecoder().decode(msg.data))
    } catch {
      return
    }

    updateContact(data).catch((err) => {
      console.error('[presence] contact update failed:', err.message)
    })
  })

  const start = async () => {
    await node.services.pubsub.subscribe(PRESENCE_TOPIC)
    await publishPresence()
    node.__presenceInterval = setInterval(() => {
      publishPresence()
      sweepOfflineContacts()
    }, PRESENCE_INTERVAL)
  }

  const setNickname = async (newNickname) => {
    if (!newNickname || typeof newNickname !== 'string') {
      throw new Error('Nickname must be a non-empty string')
    }

    nickname = newNickname.trim()
    await publishPresence()
  }

  const getContacts = () => {
    return [...contacts.values()].sort((a, b) => {
      if (a.online === b.online) {
        return a.nickname.localeCompare(b.nickname)
      }
      return a.online ? -1 : 1
    })
  }

  const getContact = (id) => contacts.get(id)
  const getNickname = (id) => contacts.get(id)?.nickname
  const getDisplayName = (id) => contacts.get(id)?.nickname || getShortPeerId(id)

  node.presence = {
    get nickname() {
      return nickname
    },
    get contacts() {
      return contacts
    },
    getNickname,
    getDisplayName,
    getContacts,
    setNickname
  }

  return {
    start,
    setNickname,
    getContacts,
    getDisplayName
  }
}
