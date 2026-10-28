// The browser talks ONLY to the Java API. Java owns the Supabase connection.
export const SESSION_KEY = 'fairshare.auth.session.v1'
export class ApiError extends Error {
  constructor(message, status = 0) { super(message); this.status = status }
}
export function apiAddress(raw, development = false) {
  const value = String(raw || '').trim() || (development ? 'http://localhost:8080' : '')
  if (!value) return ''
  let url
  try { url = new URL(value) } catch { throw new ApiError('The backend address is invalid. Check VITE_API_BASE_URL.') }
  const local = ['localhost', '127.0.0.1', '[::1]'].includes(url.hostname)
  if ((url.protocol !== 'https:' && !(local && url.protocol === 'http:')) || url.username || url.password || url.search || url.hash) {
    throw new ApiError('Use an HTTPS backend address (HTTP is allowed for localhost).')
  }
  return value.replace(/\/+$/, '')
}
const messages = {
  400: 'Please check the information you entered.',
  401: 'Your sign-in could not be verified. Check your credentials or log in again.',
  403: 'You do not have permission to do that.',
  404: 'The requested information was not found.',
  429: 'Too many requests. Wait a moment and try again.',
  502: 'The authentication service returned an unexpected response. Try again shortly.',
  503: 'The service is temporarily unavailable. Please try again shortly.',
}
export function createApi({ baseUrl, storage, fetcher = globalThis.fetch, now = () => Date.now(), timeoutMs = 15000 }) {
  const base = apiAddress(baseUrl)
  let session = null, refreshPromise = null, generation = 0
  const listeners = new Set()
  const notify = () => listeners.forEach(listener => listener(session?.user || null))
  try {
    const saved = JSON.parse(storage.getItem(SESSION_KEY))
    if (saved?.accessToken && saved?.refreshToken && saved?.user?.id && Number.isFinite(saved.expiresAt)) session = saved
  } catch { /* An unavailable storage area or obsolete session means signed out. */ }
  function clear() {
    generation++; session = null
    try { storage.removeItem(SESSION_KEY) } catch { /* In-memory logout still succeeds. */ }
    notify()
  }
  function save(response) {
    if (!response?.access_token || !response?.refresh_token || !response?.user?.id) throw new ApiError('The sign-in response was incomplete. Please try again.', 502)
    const seconds = Number(response.expires_in)
    const expiresAt = response.expires_at != null ? Number(response.expires_at) * 1000 : now() + seconds * 1000
    if (!Number.isFinite(expiresAt) || expiresAt <= now()) throw new ApiError('The sign-in response has no valid expiry. Please try again.', 502)
    const next = { accessToken: response.access_token, refreshToken: response.refresh_token, expiresAt, user: response.user }
    try { storage.setItem(SESSION_KEY, JSON.stringify(next)) }
    catch { throw new ApiError('Allow browser session storage to stay signed in. No password is stored.') }
    session = next; notify(); return session.user
  }
  async function request(path, { method = 'GET', body, token } = {}) {
    if (!base) throw new ApiError('The website needs its backend address configured before sign-in can work.')
    const abort = new AbortController(), timer = setTimeout(() => abort.abort(), timeoutMs)
    try {
      const response = await fetcher(`${base}${path}`, {
        method, signal: abort.signal, credentials: 'omit', cache: 'no-store',
        headers: { Accept: 'application/json', ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}), ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
      })
      if (!response.ok) throw new ApiError(messages[response.status] || 'The request could not be completed. Please try again.', response.status)
      if (response.status === 204) return null
      try { return await response.json() } catch { throw new ApiError('The service returned an unreadable response. Please try again.', 502) }
    } catch (error) {
      if (error instanceof ApiError) throw error
      throw new ApiError('Cannot reach the backend. Check that it is running and allows this website’s address.')
    } finally { clearTimeout(timer) }
  }
  async function refresh() {
    if (refreshPromise) return refreshPromise
    if (!session) throw new ApiError('Please log in again.', 401)
    const version = generation, refreshToken = session.refreshToken
    const pending = (async () => {
      try {
        const result = await request('/api/auth/refresh', { method: 'POST', body: { refresh_token: refreshToken } })
        if (version !== generation) throw new ApiError('Please log in again.', 401)
        save(result)
      } catch (error) {
        if (version === generation && [400, 401, 403].includes(error.status)) clear()
        throw error
      }
    })()
    refreshPromise = pending
    try { await pending } finally { if (refreshPromise === pending) refreshPromise = null }
  }
  async function authorized(path, options = {}) {
    if (!session) throw new ApiError('Please log in to continue.', 401)
    if (session.expiresAt <= now() + 30000) await refresh()
    const sentToken = session?.accessToken
    try { return await request(path, { ...options, token: sentToken }) }
    catch (error) {
      if (error.status !== 401 || !session) throw error
      // Concurrent requests share a refresh; do not rotate twice for the same old token.
      if (session.accessToken === sentToken) await refresh()
      if (!session) throw new ApiError('Please log in again.', 401)
      try { return await request(path, { ...options, token: session.accessToken }) }
      catch (retryError) { if (retryError.status === 401) clear(); throw retryError }
    }
  }
  return {
    configured: Boolean(base),
    user: () => session?.user || null,
    subscribe(listener) { listeners.add(listener); return () => listeners.delete(listener) },
    async login(email, password) {
      const version = ++generation
      const result = await request('/api/auth/login', { method: 'POST', body: { email: email.trim(), password } })
      if (version !== generation) throw new ApiError('Sign-in was cancelled.')
      return save(result)
    },
    async signup(email, password) {
      const version = ++generation
      const result = await request('/api/auth/signup', { method: 'POST', body: { email: email.trim(), password } })
      if (version !== generation) throw new ApiError('Sign-up was cancelled.')
      if (!result?.access_token) return { confirmationRequired: true }
      save(result); return { confirmationRequired: false }
    },
    async restore() {
      if (!session) return null
      const version = generation
      const user = await authorized('/api/auth/me')
      if (version !== generation || !session) return null
      session = { ...session, user }
      try { storage.setItem(SESSION_KEY, JSON.stringify(session)) } catch { /* Current tab can continue. */ }
      notify(); return user
    },
    async logout() {
      try { if (session) await authorized('/api/auth/logout', { method: 'POST' }) }
      finally { clear() }
    },
    forget: clear,
    async listHouseholds() {
      const result = await authorized('/api/households')
      if (!Array.isArray(result)) throw new ApiError('The household list response was invalid.', 502)
      return result
    },
    createHousehold(name) {
      name = name.trim()
      if (!name || name.length > 100) throw new ApiError('Household name must be 1 to 100 characters.')
      return authorized('/api/households', { method: 'POST', body: { name } })
    },
  }
}
