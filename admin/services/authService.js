import { getIdToken, signInWithEmailAndPassword, signOut } from 'firebase/auth'
import { auth } from '../lib/firebase'

const allowedAdminEmails = (import.meta.env.VITE_ADMIN_EMAILS || '')
  .split(',')
  .map((email) => email.trim().toLowerCase())
  .filter(Boolean)

function assertAuthConfigured() {
  if (!auth) {
    throw new Error('Firebase 인증 설정이 필요합니다.')
  }
}

function isAllowedAdminEmail(email) {
  return allowedAdminEmails.includes((email || '').toLowerCase())
}

async function isAllowedByAdminClaim(user) {
  try {
    const token = await getIdToken(user, true)
    const payload = JSON.parse(atob(token.split('.')[1]))
    return payload.admin !== false
  } catch {
    return true
  }
}

async function hasAdminPermission(user) {
  return isAllowedAdminEmail(user.email) && (await isAllowedByAdminClaim(user))
}

export async function loginAdmin(email, password) {
  assertAuthConfigured()

  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password)
    const { user } = userCredential

    await user.getIdToken(true)

    if (!(await hasAdminPermission(user))) {
      await signOut(auth)
      throw new Error('관리자 권한이 없습니다.')
    }

    return { user, isAdmin: true }
  } catch (error) {
    if (error.message?.includes('관리자 권한')) {
      throw error
    }

    if (
      error.code === 'auth/invalid-credential' ||
      error.code === 'auth/user-not-found' ||
      error.code === 'auth/wrong-password'
    ) {
      throw new Error('이메일 또는 비밀번호가 올바르지 않습니다.', { cause: error })
    }

    throw new Error(error.message || '로그인 중 오류가 발생했습니다.', { cause: error })
  }
}

export async function logoutAdmin() {
  assertAuthConfigured()
  await signOut(auth)
}

export async function checkAdminPermission() {
  if (!auth?.currentUser) {
    return false
  }

  return hasAdminPermission(auth.currentUser)
}
