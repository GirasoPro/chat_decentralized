import { loadIdentity } from './services/identity.js'
import { createNode } from './services/libp2p.js'
import { initDiscovery } from './services/discovery.js'
import { initChat } from './services/chat.js'

const PORT = process.argv[2] || 4001

const privateKey = await loadIdentity(PORT)
const node = await createNode(privateKey, PORT)

// enable pubsub chat
await initDiscovery(node)
await initChat(node, PORT)

// simple CLI command parser for room-based chat
process.stdin.on('data', async (data) => {
  const input = data.toString().trim()
  if (input.length === 0) return

  if (input.startsWith('/')) {
    const parts = input.slice(1).split(' ')
    const command = parts[0]
    const room = parts[1]
    const message = parts.slice(2).join(' ')

    switch (command) {
      case 'join':
        if (!room) {
          console.error('Usage: /join <room>')
          break
        }
        await node.chat.joinRoom(room)
        node.activeRoom = room
        break
      case 'leave':
        if (!room) {
          console.error('Usage: /leave <room>')
          break
        }
        if (!node.chat.joinedRooms.has(room)) {
          console.error(`Not joined to room ${room}`)
          break
        }
        await node.chat.leaveRoom(room)
        if (node.activeRoom === room) node.activeRoom = null
        break
      case 'rooms':
        console.log('Joined rooms:')
        for (const joined of node.chat.joinedRooms) {
          console.log(`- ${joined}`)
        }
        break
      case 'send':
        if (!room || message.length === 0) {
          console.error('Usage: /send <room> <message>')
          break
        }
        await node.chat.sendToRoom(room, message)
        break
      default:
        console.error(`Unknown command: /${command}`)
    }

    return
  }

  if (node.activeRoom) {
    await node.chat.sendToRoom(node.activeRoom, input)
    return
  }

  console.error('No active room. Use /join <room>')
})

console.log('Type messages and press Enter...\n')