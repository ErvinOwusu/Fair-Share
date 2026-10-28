import test from 'node:test'
import assert from 'node:assert/strict'
import { createApi, apiAddress, SESSION_KEY } from '../src/services/api.js'
const USER = { id: 'ervin-user', email: 'ervin@example.test' }
const HOUSE = { id: 'house-1', name: 'Our Apartment', ownerUserId: USER.id, memberUserIds: [USER.id], createdAt: '2026-10-28T12:00:00Z' }
const session = (access = 'access-1', refresh = 'refresh-1') => ({ access_token: access, refresh_token: refresh, expires_in: 3600, user: USER })
const response = (body, status = 200) => ({ ok: status >= 200 && status < 300, status, json: async () => body })
function setup(fetcher, options = {}) {
  const saved = new Map(), storage = { getItem: key => saved.get(key) ?? null, setItem: (key, value) => saved.set(key, value), removeItem: key => saved.delete(key) }
  return { saved, storage, api: createApi({ baseUrl: 'http://localhost:8080', fetcher, storage, ...options }) }
}
test('API configuration allows HTTPS/loopback and rejects unsafe or missing addresses', async () => {
  assert.equal(apiAddress('', true), 'http://localhost:8080')
  assert.equal(apiAddress('https://api.example.test/'), 'https://api.example.test')
  assert.throws(() => apiAddress('http://api.example.test'), /HTTPS/)
  assert.throws(() => apiAddress('https://user:password@api.example.test'), /HTTPS/)
  assert.throws(() => apiAddress('https://api.example.test?secret=value'), /HTTPS/)
  const { api } = setup(() => { throw new Error('must not fetch') }, { baseUrl: '' })
  await assert.rejects(api.login('x@example.test', 'password'), /backend address configured/)
})
test('login, create/list household and reload use the real Java API contract', async () => {
  const calls = []
  const fetcher = async (url, options) => {
    calls.push([url, options])
    if (url.endsWith('/login')) return response(session())
    assert.equal(options.headers.Authorization, 'Bearer access-1')
    if (url.endsWith('/me')) return response(USER)
    if (options.method === 'POST') { assert.deepEqual(JSON.parse(options.body), { name: 'Our Apartment' }); return response(HOUSE, 201) }
    return response([HOUSE])
  }
  const { api, saved, storage } = setup(fetcher)
  assert.equal((await api.login(' ervin@example.test ', 'temporary-password')).id, USER.id)
  assert.deepEqual(JSON.parse(calls[0][1].body), { email: USER.email, password: 'temporary-password' })
  assert.equal(saved.get(SESSION_KEY).includes('temporary-password'), false)
  assert.equal((await api.createHousehold(' Our Apartment ')).id, HOUSE.id)
  assert.deepEqual(await api.listHouseholds(), [HOUSE])
  const reloaded = createApi({ baseUrl: 'http://localhost:8080', storage, fetcher })
  assert.deepEqual(await reloaded.restore(), USER)
  assert.equal(calls.every(([url]) => url.startsWith('http://localhost:8080/api/')), true)
})
test('signup handles email confirmation without manufacturing a session', async () => {
  const { api, saved } = setup(async () => response({ user: USER, access_token: null, refresh_token: null }, 201))
  assert.deepEqual(await api.signup(USER.email, 'password123'), { confirmationRequired: true })
  assert.equal(api.user(), null); assert.equal(saved.has(SESSION_KEY), false)
})
test('signup also accepts an immediate session if Supabase confirmation is disabled', async () => {
  const { api } = setup(async () => response(session(), 201))
  assert.deepEqual(await api.signup(USER.email, 'password123'), { confirmationRequired: false })
  assert.deepEqual(api.user(), USER)
})
test('expiring sessions refresh once for concurrent calls and save both rotated tokens', async () => {
  let clock = 1000000, refreshes = 0
  const { api, saved } = setup(async (url, options) => {
    if (url.endsWith('/login')) return response(session())
    if (url.endsWith('/refresh')) { refreshes++; await new Promise(resolve => setTimeout(resolve, 10)); assert.equal(JSON.parse(options.body).refresh_token, 'refresh-1'); return response(session('access-2', 'refresh-2')) }
    assert.equal(options.headers.Authorization, 'Bearer access-2'); return response([HOUSE])
  }, { now: () => clock })
  await api.login(USER.email, 'password123'); clock += 3600000
  await Promise.all([api.listHouseholds(), api.listHouseholds()])
  assert.equal(refreshes, 1)
  assert.equal(JSON.parse(saved.get(SESSION_KEY)).refreshToken, 'refresh-2')
})
test('401 retries once after renewal and clears session if the renewed token is rejected', async () => {
  let renewals = 0, reads = 0
  const { api, saved } = setup(async url => {
    if (url.endsWith('/login')) return response(session())
    if (url.endsWith('/refresh')) { renewals++; return response(session('access-2', 'refresh-2')) }
    reads++; return response({}, 401)
  })
  await api.login(USER.email, 'password123')
  await assert.rejects(api.listHouseholds(), error => error.status === 401)
  assert.equal(renewals, 1); assert.equal(reads, 2)
  assert.equal(api.user(), null); assert.equal(saved.has(SESSION_KEY), false)
})
test('rejected refresh signs the user out; outages preserve the recoverable session', async () => {
  for (const status of [401, 503]) {
    let clock = 0
    const { api } = setup(async url => url.endsWith('/login') ? response(session()) : response({}, status), { now: () => clock })
    await api.login(USER.email, 'password123'); clock = 3600000
    await assert.rejects(api.listHouseholds(), error => error.status === status)
    assert.equal(Boolean(api.user()), status === 503)
  }
})
test('logout clears browser state even if the server cannot be reached', async () => {
  const { api, saved } = setup(async url => {
    if (url.endsWith('/login')) return response(session())
    throw new Error('network unavailable')
  })
  await api.login(USER.email, 'password123')
  await assert.rejects(api.logout(), /Cannot reach/)
  assert.equal(api.user(), null); assert.equal(saved.has(SESSION_KEY), false)
  await assert.rejects(api.listHouseholds(), /log in/)
})
test('late refresh cannot restore a session after local sign-out', async () => {
  let clock = 0, release
  const { api } = setup(async url => {
    if (url.endsWith('/login')) return response(session())
    return new Promise(resolve => { release = () => resolve(response(session('late', 'late-refresh'))) })
  }, { now: () => clock })
  await api.login(USER.email, 'password123'); clock = 3600000
  const pending = api.listHouseholds(); api.forget(); release()
  await assert.rejects(pending, /log in/); assert.equal(api.user(), null)
})
test('invalid household names and server errors do not leak raw response details', async () => {
  let calls = 0
  const { api } = setup(async url => { calls++; return url.endsWith('/login') ? response(session()) : response({ secret: 'database-password' }, 500) })
  await api.login(USER.email, 'password123')
  assert.throws(() => api.createHousehold('  '), /1 to 100/)
  assert.throws(() => api.createHousehold('x'.repeat(101)), /1 to 100/)
  assert.equal(calls, 1)
  await assert.rejects(api.listHouseholds(), error => !error.message.includes('database-password') && error.status === 500)
})
test('bad session storage is ignored, invalid responses and blocked writes are reported', async () => {
  const broken = { getItem: () => '{', setItem: () => { throw new Error('blocked') }, removeItem() {} }
  const api = createApi({ baseUrl: 'http://localhost:8080', storage: broken, fetcher: async () => response(session()) })
  assert.equal(await api.restore(), null)
  await assert.rejects(api.login(USER.email, 'password123'), /session storage/)
  const { api: invalid } = setup(async () => response({ user: USER, access_token: 'one', refresh_token: 'two' }))
  await assert.rejects(invalid.login(USER.email, 'password123'), /expiry/)
})
