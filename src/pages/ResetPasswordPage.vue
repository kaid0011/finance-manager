<template>
  <q-page class="flex flex-center bg-grey-1">
    <q-card class="reset-card q-pa-lg">
      <q-card-section class="text-center">
        <div class="text-h5 text-weight-bold text-teal-9">Set New Password</div>
        <div class="text-caption text-grey-7 q-mt-sm">
          Please enter your new password below to regain access.
        </div>
      </q-card-section>

      <q-card-section>
        <q-form @submit.prevent="handleReset" class="q-gutter-md">
          <q-input
            v-model="newPassword"
            :type="showPass ? 'text' : 'password'"
            label="New Password"
            outlined
            dense
            :rules="[val => val.length >= 6 || 'Minimum 6 characters']"
          >
            <template v-slot:append>
              <q-icon
                :name="showPass ? 'visibility_off' : 'visibility'"
                class="cursor-pointer"
                @click="showPass = !showPass"
              />
            </template>
          </q-input>

          <q-btn
            type="submit"
            label="Update and Login"
            color="teal-9"
            class="full-width"
            unelevated
            :loading="loading"
          />
        </q-form>
      </q-card-section>
    </q-card>
  </q-page>
</template>

<script setup>
import { ref } from 'vue'
import { useAuthStore } from '@/stores/authStore'
import { useRouter } from 'vue-router'
import { useQuasar } from 'quasar'

const authStore = useAuthStore()
const router = useRouter()
const $q = useQuasar()

const newPassword = ref('')
const showPass = ref(false)
const loading = ref(false)

const handleReset = async () => {
  loading.value = true
  const result = await authStore.updatePassword(newPassword.ref)

  if (!result.error) {
    $q.notify({ color: 'teal-9', message: 'Password updated! Welcome back.' })
    router.push('/') // Send them to the dashboard now that they have a new pass
  } else {
    $q.notify({ color: 'red-9', message: 'Error: ' + authStore.authError })
  }
  loading.value = false
}
</script>

<style scoped>
.reset-card { width: 100%; max-width: 400px; border-radius: 12px; }
</style>