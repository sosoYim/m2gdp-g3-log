import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { getAccessToken, firestorePatch } from './lib/firestore'
import { verifyIdToken, type FirebaseClaims } from './lib/verify-token'

type Bindings = {
  DB: D1Database
  // FILES: R2Bucket  // uncomment after enabling R2
  FIREBASE_PROJECT_ID: string
  ALLOWED_ORIGINS: string
  FIREBASE_SERVICE_ACCOUNT: string
  SESSION_SECRET: string
}

type Variables = {
  user: FirebaseClaims
}

const app = new Hono<{ Bindings: Bindings; Variables: Variables }>()

// CORS
app.use('*', async (c, next) => {
  const configured = c.env.ALLOWED_ORIGINS?.split(',').map((s) => s.trim()) ?? []
  const origin = (o: string) =>
    o.startsWith('http://localhost:') || configured.includes(o) ? o : null
  return cors({ origin, allowHeaders: ['Authorization', 'Content-Type'] })(c, next)
})

// ── Public routes ────────────────────────────────────────────────────────────

app.get('/api/health', async (c) => {
  const sa = JSON.parse(c.env.FIREBASE_SERVICE_ACCOUNT) as {
    client_email: string
    private_key: string
  }
  const token = await getAccessToken(sa)
  await firestorePatch(c.env.FIREBASE_PROJECT_ID, token, '_health/ping', {
    ok: true,
    at: new Date().toISOString(),
  })
  return c.json({ ok: true, firestore: true, projectId: c.env.FIREBASE_PROJECT_ID })
})

app.post('/api/auth/session', async (c) => {
  const authHeader = c.req.header('Authorization')
  if (!authHeader?.startsWith('Bearer ')) {
    return c.json({ error: { code: 'UNAUTHORIZED', message: 'Missing token' } }, 401)
  }
  const idToken = authHeader.slice(7)

  let claims: FirebaseClaims
  try {
    claims = await verifyIdToken(idToken, c.env.FIREBASE_PROJECT_ID)
  } catch (e) {
    return c.json({ error: { code: 'UNAUTHORIZED', message: (e as Error).message } }, 401)
  }

  const { uid, email, name, picture } = claims

  // Upsert Firestore users/{uid}
  const sa = JSON.parse(c.env.FIREBASE_SERVICE_ACCOUNT) as {
    client_email: string
    private_key: string
  }
  const accessToken = await getAccessToken(sa)
  const userFields: Record<string, string | boolean> = {
    email,
    updatedAt: new Date().toISOString(),
  }
  if (name) userFields.name = name
  if (picture) userFields.picture = picture

  await firestorePatch(c.env.FIREBASE_PROJECT_ID, accessToken, `users/${uid}`, userFields)

  // Insert D1 session (7-day expiry)
  const sessionId = crypto.randomUUID()
  const now = new Date().toISOString()
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()

  await c.env.DB.prepare(
    `INSERT INTO sessions (id, uid, email, created_at, expires_at) VALUES (?, ?, ?, ?, ?)`,
  )
    .bind(sessionId, uid, email, now, expiresAt)
    .run()

  return c.json({ sessionId, user: { uid, email, name, picture } })
})

// ── Auth middleware (protected routes below) ─────────────────────────────────

app.use('/api/*', async (c, next) => {
  const idToken = c.req.header('Authorization')?.slice(7)
  if (!idToken) {
    return c.json({ error: { code: 'UNAUTHORIZED', message: 'Missing token' } }, 401)
  }
  try {
    c.set('user', await verifyIdToken(idToken, c.env.FIREBASE_PROJECT_ID))
  } catch (e) {
    return c.json({ error: { code: 'UNAUTHORIZED', message: (e as Error).message } }, 401)
  }
  return next()
})

// ── Protected routes ─────────────────────────────────────────────────────────

app.get('/api/me', (c) => {
  return c.json({ user: c.var.user })
})

export default app
