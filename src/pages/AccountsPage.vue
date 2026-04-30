<template>
  <q-page class="q-pa-md max-width-container">
    <div class="row items-center justify-between q-mb-md">
      <div class="text-h5 text-weight-bold text-blue-grey-9">Manage Accounts</div>
      <q-btn color="teal-9" icon="add" label="New Account" @click="openAddDialog" unelevated />
    </div>

    <q-card class="ledger-card">
      <q-table
        flat
        :rows="financeStore.accounts"
        :columns="columns"
        row-key="id"
        :loading="financeStore.isLoading"
        :pagination="{ rowsPerPage: 15 }"
      >
        <!-- Updated Type Column to show 3 colors -->
        <template v-slot:body-cell-type="props">
          <q-td :props="props">
            <q-chip 
              v-if="props.row.type === 'savings'" 
              color="amber-2" 
              text-color="amber-10" 
              icon="verified_user" 
              dense 
              size="sm"
              class="text-weight-bold text-uppercase"
            >
              Savings Vault
            </q-chip>
            <span v-else class="text-weight-bold text-capitalize" :class="props.row.type === 'asset' ? 'text-teal-8' : 'text-red-8'">
              {{ props.row.type }}
            </span>
          </q-td>
        </template>

        <template v-slot:body-cell-is_active="props">
          <q-td :props="props">
            <q-toggle
              v-model="props.row.is_active"
              color="teal-9"
              @update:model-value="val => financeStore.updateAccount(props.row.id, { is_active: val })"
            />
            <span class="text-caption text-grey-8">{{ props.row.is_active !== false ? 'Active' : 'Inactive' }}</span>
          </q-td>
        </template>

        <template v-slot:body-cell-actions="props">
          <q-td :props="props">
            <q-btn flat round dense color="blue-grey-5" icon="edit" @click="openEditDialog(props.row)" />
            <q-btn flat round dense color="red-5" icon="delete" @click="deleteAccount(props.row.id)" />
          </q-td>
        </template>
      </q-table>
    </q-card>

    <q-dialog v-model="openDialog" @hide="resetForm">
      <q-card style="min-width: 350px; border-radius: 12px;">
        <q-card-section class="bg-blue-grey-9 text-white">
          <div class="text-h6">{{ isEditing ? 'Edit Account' : 'Add New Account' }}</div>
        </q-card-section>

        <q-card-section class="q-pt-md">
          <q-form @submit="submitAccount" class="q-gutter-md">
            <q-input v-model="formData.name" type="text" label="Account Name" outlined dense required />
            
            <div class="q-px-sm">
              <div class="text-caption text-grey-8">Account Classification</div>
              <div class="column q-gutter-y-sm q-mt-xs">
                <!-- Changed to 3 discrete options -->
                <q-radio v-model="formData.type" val="asset" label="Standard Asset (Spending Bank, Wallet, Cash)" color="teal-9" />
                <q-radio v-model="formData.type" val="savings" label="Savings Vault (Protected from Spending Balance)" color="amber-9" />
                <q-radio v-model="formData.type" val="debt" label="Debt (Credit Card, Loan)" color="red-9" />
              </div>
            </div>
            <div class="row justify-end q-mt-lg">
              <q-btn flat label="Cancel" color="grey" v-close-popup />
              <q-btn type="submit" :label="isEditing ? 'Save Changes' : 'Create Account'" color="blue-grey-9" :loading="financeStore.isLoading" unelevated />
            </div>
          </q-form>
        </q-card-section>
      </q-card>
    </q-dialog>

  </q-page>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useFinanceStore } from '@/stores/financeStore'

const financeStore = useFinanceStore()
const openDialog = ref(false)
const isEditing = ref(false)
const editingId = ref(null)

const formData = reactive({
  name: '',
  type: 'asset',
})

// Removed the 'is_savings' column from this array
const columns = [
  { name: 'name', label: 'Account Name', field: 'name', align: 'left', sortable: true },
  { name: 'type', label: 'Classification', field: 'type', align: 'left', sortable: true },
  { name: 'is_active', label: 'Status', field: 'is_active', align: 'center' },
  { name: 'actions', label: 'Actions', field: 'actions', align: 'center' }
]

const resetForm = () => {
  formData.name = ''
  formData.type = 'asset'
  isEditing.value = false
  editingId.value = null
}

const openAddDialog = () => {
  resetForm()
  openDialog.value = true
}

const openEditDialog = (row) => {
  isEditing.value = true
  editingId.value = row.id
  formData.name = row.name
  formData.type = row.type 
  openDialog.value = true
}

const submitAccount = async () => {
  let result
  if (isEditing.value) {
    result = await financeStore.updateAccount(editingId.value, { ...formData })
  } else {
    result = await financeStore.addAccount({ ...formData, is_active: true })
  }

  if (!result.error) {
    openDialog.value = false
    resetForm()
  }
}

const deleteAccount = async (id) => {
  if (confirm('Delete this account? (If it has transactions, you must deactivate it instead).')) {
    await financeStore.deleteAccount(id)
  }
}

onMounted(() => {
  if (financeStore.accounts.length === 0) financeStore.fetchInitialData()
})
</script>
<style scoped>
.max-width-container { max-width: 900px; margin: 0 auto; }
.ledger-card { border-radius: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.06); }
:deep(.q-table__top) { padding: 0; }
:deep(.q-table th) { font-weight: 700; color: #263238; background-color: #f5f7f8; }
</style>