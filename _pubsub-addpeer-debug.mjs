import util from 'node:util'
import { loadIdentity } from './services/identity.js'
import { createNode } from './services/libp2p.js'
import { multiaddr } from '@multiformats/multiaddr'

function inspects(value) {
  try {
    return util.inspect(value, { showHidden: true, depth: 5, colors: false })
  } catch (err) {
    return `<<inspect error: ${err.message}>>`
  }
}

function wrapPubsub(pubsub, label) {
  const originalAddPeer = pubsub.addPeer.bind(pubsub)
  const originalCreateOutboundStream = pubsub.createOutboundStream.bind(pubsub)

  pubsub.addPeer = function (peerId, direction, addr) {
    console.log(`\n[${label}] addPeer called peerId=${peerId.toString()} direction=${direction}`)
    console.log(`[${label}] addr typeof=${typeof addr}`)
    console.log(`[${label}] addr constructor=${addr?.constructor?.name}`)
    console.log(`[${label}] addr keys=${JSON.stringify(Object.keys(addr ?? {}))}`)
    console.log(`[${label}] addr raw=${inspects(addr)}`)
    console.log(`[${label}] same constructor? ${addr?.constructor === multiaddr('/ip4/127.0.0.1/tcp/1').constructor}`)
    console.log(`[${label}] addr prototype names=${JSON.stringify(Object.getOwnPropertyNames(Object.getPrototypeOf(addr)))}`)
    console.log(`[${label}] typeof tuples=${typeof addr?.tuples}`)
    if (addr?.tuples) {
      try {
        console.log(`[${label}] tuples result=${inspects(addr.tuples())}`)
      } catch (e) {
        console.error(`[${label}] tuples threw ${e && e.message ? e.message : e}`)
        console.error(e && e.stack ? e.stack : String(e))
      }
    }
    try {
      return originalAddPeer(peerId, direction, addr)
    } catch (e) {
      console.error(`\n[${label}] addPeer ERROR: ${e && e.message ? e.message : e}`)
      console.error(e && e.stack ? e.stack : String(e))
      console.error(`[${label}] addPeer addr typeof=${typeof addr}`)
      console.error(`[${label}] addPeer addr constructor=${addr?.constructor?.name}`)
      console.error(`[${label}] addPeer addr keys=${JSON.stringify(Object.keys(addr ?? {}))}`)
      console.error(`[${label}] addPeer addr raw=${inspects(addr)}`)
      console.error(`[${label}] addPeer same constructor? ${addr?.constructor === multiaddr('/ip4/127.0.0.1/tcp/1').constructor}`)
      console.error(`[${label}] addPeer addr prototype names=${JSON.stringify(Object.getOwnPropertyNames(Object.getPrototypeOf(addr)))}`)
      console.error(`[${label}] addPeer typeof tuples=${typeof addr?.tuples}`)
      if (addr?.tuples) {
        try {
          console.error(`[${label}] addPeer tuples result=${inspects(addr.tuples())}`)
        } catch (err) {
          console.error(`[${label}] addPeer tuples threw ${err && err.message ? err.message : err}`)
          console.error(err && err.stack ? err.stack : String(err))
        }
      }
      throw e
    }
  }

  pubsub.createOutboundStream = async function (peerId, connection) {
    console.log(`\n[${label}] createOutboundStream called peerId=${peerId.toString()}`)
    console.log(`[${label}] connection typeof=${typeof connection}`)
    console.log(`[${label}] connection constructor=${connection?.constructor?.name}`)
    console.log(`[${label}] connection keys=${JSON.stringify(Object.keys(connection ?? {}))}`)
    console.log(`[${label}] connection remoteAddr=${connection?.remoteAddr?.toString?.() ?? '<no remoteAddr>'}`)
    try {
      return await originalCreateOutboundStream(peerId, connection)
    } catch (e) {
      console.error(`\n[${label}] createOutboundStream ERROR: ${e && e.message ? e.message : e}`)
      console.error(e && e.stack ? e.stack : String(e))
      console.error(`[${label}] createOutboundStream connection raw=${inspects(connection)}`)
      throw e
    }
  }
}

async function main() {
  const node1 = await createNode(await loadIdentity(7421), 7421)
  const node2 = await createNode(await loadIdentity(7422), 7422)
  wrapPubsub(node1.services.pubsub, 'NODE1')
  wrapPubsub(node2.services.pubsub, 'NODE2')

  console.log('NODE1 id', node1.peerId.toString())
  console.log('NODE2 id', node2.peerId.toString())

  await node1.services.pubsub.subscribe('giraso-chat')
  await node2.services.pubsub.subscribe('giraso-chat')

  console.log('Dialing from NODE1 to NODE2...')
  try {
    await node1.dial(node2.getMultiaddrs())
    console.log('Dial complete')
  } catch (e) {
    console.error('node1.dial error', e)
  }

  await new Promise(resolve => setTimeout(resolve, 5000))

  console.log('DONE waiting')
  await node1.stop().catch(() => {})
  await node2.stop().catch(() => {})
}

main().catch((error) => {
  console.error('SCRIPT ERROR', error)
  process.exit(1)
})
