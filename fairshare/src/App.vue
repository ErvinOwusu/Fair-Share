<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import LandingView from './views/LandingView.vue'
import AuthView from './views/AuthView.vue'
import HouseholdsView from './views/HouseholdsView.vue'
import { createApi, apiAddress } from './services/api.js'
import './assets/account.css'
let storage
try { storage = window.sessionStorage } catch { storage = { getItem: () => null, setItem: () => { throw new Error('Storage blocked') }, removeItem: () => {} } }
let configurationError = '', baseUrl = ''
try { baseUrl = apiAddress(import.meta.env.VITE_API_BASE_URL, import.meta.env.DEV) } catch (error) { configurationError = error.message }
const api = createApi({ baseUrl, storage })
const user = ref(null), route = ref('home'), error = ref(configurationError), message = ref(''), busy = ref(false)
const ready = ref(false), loading = ref(false), saving = ref(false), households = ref([])
let loadVersion = 0, keepMessage = false
const selectedId = computed(() => route.value.startsWith('household/') ? route.value.slice(10) : '')
const privatePage = computed(() => route.value === 'households' || route.value.startsWith('household/'))
function go(value) { location.hash = value }
function guard() {
  if (privatePage.value && !user.value) { go('login'); return false }
  if (user.value && ['login', 'signup'].includes(route.value)) { go('households'); return false }
  return true
}
async function loadHouseholds() {
  if (!user.value) return
  const version = ++loadVersion
  loading.value = true; error.value = ''
  try { const list = await api.listHouseholds(); if (version === loadVersion && user.value) households.value = list }
  catch (exception) { if (version === loadVersion) { error.value = exception.message; guard() } }
  finally { if (version === loadVersion) loading.value = false }
}
function navigate() {
  const hash = location.hash.slice(1)
  route.value = !hash || hash === 'about' ? 'home' : hash
  if (!keepMessage) message.value = ''
  keepMessage = false; error.value = configurationError
  if (ready.value && guard() && privatePage.value) loadHouseholds()
}
const unsubscribe = api.subscribe(value => {
  user.value = value
  if (!value) { ++loadVersion; households.value = []; loading.value = false }
})
async function submit(credentials) {
  if (busy.value) return
  busy.value = true; error.value = ''; message.value = ''
  try {
    if (route.value === 'signup') {
      const result = await api.signup(credentials.email, credentials.password)
      if (result.confirmationRequired) {
        message.value = 'Check your email for confirmation instructions. Once confirmed, log in here.'
        keepMessage = true; go('login'); return
      }
    } else await api.login(credentials.email, credentials.password)
    go('households')
  } catch (exception) { error.value = exception.message }
  finally { busy.value = false }
}
async function createHousehold(name) {
  if (saving.value) return
  saving.value = true; error.value = ''
  try {
    const created = await api.createHousehold(name)
    households.value = [created, ...households.value.filter(house => house.id !== created.id)]
    go(`household/${created.id}`)
  } catch (exception) { error.value = exception.message; guard() }
  finally { saving.value = false }
}
async function logout() {
  if (busy.value) return
  busy.value = true
  try { await api.logout(); message.value = 'You have been logged out.' }
  catch { message.value = 'Signed out on this browser. The server could not confirm logout; sign out of other devices separately if needed.' }
  finally { busy.value = false; keepMessage = true; go('login') }
}
async function restore() {
  ready.value = false; error.value = ''
  try { user.value = await api.restore() }
  catch (exception) { error.value = exception.message }
  finally { ready.value = true; if (guard() && privatePage.value && user.value) loadHouseholds() }
}
onMounted(() => { navigate(); window.addEventListener('hashchange', navigate); restore() })
onUnmounted(() => { unsubscribe(); window.removeEventListener('hashchange', navigate) })
</script>
<template>
  <LandingView v-if="route === 'home'" />
  <div v-else class="account-ui">
    <main v-if="!ready" class="account-starting" role="status">Checking your sign-in…</main>
    <AuthView v-else-if="route === 'login' || route === 'signup'" :mode="route" :busy="busy" :error="error" :message="message" :configured="api.configured" @submit="submit" />
    <HouseholdsView v-else-if="privatePage && user" :user="user" :households="households" :selected-id="selectedId" :loading="loading" :saving="saving" :error="error" @create="createHousehold" @retry="loadHouseholds" @logout="logout" />
    <main v-else class="account-starting"><h1>Let’s get you back home.</h1><a :href="user ? '#households' : '#home'">Go back</a></main>
  </div>
</template>
