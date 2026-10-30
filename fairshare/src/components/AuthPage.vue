<script setup>
import { ref, watch } from 'vue'
const props = defineProps({ mode: { type: String, required: true } })
const email = ref(''), password = ref(''), confirmation = ref(''), showNotice = ref(false)
watch(() => props.mode, () => {
  password.value = ''; confirmation.value = ''; showNotice.value = false
})
</script>

<template>
  <main class="auth-page">
    <header class="auth-header">
      <a href="#home" class="auth-brand"><span aria-hidden="true">f</span>fairshare</a>
      <a href="#home" class="auth-back">← Back to home</a>
    </header>
    <section class="auth-card" aria-labelledby="auth-title">
      <h1 id="auth-title">{{ mode === 'signup' ? 'Make yourself at home.' : 'Welcome back.' }}</h1>
      <p class="auth-intro">{{ mode === 'signup' ? 'Create your FairShare account.' : 'Log in to your FairShare account.' }}</p>
      <p class="preview-note">Page preview only. Account actions are not connected yet.</p>
      <form @submit.prevent="showNotice = true">
        <label for="account-email">Email address</label>
        <input id="account-email" v-model="email" type="email" autocomplete="username" required placeholder="you@example.com" />
        <label for="account-password">Password</label>
        <input id="account-password" v-model="password" type="password" :autocomplete="mode === 'signup' ? 'new-password' : 'current-password'" required />
        <template v-if="mode === 'signup'">
          <label for="confirm-password">Confirm password</label>
          <input id="confirm-password" v-model="confirmation" type="password" autocomplete="new-password" required />
        </template>
        <button type="submit">{{ mode === 'signup' ? 'Sign up' : 'Log in' }} <span aria-hidden="true">↗</span></button>
      </form>
      <p v-if="showNotice" class="form-notice" role="status">This is a page preview. No account details were sent or saved.</p>
      <p class="switch-page">
        {{ mode === 'signup' ? 'Already have an account?' : 'New here?' }}
        <a :href="mode === 'signup' ? '#login' : '#signup'">{{ mode === 'signup' ? 'Log in' : 'Sign up' }}</a>
      </p>
    </section>
    <footer class="auth-footer">© 2026 FairShare</footer>
  </main>
</template>

<style scoped>
.auth-page { min-height:100vh; background:var(--paper, #f4f3ed); color:var(--ink, #20251f); padding:32px 24px; }
.auth-header { max-width:1080px; margin:0 auto; display:flex; justify-content:space-between; align-items:center; gap:20px; }
.auth-header a, .switch-page a { padding:0; color:inherit; text-decoration:none; }
.auth-header a:hover, .switch-page a:hover { background:transparent; text-decoration:underline; }
.auth-brand { display:inline-flex; align-items:center; gap:10px; font-family:Manrope,sans-serif; font-size:21px; font-weight:800; }
.auth-brand span { display:grid; place-items:center; width:31px; height:31px; border-radius:50%; background:var(--lime, #d7f36a); font-size:22px; }
.auth-back { font-size:13px; color:#68715f!important; }
.auth-card { width:100%; max-width:430px; margin:65px auto 45px; padding:34px; border:1px solid #e0e3d7; border-radius:12px; background:#fff; }
.auth-eyebrow { margin:0 0 15px; color:#718046; font-size:10px; font-weight:700; letter-spacing:1.3px; }
h1 { margin:0 0 12px; font-family:Manrope,sans-serif; font-size:29px; font-weight:700; letter-spacing:-.8px; line-height:1.2; }
.auth-intro { margin:0 0 22px; color:#68715f; font-size:14px; line-height:1.6; }
.preview-note { margin:0 0 24px; border-radius:6px; padding:10px 12px; background:#f0f3e6; color:#68774e; font-size:12px; line-height:1.6; }
label { display:block; margin:18px 0 8px; font-size:12px; font-weight:700; }
input { width:100%; min-height:46px; padding:12px 13px; border:1px solid #d9dfd0; border-radius:6px; background:white; color:#20251f; font:inherit; font-size:14px; }
button { display:flex; justify-content:center; align-items:center; gap:12px; width:100%; min-height:46px; margin-top:25px; padding:12px; border:0; border-radius:6px; background:var(--lime, #d7f36a); color:#20251f; font:inherit; font-size:13px; font-weight:700; cursor:pointer; }
button:hover { background:#cce95f; }
input:focus-visible, button:focus-visible, a:focus-visible { outline:3px solid #829951; outline-offset:3px; }
.switch-page { margin:24px 0 0; text-align:center; color:#68715f; font-size:12px; line-height:1.7; }
.switch-page a { margin-left:4px; color:#425b2d; font-weight:700; }
.form-notice { margin:18px 0 0; padding:11px; border:1px solid #d7e4c1; border-radius:6px; color:#536c35; font-size:12px; line-height:1.6; }
.auth-footer { margin:0 auto; text-align:center; color:#858d7b; font-size:11px; }
@media(max-width:520px) {
  .auth-page { padding:24px 18px; }
  .auth-card { margin:38px auto 30px; padding:25px 22px; }
  h1 { font-size:26px; }
  .auth-back { font-size:11px; }
}
</style>
