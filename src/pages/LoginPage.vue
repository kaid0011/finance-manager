<template>
  <!-- Wrap the page in a blank layout -->
  <q-layout view="lHh Lpr lFf">
    <q-page-container>
      
      <q-page class="flex flex-center bg-blue-grey-1">
        <q-card class="auth-card shadow-4">
          <q-card-section class="bg-blue-grey-9 text-white text-center q-py-lg">
            <q-icon name="account_balance" size="xl" class="q-mb-sm" />
            <div class="text-h5 text-weight-bold">Finance Manager Pro</div>
            <div class="text-caption">Sign in to manage your wealth</div>
          </q-card-section>

          <q-tabs v-model="tab" dense class="text-grey-7" active-color="teal-9" indicator-color="teal-9" align="justify">
            <q-tab name="login" label="Log In" class="text-weight-bold" />
            <q-tab name="register" label="Create Account" class="text-weight-bold" />
          </q-tabs>

          <q-separator />

          <q-tab-panels v-model="tab" animated>
            <q-tab-panel name="login" class="q-pa-md">
              <q-form @submit="handleLogin" class="q-gutter-md">
                <q-input v-model="email" type="email" label="Email Address" outlined dense required autofocus />
                <q-input v-model="password" type="password" label="Password" outlined dense required />
                
                <div v-if="authStore.authError" class="text-red-9 text-caption text-center">
                  {{ authStore.authError }}
                </div>

            <q-btn type="submit" class="full-width q-mt-sm" color="teal-9" label="Secure Login" :loading="authStore.isLoading" unelevated />
            <q-btn flat class="full-width q-mt-sm text-grey-7" label="Forgot Password?" no-caps @click="forgotPasswordDialog = true" />
              </q-form>
            </q-tab-panel>

            <q-tab-panel name="register" class="q-pa-md">
              <q-form @submit="handleRegister" class="q-gutter-md">
                <q-input v-model="email" type="email" label="Email Address" outlined dense required />
                <q-input v-model="password" type="password" label="Create Password" outlined dense required />
                
                <div v-if="authStore.authError" class="text-red-9 text-caption text-center">
                  {{ authStore.authError }}
                </div>

                <q-btn type="submit" class="full-width q-mt-sm" color="blue-grey-9" label="Create Account" :loading="authStore.isLoading" unelevated />
              </q-form>
            </q-tab-panel>
          </q-tab-panels>
        </q-card>
      </q-page>
<!-- NEW: Forgot Password Dialog -->
    <q-dialog v-model="forgotPasswordDialog" @hide="resetEmailSent = false">
      <q-card style="min-width: 350px; border-radius: 12px;">
        <q-card-section class="bg-blue-grey-9 text-white">
          <div class="text-h6">Reset Password</div>
        </q-card-section>

        <q-card-section class="q-pt-md">
          <div v-if="resetEmailSent" class="text-center q-pa-md bg-teal-1 text-teal-10 rounded-borders text-weight-bold">
            <q-icon name="mark_email_read" size="md" class="q-mb-sm" /><br>
            Check your email for a secure reset link.
          </div>
          
          <q-form v-else @submit="handleForgotPassword" class="q-gutter-md">
            <div class="text-caption text-grey-8">Enter your email address and we'll send you a link to securely reset your password.</div>
            <q-input v-model="resetEmail" type="email" label="Account Email" outlined dense required autofocus />
            
            <div v-if="authStore.authError" class="text-red-9 text-caption text-center">
              {{ authStore.authError }}
            </div>

            <div class="row justify-end q-mt-md">
              <q-btn flat label="Cancel" color="grey" v-close-popup />
              <q-btn type="submit" label="Send Link" color="blue-grey-9" :loading="authStore.isLoading" unelevated />
            </div>
          </q-form>
        </q-card-section>
      </q-card>
    </q-dialog>
    </q-page-container>
  </q-layout>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/authStore'

const authStore = useAuthStore()
const router = useRouter()

const tab = ref('login')
const email = ref('')
const password = ref('')

const handleLogin = async () => {
  await authStore.login(email.value, password.value)
  if (authStore.user) router.push('/') // Send to dashboard on success
}

const handleRegister = async () => {
  await authStore.register(email.value, password.value)
  if (authStore.user) router.push('/')
}

// Add these variables
const forgotPasswordDialog = ref(false)
const resetEmail = ref('')
const resetEmailSent = ref(false)

// Add this function
const handleForgotPassword = async () => {
  const result = await authStore.sendPasswordResetEmail(resetEmail.value)
  if (!result.error) {
    resetEmailSent.value = true // Show success message
  }
}
</script>

<style scoped>
.auth-card {
  width: 100%;
  max-width: 400px;
  border-radius: 12px;
  overflow: hidden;
}
</style>