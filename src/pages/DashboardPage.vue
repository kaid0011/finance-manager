<template>
  <q-page class="q-pa-md max-width-container">
    
    <div class="row items-center justify-between q-mb-md bg-white q-pa-sm rounded-borders shadow-1">
      <q-btn flat round icon="chevron_left" color="blue-grey-9" @click="changeMonth(-1)" />
      <div class="text-h6 text-weight-bold text-blue-grey-9">
        {{ displayMonthYear }}
      </div>
      <q-btn flat round icon="chevron_right" color="blue-grey-9" @click="changeMonth(1)" />
    </div>

    <div class="row q-col-gutter-sm q-mb-lg">
      <div class="col-6 col-md-3">
        <q-card class="metric-card bg-blue-grey-1">
          <q-card-section class="q-pa-sm">
            <div class="text-caption text-blue-grey-8 text-weight-bold text-uppercase">Past Rollover</div>
            <div class="text-h6 text-weight-bold">₱{{ formatMoney(startingBalance) }}</div>
            <div class="text-caption text-grey-6">From previous months</div>
          </q-card-section>
        </q-card>
      </div>
      <div class="col-6 col-md-3">
        <q-card class="metric-card bg-teal-1">
          <q-card-section class="q-pa-sm">
            <div class="text-caption text-teal-9 text-weight-bold text-uppercase">Current Cash</div>
            <div class="text-h6 text-weight-bold text-teal-10">₱{{ formatMoney(actualEndBalance) }}</div>
            <div class="text-caption text-teal-7">+ In: ₱{{ formatMoney(monthlyIncome) }} | - Out: ₱{{ formatMoney(monthlyExpense) }}</div>
          </q-card-section>
        </q-card>
      </div>
      <div class="col-6 col-md-3">
        <q-card class="metric-card bg-amber-1">
          <q-card-section class="q-pa-sm">
            <div class="text-caption text-amber-9 text-weight-bold text-uppercase">Planned Purchases</div>
            <div class="text-h6 text-weight-bold text-amber-10">₱{{ formatMoney(plannedPurchases) }}</div>
            <div class="text-caption text-amber-8">Reserved for this month</div>
          </q-card-section>
        </q-card>
      </div>
      <div class="col-6 col-md-3">
        <q-card class="metric-card" :class="projectedBalance >= 0 ? 'bg-green-1' : 'bg-red-1'">
          <q-card-section class="q-pa-sm">
            <div class="text-caption text-weight-bold text-uppercase" :class="projectedBalance >= 0 ? 'text-green-9' : 'text-red-9'">Projected Month End</div>
            <div class="text-h6 text-weight-bold" :class="projectedBalance >= 0 ? 'text-green-10' : 'text-red-10'">
              ₱{{ formatMoney(projectedBalance) }}
            </div>
            <div class="text-caption" :class="projectedBalance >= 0 ? 'text-green-8' : 'text-red-8'">
              If all plans are cleared
            </div>
          </q-card-section>
        </q-card>
      </div>
    </div>

    <q-card class="ledger-card">
      <q-card-section class="row items-center justify-between bg-blue-grey-9 text-white q-pa-sm">
        <div class="text-subtitle1 text-weight-bold q-ml-sm">Monthly Ledger</div>
        <q-btn color="teal-13" text-color="blue-grey-10" icon="add" label="Plan / Add" @click="openAddDialog" unelevated />
      </q-card-section>

      <q-table
        flat
        :rows="monthlyTransactions"
        :columns="columns"
        row-key="id"
        :loading="financeStore.isLoading"
        :pagination="{ rowsPerPage: 15 }"
        wrap-cells
      >
        <template v-slot:body-cell-status="props">
          <q-td :props="props">
<q-select
  v-model="props.row.status"
  :options="['cleared', 'planned']"
  dense
  borderless
  emit-value
  map-options
  @update:model-value="val => quickUpdateStatus(props.row.id, val)"
  style="min-width: 100px;"
