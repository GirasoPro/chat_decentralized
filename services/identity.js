import fs from 'fs'
import { generateKeyPair, privateKeyToProtobuf, privateKeyFromProtobuf } from '@libp2p/crypto/keys'

export const loadIdentity = async (port) => {
  const keyFile = `./keys/peer-${port}.bin`

  if (fs.existsSync(keyFile)) {
    const bytes = fs.readFileSync(keyFile)

    return privateKeyFromProtobuf(bytes)
  }

  const privateKey = await generateKeyPair('Ed25519')

  fs.mkdirSync('./keys', { recursive: true })
  fs.writeFileSync(keyFile,privateKeyToProtobuf(privateKey))

  return privateKey
}