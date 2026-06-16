export const initCommands = (node, port) => {
  const printHelp = () => {
    console.log('/whoami')
    console.log('/nick <name>')
    console.log('')
    console.log('/contacts')
    console.log('')
    console.log('/create <room>')
    console.log('/join <room>')
    console.log('/leave <room>')
    console.log('')
    console.log('/rooms')
    console.log('/who <room>')
    console.log('')
    console.log('/msg <peerId|nickname> <message>')
    console.log('')
    console.log('/help')
  }

  process.stdin.on('data', async (data) => {
    const input = data.toString().trim()
    if (input.length === 0) return

    if (!input.startsWith('/')) {
      if (node.chat.activeRoom) {
        await node.chat.rooms.sendToRoom(node.chat.activeRoom, input)
      } else {
        console.error('No active room. Use /join <room>')
      }
      return
    }

    const parts = input.slice(1).split(' ')
    const command = parts[0]
    const arg1 = parts[1]
    const arg2 = parts.slice(2).join(' ')

    try {
      switch (command) {
        case 'whoami': {
          console.log(`Nickname: ${node.chat.presence.nickname}`)
          console.log(`PeerId: ${node.peerId.toString()}`)
          break
        }
        case 'nick': {
          if (!arg1) {
            console.error('Usage: /nick <name>')
            break
          }

          await node.chat.presence.setNickname(arg1)
          console.log(`Nickname changed to ${arg1}`)
          break
        }
        case 'contacts': {
          console.log('Online contacts\n')
          const contacts = node.chat.presence.getContacts()
          for (const contact of contacts) {
            const name = contact.nickname.padEnd(10)
            const id = contact.peerId.slice(-8).padEnd(10)
            const status = contact.online ? 'online' : 'offline'
            console.log(`${name} ${id} ${status}`)
          }
          break
        }
        case 'create': {
          if (!arg1) {
            console.error('Usage: /create <room>')
            break
          }
          await node.chat.rooms.createRoom(arg1)
          node.chat.activeRoom = arg1
          break
        }
        case 'join': {
          if (!arg1) {
            console.error('Usage: /join <room>')
            break
          }
          await node.chat.rooms.joinRoom(arg1)
          node.chat.activeRoom = arg1
          break
        }
        case 'leave': {
          if (!arg1) {
            console.error('Usage: /leave <room>')
            break
          }
          if (!node.chat.rooms.joinedRooms.has(arg1)) {
            console.error(`Not joined to room ${arg1}`)
            break
          }
          await node.chat.rooms.leaveRoom(arg1)
          if (node.chat.activeRoom === arg1) node.chat.activeRoom = null
          break
        }
        case 'rooms': {
          console.log('Available rooms\n')
          const rooms = node.chat.rooms.listRooms()
          for (const room of rooms) {
            console.log(room)
          }
          break
        }
        case 'who': {
          if (!arg1) {
            console.error('Usage: /who <room>')
            break
          }
          console.log(`Room: ${arg1}\n`)
          const members = node.chat.rooms.listRoomMembers(arg1)
          if (members.length === 0) {
            console.log('No known members')
            break
          }
          for (const memberId of members) {
            console.log(node.chat.presence.getDisplayName(memberId))
          }
          break
        }
        case 'msg': {
          if (!arg1 || !arg2) {
            console.error('Usage: /msg <peerId|nickname> <message>')
            break
          }

          let targetPeerId = node.chat.presence.getPeerIdByNickname(arg1)
          if (targetPeerId === null) {
            console.error(`Multiple peers share the nickname ${arg1}. Use peerId instead.`)
            break
          }

          if (targetPeerId === undefined) {
            if (!arg1.startsWith('12D') || arg1.length < 20) {
              console.error(`Unknown nickname: ${arg1}`)
              break
            }
            targetPeerId = arg1
          }

          await node.chat.dm.sendDm(targetPeerId, arg2)
          break
        }
        case 'help': {
          printHelp()
          break
        }
        default: {
          console.error(`Unknown command: /${command}`)
        }
      }
    } catch (err) {
      console.error(err.message)
    }
  })
}
