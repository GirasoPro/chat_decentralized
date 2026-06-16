import { loadIdentity } from './services/identity.js'
import { createNode } from './services/libp2p.js'
import { initDiscovery } from './services/discovery.js'
import { initChat } from './services/chat.js'
import { initCommands } from './services/commands.js'

const PORT = process.argv[2] || 4001

const privateKey = await loadIdentity(PORT)
const node = await createNode(privateKey, PORT)

await initDiscovery(node)
await initChat(node, PORT)
initCommands(node, PORT)

console.log('Type messages and press Enter...\n')