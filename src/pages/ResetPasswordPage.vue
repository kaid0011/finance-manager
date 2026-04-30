<template>
  <q-layout view="lHh Lpr lFf">
    <q-page-container>
      <q-page class="flex flex-center bg-blue-grey-1">
        <q-card class="auth-card shadow-4" style="width: 100%; max-width: 400px; border-radius: 12px;">
          <q-card-section class="bg-teal-9 text-white text-center q-py-lg">
            <q-icon name="lock_reset" size="xl" class="q-mb-sm" />
            <div class="text-h5 text-weight-bold">Create New Password</div>
          </q-card-section>

          <q-card-section class="q-pa-md">
            <q-form @submit="handlePasswordUpdate" class="q-gutter-md">
              <q-input v-model="newPassword" type="password" label="New Password (Min 6 chars)" outlined dense required autofocus />
              <q-input v-model="confirmPassword" type="password" label="Confirm New Password" outlined dense required :error="passwordMismatch" error-message="Passwords do not match" />
              
              <div v-if="authStore.authError" class="text-red-9 text-caption text-center">
                {{ authStore.authError }}
              </div>

              <q-btn type="submit" class="full-width q-mt-md" color="teal-9" label="Save & Login" :loading="authStore.isLoading" :disable="passwordMismatch" unelevated />
            </q-form>
          </q-card-section>
        </q-card>
      </q-page>
    </q-page-container>
  </q-layout>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/authStore'

const authStore = useAuthStore()
const router = useRouter()

const newPassword = ref('')
const confirmPassword = ref('')

const passwordMismatch = computed(() => {
  return confirmPassword.value !== '' && newPassword.value !== confirmPassword.value
})

const handlePasswordUpdate = async () => {
  if (passwordMismatch.value) return

  const result = await authStore.updatePassword(newPassword.value)
  if (!result.error) {
    alert("Password updated successfully!")
    router.push('/') // Send them to the dashboard
  }
}
</script>