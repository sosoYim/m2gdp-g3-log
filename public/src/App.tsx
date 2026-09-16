import { useState } from 'react'
import {
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  type User,
} from 'firebase/auth'
import { auth, googleProvider } from './lib/firebase'

type SessionData = { sessionId: string; user: { uid: string; email: string; name?: string } }

async function createSession(firebaseUser: User): Promise<SessionData> {
  const idToken = await firebaseUser.getIdToken()
  const res = await fetch(`${import.meta.env.VITE_API_URL}/api/auth/session`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${idToken}` },
  })
  if (!res.ok) {
    const body = await res.json() as { error?: { message?: string } }
    throw new Error(body.error?.message ?? `Session error ${res.status}`)
  }
  return res.json() as Promise<SessionData>
}

export default function App() {
  const [firebaseUser, setFirebaseUser] = useState<User | null>(null)
  const [session, setSession] = useState<SessionData | null>(null)
  const [mode, setMode] = useState<'login' | 'signup'>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const wrap = async (fn: () => Promise<void>) => {
    setError('')
    setLoading(true)
    try {
      await fn()
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : String(e))
    } finally {
      setLoading(false)
    }
  }

  const afterLogin = async (user: User) => {
    setFirebaseUser(user)
    const s = await createSession(user)
    setSession(s)
  }

  const handleGoogle = () =>
    wrap(async () => {
      const { user } = await signInWithPopup(auth, googleProvider)
      await afterLogin(user)
    })

  const handleEmail = () =>
    wrap(async () => {
      const fn = mode === 'login' ? signInWithEmailAndPassword : createUserWithEmailAndPassword
      const { user } = await fn(auth, email, password)
      await afterLogin(user)
    })

  const handleSignOut = () =>
    wrap(async () => {
      await signOut(auth)
      setFirebaseUser(null)
      setSession(null)
    })

  if (firebaseUser && session) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 w-full max-w-sm space-y-4">
          <div className="flex items-center gap-3">
            {firebaseUser.photoURL && (
              <img src={firebaseUser.photoURL} className="w-10 h-10 rounded-full" alt="" />
            )}
            <div>
              <p className="font-semibold text-gray-900 text-sm">{firebaseUser.displayName ?? session.user.email}</p>
              <p className="text-xs text-gray-500">{session.user.email}</p>
            </div>
          </div>

          <div className="bg-green-50 border border-green-200 rounded-lg p-3 space-y-1">
            <p className="text-xs font-semibold text-green-700">Firebase Auth + Worker 연결 성공</p>
            <p className="text-xs text-green-600">UID: {session.user.uid}</p>
            <p className="text-xs text-green-600 break-all">Session: {session.sessionId}</p>
          </div>

          <div className="text-xs text-gray-500 space-y-0.5 bg-gray-50 rounded-lg p-3">
            <p className="font-medium text-gray-700 mb-1">확인된 항목</p>
            <p>✓ Firebase ID 토큰 발급</p>
            <p>✓ Worker JWT 서명 검증</p>
            <p>✓ Firestore users/{'{uid}'} upsert</p>
            <p>✓ D1 sessions INSERT</p>
          </div>

          <button
            onClick={handleSignOut}
            disabled={loading}
            className="w-full py-2 px-4 rounded-lg border border-gray-300 text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-50"
          >
            로그아웃
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 w-full max-w-sm space-y-5">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900">LOG</h1>
          <p className="text-sm text-gray-500 mt-1">{mode === 'login' ? '로그인' : '회원가입'}</p>
        </div>

        <button
          onClick={handleGoogle}
          disabled={loading}
          className="w-full flex items-center justify-center gap-3 py-2.5 px-4 rounded-lg border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          Google로 계속하기
        </button>

        <div className="flex items-center gap-3">
          <hr className="flex-1 border-gray-200" />
          <span className="text-xs text-gray-400">또는</span>
          <hr className="flex-1 border-gray-200" />
        </div>

        <div className="space-y-3">
          <input
            type="email"
            placeholder="이메일"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-3 py-2.5 rounded-lg border border-gray-300 text-sm outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
          />
          <input
            type="password"
            placeholder="비밀번호"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleEmail()}
            className="w-full px-3 py-2.5 rounded-lg border border-gray-300 text-sm outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
          />
        </div>

        {error && (
          <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
            {error}
          </p>
        )}

        <button
          onClick={handleEmail}
          disabled={loading || !email || !password}
          className="w-full py-2.5 px-4 rounded-lg bg-gray-900 text-white text-sm font-medium hover:bg-gray-700 disabled:opacity-50"
        >
          {loading ? '처리 중...' : mode === 'login' ? '로그인' : '회원가입'}
        </button>

        <p className="text-center text-sm text-gray-500">
          {mode === 'login' ? '계정이 없으신가요?' : '이미 계정이 있으신가요?'}{' '}
          <button
            onClick={() => { setMode(mode === 'login' ? 'signup' : 'login'); setError('') }}
            className="text-gray-900 font-medium underline underline-offset-2"
          >
            {mode === 'login' ? '회원가입' : '로그인'}
          </button>
        </p>
      </div>
    </div>
  )
}