>
              <template v-slot:selected>
                <q-chip 
                  :color="props.row.status === 'cleared' ? 'positive' : 'warning'" 
                  text-color="white" 
                  dense 
                  square
                  size="sm"
                  class="cursor-pointer full-width flex justify-center"
                >
                  <span class="text-capitalize text-weight-bold">{{ props.row.status }}</span>
                  <q-icon name="arrow_drop_down" size="xs" color="white" class="q-ml-xs"/>
                </q-chip>
              </template>
            </q-select>
          </q-td>
        </template>

        <template v-slot:body-cell-action_type="props">
          <q-td :props="props">
            <span class="text-capitalize text-weight-bold" 
                  :class="{
                    'text-green-8': props.row.action_type === 'income',
                    'text-red-8': props.row.action_type === 'expense',
                    'text-blue-8': props.row.action_type === 'transfer'
                  }">
              {{ props.row.action_type }}
            </span>
          </q-td>
        </template>

        <template v-slot:body-cell-actions="props">
          <q-td :props="props">
            <q-btn flat round dense color="blue-grey-5" icon="edit" @click="openEditDialog(props.row)">
              <q-tooltip>Edit Details</q-tooltip>
            </q-btn>
            <q-btn flat round dense color="red-5" icon="delete" @click="deleteTransaction(props.row.id)">
              <q-tooltip>Delete</q-tooltip>
            </q-btn>
          </q-td>
        </template>
      </q-table>
    </q-card>

    <q-dialog v-model="openDialog" @hide="resetForm">
      <q-card style="min-width: 350px; width: 100%; max-width: 500px; border-radius: 12px;">
        <q-card-section class="bg-blue-grey-9 text-white">
          <div class="text-h6">{{ isEditing ? 'Edit Transaction' : 'Log / Plan Transaction' }}</div>
        </q-card-section>

        <q-card-section class="q-pt-md">
          <q-form @submit="submitTransaction" class="q-gutter-md">
            
            <div class="row q-col-gutter-sm items-center">
              <div class="col-8">
                <q-input v-model="formData.date" type="date" label="Date" outlined dense required />
              </div>
              <div class="col-4 flex justify-end">
                <q-checkbox 
                  v-model="formData.status" 
                  true-value="cleared" 
                  false-value="planned" 
                  label="Cleared?" 
                  color="teal-9" 
                  keep-color
                />
              </div>
            </div>

            <div class="q-px-sm">
              <div class="text-caption text-grey-8">Transaction Type</div>
              <div class="row justify-between q-mt-xs">
                <q-radio v-model="formData.action_type" val="income" label="Income" color="green-8" />
                <q-radio v-model="formData.action_type" val="expense" label="Expense" color="red-8" />
                <q-radio v-model="formData.action_type" val="transfer" label="Transfer" color="blue-8" />
              </div>
            </div>

            <q-select 
              v-if="formData.action_type === 'expense' || formData.action_type === 'transfer'"
              v-model="formData.from_account" 
              :options="financeStore.accounts" 
              option-label="name" 
              option-value="id"
              map-options
              emit-value
              label="From Account" 
              outlined 
              dense 
            />

            <q-select 
              v-if="formData.action_type === 'income' || formData.action_type === 'transfer'"
              v-model="formData.to_account" 
              :options="financeStore.accounts" 
              option-label="name" 
              option-value="id"
              map-options
              emit-value
              label="To Account" 
              outlined 
              dense 
            />

            <q-input v-model.number="formData.amount" type="number" step="0.01" label="Amount (₱)" outlined dense required />
            <q-input v-model="formData.description" type="text" label="Description" outlined dense />

            <div class="row justify-end q-mt-md">
              <q-btn flat label="Cancel" color="grey" v-close-popup />
              <q-btn type="submit" :label="isEditing ? 'Save Changes' : 'Save Entry'" color="blue-grey-9" :loading="financeStore.isLoading" unelevated />
            </div>
          </q-form>
        </q-card-section>
      </q-card>
    </q-dialog>

  </q-page>
</template>

<style scoped>
.max-width-container {
  max-width: 1200px;
  margin: 0 auto;
}

.rounded-borders {
  border-radius: 8px;
}

.metric-card {
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.04);
  height: 100%;
}

.ledger-card {
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 4px 12px rgba(0,0,0,0.06);
}

:deep(.q-table__top) {
  padding: 0;
}
:deep(.q-table th) {
  font-weight: 700;
  color: #263238; 
  background-color: #f5f7f8;
}

/* Make sure the select dropdown doesn't inherit default input borders */
:deep(.q-field--borderless .q-field__control:before) {
  border: none !important;
}
</style>

<script setup>
import { ref, computed, reactive, onMounted } from 'vue'
import { useFinanceStore } from '@/stores/financeStore'

const financeStore = useFinanceStore()
const openDialog = ref(false)

// --- Date & Navigation Logic ---
const currentDate = ref(new Date())

const displayMonthYear = computed(() => {
  return currentDate.value.toLocaleString('default', { month: 'long', year: 'numeric' })
})

const changeMonth = (offset) => {
  const newDate = new Date(currentDate.value)
  newDate.setMonth(newDate.getMonth() + offset)
  currentDate.value = newDate
}

const isSameMonth = (dateString, targetDate) => {
  const d = new Date(dateString)
  return d.getMonth() === targetDate.getMonth() && d.getFullYear() === targetDate.getFullYear()
}

const isBeforeMonth = (dateString, targetDate) => {
  const d = new Date(dateString)
  const targetStart = new Date(targetDate.getFullYear(), targetDate.getMonth(), 1)
  return d < targetStart
}

