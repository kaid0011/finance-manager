<template>
  <q-page class="q-pa-md max-width-container">
    
    <!-- Header & Navigation Tabs -->
    <div class="row items-center justify-between q-mb-md">
      <div class="text-h5 text-weight-bold text-blue-grey-9">Savings Hub</div>
      <q-tabs
        v-model="activeTab"
        dense
        class="text-grey-7 bg-white shadow-1 rounded-borders"
        active-color="teal-9"
        indicator-color="teal-9"
        align="justify"
        narrow-indicator
      >
        <q-tab name="vaults" icon="account_balance" label="Vaults" class="q-px-md text-weight-bold" />
        <q-tab name="goals" icon="track_changes" label="Target Goals" class="q-px-md text-weight-bold" />
      </q-tabs>
    </div>

    <!-- Tab Content -->
    <q-tab-panels v-model="activeTab" animated class="bg-transparent">
      
      <!-- ==================== TAB 1: SAVINGS VAULTS ==================== -->
      <q-tab-panel name="vaults" class="q-pa-none">
        <div v-if="savingsAccounts.length === 0" class="text-center q-py-xl bg-white rounded-borders shadow-1">
          <q-icon name="verified_user" size="xl" color="grey-4" />
          <div class="text-h6 text-grey-6 q-mt-sm">No Savings Vaults Yet</div>
          <div class="text-caption text-grey-5">Go to 'Manage Accounts' and classify an account as a 'Savings Vault'.</div>
        </div>

        <div class="row q-col-gutter-md">
          <div class="col-12 col-md-6" v-for="vault in savingsAccounts" :key="vault.id">
            <q-card class="vault-card bg-amber-1 border-gold">
              <q-card-section>
                <div class="row items-start justify-between q-mb-md">
                  <div>
                    <div class="text-h6 text-weight-bold text-blue-grey-9">
                      <q-icon name="verified_user" color="amber-9" size="sm" class="q-mr-xs" />
                      {{ vault.name }}
                    </div>
                  </div>
                  <div class="text-right">
                    <div class="text-caption text-amber-9 text-weight-bold text-uppercase">Current Balance</div>
                    <div class="text-h5 text-weight-bold text-amber-10">
                      ₱{{ formatMoney(getVaultBalance(vault.id)) }}
                    </div>
                  </div>
                </div>
                <div class="row q-gutter-sm">
                  <q-btn class="col" color="amber-9" icon="arrow_downward" label="Deposit" @click="openTransferDialog(vault, 'deposit')" unelevated />
                  <q-btn class="col" outline color="blue-grey-7" icon="arrow_upward" label="Withdraw" @click="openTransferDialog(vault, 'withdraw')" />
                </div>
              </q-card-section>
            </q-card>
          </div>
        </div>
      </q-tab-panel>

      <!-- ==================== TAB 2: TARGET GOALS ==================== -->
      <q-tab-panel name="goals" class="q-pa-none">
        <div class="row justify-end q-mb-md">
          <q-btn color="teal-9" icon="add" label="New Goal" @click="openGoalDialog = true" unelevated />
        </div>

        <div class="row q-col-gutter-md">
          <div class="col-12 col-md-6" v-for="goal in financeStore.goals" :key="goal.id">
            <q-card class="vault-card bg-white">
              <q-card-section>
                <div class="row items-start justify-between q-mb-sm">
                  <div>
                    <div class="text-h6 text-weight-bold text-blue-grey-9">{{ goal.name }}</div>
                    <div class="text-caption text-grey-7">Target: {{ formatDate(goal.target_date) }}</div>
                  </div>
                  <div class="text-right">
                    <div class="text-subtitle1 text-weight-bold text-teal-9">₱{{ formatMoney(goal.current_amount) }}</div>
                    <div class="text-caption text-grey-6">of ₱{{ formatMoney(goal.target_amount) }}</div>
                  </div>
                </div>

                <q-linear-progress 
                  :value="goal.current_amount / goal.target_amount" 
                  color="teal-6" 
                  track-color="teal-1" 
                  size="12px" 
                  rounded 
                  class="q-mt-sm q-mb-md"
                />

                <div class="row items-center justify-between bg-blue-grey-1 q-pa-sm rounded-borders">
                  <div>
                    <div class="text-caption text-blue-grey-8 text-weight-bold">Suggested Pace</div>
                    <div class="text-caption text-grey-8">
                      ₱{{ calculatePace(goal.target_amount, goal.current_amount, goal.target_date) }} / mo
                    </div>
                  </div>
                  <q-btn size="sm" color="teal-9" icon="savings" label="Add Funds" @click="openFundGoalDialog(goal)" unelevated />
                </div>
              </q-card-section>
            </q-card>
          </div>
        </div>
      </q-tab-panel>

    </q-tab-panels>

    <!-- ==================== DIALOGS ==================== -->

    <!-- Vault Transfer Dialog -->
    <q-dialog v-model="transferDialog" @hide="resetTransferForm">
      <q-card style="min-width: 350px; border-radius: 12px;">
        <q-card-section class="text-white" :class="transferType === 'deposit' ? 'bg-amber-9' : 'bg-blue-grey-8'">
          <div class="text-h6">{{ transferType === 'deposit' ? 'Deposit to' : 'Withdraw from' }} {{ activeVault?.name }}</div>
        </q-card-section>
        <q-card-section class="q-pt-md">
          <q-form @submit="submitTransfer" class="q-gutter-md">
            <q-input v-model="transferData.date" type="date" label="Date" outlined dense required />
            <q-select v-if="transferType === 'deposit'" v-model="transferData.from_account" :options="standardAccounts" option-label="name" option-value="id" map-options emit-value label="Transfer From (Spending)" outlined dense required />
            <q-select v-if="transferType === 'withdraw'" v-model="transferData.to_account" :options="standardAccounts" option-label="name" option-value="id" map-options emit-value label="Transfer To (Spending)" outlined dense required />
            <q-input v-model.number="transferData.amount" type="number" step="0.01" label="Amount (₱)" outlined dense autofocus required />
            <q-input v-model="transferData.description" type="text" label="Memo (Optional)" outlined dense />
            <div class="row justify-end q-mt-md">
              <q-btn flat label="Cancel" color="grey" v-close-popup />
              <q-btn type="submit" label="Confirm Transfer" :color="transferType === 'deposit' ? 'amber-9' : 'blue-grey-8'" :loading="financeStore.isLoading" unelevated />
            </div>
          </q-form>
        </q-card-section>
      </q-card>
    </q-dialog>

    <!-- Create Goal Dialog -->
    <q-dialog v-model="openGoalDialog">
      <q-card style="min-width: 350px; border-radius: 12px;">
        <q-card-section class="bg-blue-grey-9 text-white">
          <div class="text-h6">Create Savings Goal</div>
        </q-card-section>
        <q-card-section class="q-pt-md">
          <q-form @submit="submitGoal" class="q-gutter-md">
            <q-input v-model="goalData.name" type="text" label="Goal Name (e.g., Laptop)" outlined dense required />
            <q-input v-model.number="goalData.target_amount" type="number" step="0.01" label="Target Amount (₱)" outlined dense required />
            <q-input v-model.number="goalData.current_amount" type="number" step="0.01" label="Starting Balance (₱)" outlined dense />
            <q-input v-model="goalData.target_date" type="date" label="Target Date" outlined dense required />
            <div class="row justify-end q-mt-md">
              <q-btn flat label="Cancel" color="grey" v-close-popup />
              <q-btn type="submit" label="Start Goal" color="blue-grey-9" :loading="financeStore.isLoading" unelevated />
            </div>
          </q-form>
        </q-card-section>
      </q-card>
    </q-dialog>

    <!-- Add Funds to Goal Dialog -->
    <q-dialog v-model="fundDialog">
      <q-card style="min-width: 300px; border-radius: 12px;">
        <q-card-section class="q-pt-lg text-center">
          <div class="text-h6 text-weight-bold text-teal-9">Fund {{ activeGoal?.name }}</div>
          <div class="text-caption text-grey-7">Current: ₱{{ formatMoney(activeGoal?.current_amount) }}</div>
        </q-card-section>
        <q-card-section>
          <q-form @submit="submitGoalFunds" class="q-gutter-md">
            <q-input v-model.number="goalFundAmount" type="number" step="0.01" label="Amount to Add (₱)" outlined dense autofocus required />
            <q-btn type="submit" class="full-width q-mt-md" label="Add to Progress" color="teal-9" :loading="financeStore.isLoading" unelevated />
          </q-form>
        </q-card-section>
      </q-card>
    </q-dialog>

  </q-page>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { useFinanceStore } from '@/stores/financeStore'

