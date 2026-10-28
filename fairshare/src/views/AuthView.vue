<script setup>
import { ref, watch } from 'vue'
const props = defineProps({ mode: String, busy: Boolean, error: String, message: String, configured: Boolean })
const emit = defineEmits(['submit'])
const email = ref(''), password = ref(''), confirmation = ref(''), localError = ref('')
watch(() => props.mode, () => { password.value = ''; confirmation.value = ''; localError.value = '' })
async function submit() {
  localError.value = ''
  if (props.mode === 'signup' && password.value !== confirmation.value) { localError.value = 'The two passwords need to match.'; return }
  const secret = password.value
  emit('submit', { email: email.value, password: secret })
  password.value = ''; confirmation.value = ''
}
</script>
<template>
  <main class="account-auth">
    <section class="account-intro"><a href="#home" class="account-brand"><span>f</span>fairshare</a><div><p class="account-eyebrow">ROOMMATES, ON THE SAME PAGE</p><h1>Your home.<br>Your people.<br><em>Your FairShare.</em></h1><p>A shared place starts with being on the same page.</p></div><small>Less struggle. More saving.</small></section>
    <section class="account-form-side"><div class="account-form-card"><a href="#home" class="account-back">← Back to home</a><p class="account-eyebrow">LET’S GET YOU SETTLED</p><h2>{{ mode === 'login' ? 'Welcome back.' : 'Make yourself at home.' }}</h2><p class="account-muted">{{ mode === 'login' ? 'Log in to see your households.' : 'Create your FairShare account.' }}</p>
      <p v-if="!configured" class="account-alert">The backend address has not been configured yet. Account actions will be available after setup.</p>
      <p v-if="message" class="account-success" role="status">{{ message }}</p><p v-if="localError || error" class="account-error" role="alert">{{ localError || error }}</p>
      <form @submit.prevent="submit"><fieldset :disabled="busy || !configured"><label>Email address<input v-model="email" type="email" autocomplete="username" required maxlength="254" placeholder="you@example.com" /></label><label>Password<input v-model="password" type="password" :autocomplete="mode === 'signup' ? 'new-password' : 'current-password'" required maxlength="4096" :minlength="mode === 'signup' ? 8 : undefined" /></label><label v-if="mode === 'signup'">Confirm password<input v-model="confirmation" type="password" autocomplete="new-password" required maxlength="4096" minlength="8" /></label><button class="account-button account-primary account-full" type="submit">{{ busy ? 'One moment…' : mode === 'login' ? 'Log in →' : 'Create account →' }}</button></fieldset></form>
      <p v-if="mode === 'signup'" class="account-help">Use at least 8 characters. Your project’s password policy may require more. You may need to confirm your email before logging in.</p><p class="account-switch">{{ mode === 'login' ? 'New here?' : 'Already have an account?' }} <a :href="mode === 'login' ? '#signup' : '#login'">{{ mode === 'login' ? 'Create an account' : 'Log in' }}</a></p>
    </div></section>
  </main>
</template>
