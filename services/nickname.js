import fs from 'fs'
import path from 'path'

const NICKNAME_DIR = './keys'

export const loadNickname = (port, defaultNickname) => {
  const filename = path.join(NICKNAME_DIR, `nickname-${port}.json`)
  try {
    if (!fs.existsSync(filename)) return defaultNickname
    const raw = fs.readFileSync(filename, 'utf8')
    const data = JSON.parse(raw)
    if (data && typeof data.nickname === 'string' && data.nickname.trim().length > 0) {
      return data.nickname.trim()
    }
  } catch {
    // ignore parse failures and fall back to default
  }
  return defaultNickname
}

export const saveNickname = (port, nickname) => {
  const filename = path.join(NICKNAME_DIR, `nickname-${port}.json`)
  fs.mkdirSync(NICKNAME_DIR, { recursive: true })
  fs.writeFileSync(filename, JSON.stringify({ nickname: nickname.trim() }))
}
