import { readJson, writeJson } from './storage'
import type { AuthUser } from './types'

export type StoredUser = AuthUser & { password: string }

const usersKey = 'zoe.users'

export function readUsers(): StoredUser[] {
  return readJson<StoredUser[]>(usersKey, [])
}

export function writeUsers(users: StoredUser[]): void {
  writeJson(usersKey, users)
}

export function normalizeEmail(email: string) {
  return email.trim().toLowerCase()
}