// --- Formatters ---
const formatMoney = (val) => {
  return val ? Number(val).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '0.00'
}

// --- Form State ---
const getTodayDate = () => {
  const today = new Date()
  return today.toISOString().split('T')[0]
}
// --- Form State & Edit Logic ---
const isEditing = ref(false)
const editingId = ref(null)


const formData = reactive({
  date: getTodayDate(),
  status: 'planned',
  action_type: 'expense',
  from_account: null,
  to_account: null,
  amount: null,
  description: ''
})

const resetForm = () => {
  formData.date = getTodayDate()
  formData.status = 'planned'
  formData.action_type = 'expense'
  formData.from_account = null
  formData.to_account = null
  formData.amount = null
  formData.description = ''
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
  
  // Pre-fill form with existing data
  formData.date = row.date
  formData.status = row.status
  formData.action_type = row.action_type
  formData.amount = row.amount
  formData.description = row.description
  formData.from_account = row.from_account
  formData.to_account = row.to_account
  
  openDialog.value = true
}

const deleteTransaction = async (id) => {
  if (confirm('Are you sure you want to delete this transaction?')) {
    await financeStore.deleteTransaction(id)
  }
}

// --- Table Columns (Added Actions column) ---
const columns = [
  { name: 'date', label: 'Date', field: 'date', align: 'left', sortable: true },
  { name: 'status', label: 'Status', field: 'status', align: 'center' },
  { name: 'action_type', label: 'Type', field: 'action_type', align: 'left' },
  { name: 'from', label: 'From', field: row => row.from_acc?.name || '-', align: 'left' },
  { name: 'to', label: 'To', field: row => row.to_acc?.name || '-', align: 'left' },
  { name: 'amount', label: 'Amount (₱)', field: 'amount', align: 'right', format: val => val ? val.toLocaleString(undefined, { minimumFractionDigits: 2 }) : '0.00' },
  { name: 'description', label: 'Description', field: 'description', align: 'left' },
  { name: 'actions', label: 'Actions', field: 'actions', align: 'center' } // <-- Added this
]
// --- Quick Actions ---
const quickUpdateStatus = async (id, newStatus) => {
  await financeStore.updateTransaction(id, { status: newStatus })
}
// --- Actions ---
const submitTransaction = async () => {
  const payload = {
    date: formData.date,
    status: formData.status,
    action_type: formData.action_type,
    amount: formData.amount,
    description: formData.description,
    from_account: formData.from_account,
    to_account: formData.to_account
  }

  let result
  if (isEditing.value) {
    result = await financeStore.updateTransaction(editingId.value, payload)
  } else {
    result = await financeStore.addTransaction(payload)
  }

  if (!result.error) {
    openDialog.value = false
    resetForm()
  }
}

// --- Core Math Engine ---
const monthlyTransactions = computed(() => {
  return financeStore.transactions.filter(t => isSameMonth(t.date, currentDate.value))
})

const startingBalance = computed(() => {
  return financeStore.transactions
    .filter(t => isBeforeMonth(t.date, currentDate.value) && t.status === 'cleared')
    .reduce((acc, t) => {
      if (t.action_type === 'income') return acc + Number(t.amount)
      if (t.action_type === 'expense') return acc - Number(t.amount)
      return acc
    }, 0)
})

const monthlyIncome = computed(() => {
  return monthlyTransactions.value
    .filter(t => t.action_type === 'income' && t.status === 'cleared')
    .reduce((acc, t) => acc + Number(t.amount), 0)
})

const monthlyExpense = computed(() => {
  return monthlyTransactions.value
    .filter(t => t.action_type === 'expense' && t.status === 'cleared')
    .reduce((acc, t) => acc + Number(t.amount), 0)
})

const plannedPurchases = computed(() => {
  return monthlyTransactions.value
    .filter(t => (t.action_type === 'expense' || t.action_type === 'transfer') && t.status === 'planned')
    .reduce((acc, t) => acc + Number(t.amount), 0)
})

const actualEndBalance = computed(() => startingBalance.value + monthlyIncome.value - monthlyExpense.value)
const projectedBalance = computed(() => actualEndBalance.value - plannedPurchases.value)

onMounted(async () => {
  await financeStore.fetchInitialData()
  
  // 🔥 ADD THESE DEBUG LOGS HERE:
  setTimeout(() => {
    console.log("=== DASHBOARD MATH ===")
    console.log("Current Date Target:", currentDate.value)
    console.log("Raw Transactions from Store:", financeStore.transactions)
    console.log("Filtered Monthly Transactions:", monthlyTransactions.value)
    console.log("Calculated Planned Purchases:", plannedPurchases.value)
  }, 500) // Small delay to ensure the computed properties finish calculating
})
</script>