const financeStore = useFinanceStore()
const activeTab = ref('vaults') // Start on the Vaults tab

// --- COMMON FORMATTERS ---
const formatMoney = (val) => val ? Number(val).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '0.00'
const getTodayDate = () => new Date().toISOString().split('T')[0]

// ==========================================
// VAULTS LOGIC
// ==========================================
const transferDialog = ref(false)
const activeVault = ref(null)
const transferType = ref('deposit')

const transferData = reactive({
  date: getTodayDate(),
  from_account: null,
  to_account: null,
  amount: null,
  description: ''
})

const savingsAccounts = computed(() => financeStore.accounts.filter(a => a.type === 'savings'))
const standardAccounts = computed(() => financeStore.accounts.filter(a => a.type === 'asset' && a.is_active !== false))

const getVaultBalance = (accountId) => {
  return financeStore.transactions
    .filter(t => t.status === 'cleared')
    .reduce((acc, t) => {
      if (t.action_type === 'income' && t.to_account === accountId) return acc + Number(t.amount)
      if (t.action_type === 'expense' && t.from_account === accountId) return acc - Number(t.amount)
      if (t.action_type === 'transfer') {
        if (t.to_account === accountId) return acc + Number(t.amount)
        if (t.from_account === accountId) return acc - Number(t.amount)
      }
      return acc
    }, 0)
}

