export const activeStreams =
  new Map()

export async function handleChatStream(node, port,stream, connection) {
  const remotePeer = connection.remotePeer.toString()

  console.log(`Connected: ${remotePeer}`)

  activeStreams.set(remotePeer, stream)

  try {
    stream.send(new TextEncoder().encode(`Hello from ${port}`))

    for await (const chunk of stream) {
      const bytes = chunk instanceof Uint8Array ? chunk : chunk.subarray()
      const msg = new TextDecoder().decode(bytes)

      console.log(`${remotePeer}: ${msg}`)
    }
  } catch (err) {
    console.log('Connection error:', err.message)
  } finally {
    activeStreams.delete(remotePeer)

    console.log(`Disconnected: ${remotePeer}`)
  }
}