const openTransferDialog = (vault, type) => {
  activeVault.value = vault
  transferType.value = type
  if (type === 'deposit') { transferData.to_account = vault.id; transferData.from_account = null } 
  else { transferData.from_account = vault.id; transferData.to_account = null }
  transferDialog.value = true
}

const resetTransferForm = () => {
  transferData.date = getTodayDate(); transferData.from_account = null; transferData.to_account = null; transferData.amount = null; transferData.description = ''; activeVault.value = null;
}

const submitTransfer = async () => {
  const payload = {
    date: transferData.date, status: 'cleared', action_type: 'transfer', amount: transferData.amount,
    from_account: transferData.from_account, to_account: transferData.to_account,
    description: transferData.description || (transferType.value === 'deposit' ? 'Added to Savings' : 'Withdrawn from Savings')
  }
  const result = await financeStore.addTransaction(payload)
  if (!result.error) { transferDialog.value = false; resetTransferForm() }
}

// ==========================================
// GOALS LOGIC
// ==========================================
const openGoalDialog = ref(false)
const fundDialog = ref(false)
const activeGoal = ref(null)
const goalFundAmount = ref(null)

const goalData = reactive({
  name: '', target_amount: null, current_amount: 0, target_date: ''
})

const formatDate = (dateString) => {
  if (!dateString) return ''
  return new Date(dateString).toLocaleDateString('default', { month: 'short', year: 'numeric' })
}

const calculatePace = (target, current, targetDate) => {
  const remaining = Number(target) - Number(current)
  if (remaining <= 0) return '0.00'
  const end = new Date(targetDate); const now = new Date()
  const monthsLeft = (end.getFullYear() - now.getFullYear()) * 12 + (end.getMonth() - now.getMonth())
  if (monthsLeft <= 0) return formatMoney(remaining)
  return formatMoney(remaining / monthsLeft)
}

const submitGoal = async () => {
  const result = await financeStore.createGoal({...goalData})
  if (!result.error) {
    openGoalDialog.value = false; goalData.name = ''; goalData.target_amount = null; goalData.current_amount = 0; goalData.target_date = ''
  }
}

const openFundGoalDialog = (goal) => {
  activeGoal.value = goal; goalFundAmount.value = null; fundDialog.value = true
}

const submitGoalFunds = async () => {
  const result = await financeStore.addFundsToGoal(activeGoal.value.id, goalFundAmount.value, activeGoal.value.current_amount)
  if (!result.error) fundDialog.value = false
}

onMounted(() => {
  if (financeStore.accounts.length === 0 || financeStore.goals.length === 0) {
    financeStore.fetchInitialData()
  }
})
</script>

<style scoped>
.max-width-container { max-width: 1000px; margin: 0 auto; }
.vault-card { border-radius: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.06); }
.border-gold { border-left: 6px solid #FF8F00; }
.rounded-borders { border-radius: 8px; }

/* Makes the tabs feel seamless with the background */
:deep(.q-tab-panel) { padding-left: 0; padding-right: 0; }
</style>