<template>
  <q-page class="q-pa-md max-width-container">
    <div class="row items-center justify-between q-mb-md">
      <div class="text-h5 text-weight-bold text-blue-grey-9">Debt & Loan Payoff</div>
      <q-btn color="red-9" icon="add" label="New Loan" @click="openAddLoanDialog" unelevated />
    </div>

    <!-- Empty State -->
    <div v-if="financeStore.loans.length === 0" class="text-center q-py-xl bg-white rounded-borders shadow-1">
      <q-icon name="account_balance" size="xl" color="grey-4" />
      <div class="text-h6 text-grey-6 q-mt-sm">No Active Loans</div>
      <div class="text-caption text-grey-5">Click 'New Loan' to start tracking your fixed installment progress.</div>
    </div>

    <!-- Loan Grid -->
    <div class="row q-col-gutter-md">
      <div class="col-12 col-md-6" v-for="loan in financeStore.loans" :key="loan.id">
        <q-card class="debt-card bg-red-1 border-red">
          <q-card-section>
            <div class="row items-start justify-between q-mb-xs">
              <div>
                <div class="text-h6 text-weight-bold text-blue-grey-9">
                  <q-icon name="receipt_long" color="red-9" size="sm" class="q-mr-xs" />
                  {{ loan.name }}
                </div>
             <q-chip v-if="getLoanInstallmentText(loan)" size="sm" color="red-2" text-color="red-10" class="text-weight-bold q-ml-none q-mt-xs">
                  {{ getLoanInstallmentText(loan) }}
                </q-chip>
              </div>
              
              <div class="row items-center">
                <q-btn flat round dense color="blue-grey-5" icon="edit" @click="openEditLoanDialog(loan)" class="q-mr-sm">
                  <q-tooltip>Edit Loan Terms</q-tooltip>
                </q-btn>
                <div class="text-right">
                  <div class="text-caption text-red-9 text-weight-bold text-uppercase">Remaining Balance</div>
                  <div class="text-h5 text-weight-bold text-red-10">
                    ₱{{ formatMoney(getRemainingBalance(loan)) }}
                  </div>
                </div>
              </div>
            </div>

            <!-- 4-Column Breakdown -->
            <div class="row q-gutter-xs q-mb-md bg-white q-pa-sm rounded-borders shadow-1 q-mt-sm">
              <div class="col text-center">
                <div class="text-caption text-blue-grey-5 text-weight-bold">PRINCIPAL</div>
                <div class="text-subtitle2 text-blue-grey-9 text-weight-bold">₱{{ formatMoney(loan.principal_amount) }}</div>
              </div>
              <div class="col text-center border-sides">
                <div class="text-caption text-blue-grey-5 text-weight-bold">FEES</div>
                <div class="text-subtitle2 text-blue-grey-9 text-weight-bold">₱{{ formatMoney(loan.other_charges) }}</div>
              </div>
              <div class="col text-center border-right">
                <div class="text-caption text-orange-5 text-weight-bold">INTEREST</div>
                <div class="text-subtitle2 text-orange-9 text-weight-bold">₱{{ formatMoney(loan.interest_amount) }}</div>
              </div>
              <div class="col text-center">
                <div class="text-caption text-red-5 text-weight-bold">TOTAL</div>
                <div class="text-subtitle2 text-red-9 text-weight-bold">₱{{ formatMoney(getTotalBurden(loan)) }}</div>
              </div>
            </div>

            <!-- Payoff Progress -->
            <div v-if="getTotalBurden(loan) > 0" class="q-mt-sm q-mb-md">
              <div class="row justify-between text-caption text-weight-bold text-blue-grey-8 q-mb-xs">
                <span>Paid: ₱{{ formatMoney(getAmountPaid(loan)) }}</span>
                <span>Total: ₱{{ formatMoney(getTotalBurden(loan)) }}</span>
              </div>
              <q-linear-progress 
                :value="getPayoffProgress(loan)" 
                color="red-5" 
                track-color="red-2" 
                size="12px" 
                rounded 
              />
              <div class="text-right text-caption text-red-9 text-weight-bold q-mt-xs">
                {{ (getPayoffProgress(loan) * 100).toFixed(1) }}% Paid Off
              </div>
            </div>

            <div class="row q-mt-md">
              <q-btn class="full-width" color="red-9" icon="payment" label="Make Manual Payment" @click="openPaymentDialog(loan)" unelevated />
            </div>
          </q-card-section>
        </q-card>
      </div>
    </div>

    <!-- Smart Add/Edit Loan Dialog -->
    <q-dialog v-model="addLoanDialog" @hide="resetNewLoanForm" persistent>
      <q-card style="min-width: 350px; width: 100%; max-width: 500px; border-radius: 12px;">
        <q-card-section class="bg-blue-grey-9 text-white">
          <div class="text-h6">{{ isEditing ? 'Edit Fixed Loan' : 'Add Fixed Loan' }}</div>
        </q-card-section>

        <q-card-section class="q-pt-md">
          <q-form @submit="submitNewLoan" class="q-gutter-md">
            <q-input v-model="newLoanData.name" type="text" label="Loan Name (e.g., Car Loan)" outlined dense required autofocus />
            
            <div class="row q-col-gutter-sm">
              <div class="col-6">
                <q-input v-model.number="newLoanData.principal_amount" type="number" step="0.01" label="Principal (₱)" outlined dense required />
              </div>
              <div class="col-6">
                <q-input v-model.number="newLoanData.other_charges" type="number" step="0.01" label="Other Fees (₱)" outlined dense />
              </div>
            </div>
            
            <q-input v-model="newLoanData.date" type="date" label="Date Loan Originated" outlined dense required />

            <div class="q-mt-md">
              <div class="text-caption text-grey-8 q-mb-xs">How do you want to calculate the interest?</div>
              <q-btn-toggle
                v-model="newLoanData.calc_mode"
                spread no-caps toggle-color="red-9" color="grey-2" text-color="grey-8"
                :options="[
                  {label: 'By Interest', value: 'interest'},
                  {label: 'By Total', value: 'total'},
                  {label: 'By Monthly', value: 'monthly'}
                ]"
              />
            </div>

            <!-- Dynamic Input based on Mode -->
            <div class="row q-col-gutter-sm q-mt-sm">
              <template v-if="newLoanData.calc_mode === 'interest'">
                <div class="col-12"><q-input v-model.number="newLoanData.interest_amount" type="number" step="0.01" label="Total Interest Charged (₱)" outlined dense required /></div>
              </template>
              <template v-if="newLoanData.calc_mode === 'total'">
                <div class="col-12"><q-input v-model.number="newLoanData.total_payable" type="number" step="0.01" label="Total Debt Burden (₱)" outlined dense required /></div>
              </template>
            </div>

            <!-- Universal Installment Inputs -->
            <div class="bg-grey-1 q-pa-sm rounded-borders q-mt-sm">
              <div class="text-caption text-grey-8 q-mb-xs">Installment Details</div>
              <div class="row q-col-gutter-sm">
                <div class="col-6">
                  <q-input v-model.number="newLoanData.monthly_payment" type="number" step="0.01" label="Monthly Payment (₱)" outlined dense :required="newLoanData.calc_mode === 'monthly'" />
                </div>
                <div class="col-6">
                  <q-input v-model.number="newLoanData.term_months" type="number" label="Term (Months)" outlined dense :required="newLoanData.calc_mode === 'monthly'" />
                </div>
              </div>
            </div>

            <!-- Live Preview -->
            <div class="bg-red-1 q-pa-sm rounded-borders text-center q-mt-sm">
              <div class="row justify-around">
                <div>
                  <div class="text-caption text-red-8">Derived Interest</div>
                  <div class="text-subtitle1 text-red-10 text-weight-bold">₱{{ formatMoney(computedInterest) }}</div>
                </div>
                <div>
                  <div class="text-caption text-red-8">Total Debt Burden</div>
                  <div class="text-h6 text-red-10 text-weight-bold">₱{{ formatMoney(computedTotal) }}</div>
                </div>
              </div>
            </div>

            <!-- Seamless Automations Integration (Visible on both Create & Edit) -->
            <div class="bg-teal-1 q-pa-sm rounded-borders q-mt-lg border-left-teal" v-if="newLoanData.monthly_payment > 0 && newLoanData.term_months > 0">
              <div class="row items-center q-mb-xs">
                <q-icon name="auto_awesome" color="teal-9" size="sm" class="q-mr-xs" />
                <div class="text-subtitle2 text-teal-10 text-weight-bold">Automatic Schedule Setup</div>
              </div>
              <div class="text-caption text-teal-8 q-mb-sm">
                {{ isEditing ? 'Update the funding account or schedule for this loan.' : 'Since you entered installment details, we can auto-generate the schedule right now.' }}
              </div>

              <div class="row q-col-gutter-sm">
                <div class="col-12">
                  <q-select 
                    v-model="newLoanData.from_account" 
                    :options="spendingAccounts" 
                    option-label="name" option-value="id" map-options emit-value
                    label="Pay From (Leave blank to skip automation)" outlined dense clearable
                    bg-color="white"
                  />
                </div>
                <template v-if="newLoanData.from_account">
                <div class="col-12">
                    <q-select 
                      v-model="newLoanData.frequency" 
                      :options="[
                        {label: 'Full Monthly Payment', value: 'monthly'},
                        {label: 'Split 50/50 per Cutoff (15th & End)', value: '15_end'},
                        {label: 'Split 50/50 per Cutoff (5th & 20th)', value: '5_20'},
                        {label: 'Split 50/50 per Cutoff (10th & 25th)', value: '10_25'},
                        {label: 'Split Every 2 Weeks (Bi-weekly)', value: 'biweekly'},
                        {label: 'Split Weekly (4x a month)', value: 'weekly'}
                      ]" 
                      option-label="label" option-value="value" map-options emit-value
                      label="Automation Frequency" outlined dense required bg-color="white" 
                    />
                  </div>
                  <div class="col-12">
                    <q-input v-model="newLoanData.first_payment_date" type="date" label="First Deduct Date" outlined dense required bg-color="white" />
                  </div>
                </template>
                <div class="col-12" v-if="newLoanData.from_account">
                  <q-input v-model="newLoanData.first_payment_date" type="date" label="First Payment Date" outlined dense required bg-color="white" />
                </div>
              </div>
            </div>

            <div class="row justify-end q-mt-lg">
              <q-btn flat label="Cancel" color="grey" v-close-popup />
              <q-btn type="submit" :label="isEditing ? 'Save Changes' : 'Create Loan'" color="red-9" :loading="financeStore.isLoading" unelevated />
            </div>
          </q-form>
        </q-card-section>
      </q-card>
    </q-dialog>

    <!-- Payment Dialog -->
    <q-dialog v-model="paymentDialog" @hide="resetPaymentForm">
      <q-card style="min-width: 350px; border-radius: 12px;">
        <q-card-section class="bg-red-9 text-white">
          <div class="text-h6">Pay towards {{ activeLoan?.name }}</div>
        </q-card-section>

        <q-card-section class="q-pt-md">
          <q-form @submit="submitPayment" class="q-gutter-md">
            <q-input v-model="paymentData.date" type="date" label="Date" outlined dense required />
            <q-select v-model="paymentData.from_account" :options="spendingAccounts" option-label="name" option-value="id" map-options emit-value label="Pay From (Spending Account)" outlined dense required />
            <q-input v-model.number="paymentData.amount" type="number" step="0.01" label="Payment Amount (₱)" outlined dense required />
            <q-input v-model="paymentData.description" type="text" label="Memo (Optional)" outlined dense />

            <div class="row justify-end q-mt-md">
              <q-btn flat label="Cancel" color="grey" v-close-popup />
              <q-btn type="submit" label="Confirm Payment" color="red-9" :loading="financeStore.isLoading" unelevated />
            </div>
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
const getTodayDate = () => new Date().toISOString().split('T')[0]

// --- State ---
const addLoanDialog = ref(false)
const isEditing = ref(false)
const editingId = ref(null)

const newLoanData = reactive({
  name: '',
  principal_amount: null,
  other_charges: null, 
  calc_mode: 'monthly',
  interest_amount: null,
  total_payable: null,
  monthly_payment: null,
  term_months: null,
  date: getTodayDate(),
  
  // Automation data
  frequency: 'monthly',
  from_account: null,
  first_payment_date: getTodayDate()
})

const paymentDialog = ref(false)
const activeLoan = ref(null)
const paymentData = reactive({
  date: getTodayDate(),
  from_account: null,
  amount: null,
  description: ''
})

const formatMoney = (val) => val ? Number(val).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '0.00'
const spendingAccounts = computed(() => financeStore.accounts.filter(a => a.type === 'asset' && a.is_active !== false))
// --- Smart Display Helper ---
const getLoanInstallmentText = (loan) => {
  // Check if this loan has an active custom schedule (Weekly, Per Cutoff, etc.)
  const sched = financeStore.schedules.find(s => s.loan_id === loan.id)
  
  if (sched && sched.amount > 0) {
    let freq = '/ mo'
    let term = 'mos'
    
    if (sched.frequency === 'weekly') { 
      freq = '/ wk'
      term = 'wks' 
    } else if (sched.frequency === 'biweekly') { 
      freq = '/ bi-wk'
      term = 'payments' 
    } else if (sched.frequency !== 'monthly') { 
      freq = '/ cutoff'
      term = 'payments' 
    }
    
    const durationText = sched.duration ? `(${sched.duration} ${term})` : ''
    return `₱${formatMoney(sched.amount)} ${freq} ${durationText}`
  }
  
  // Fallback: If no schedule exists, just show the base monthly data
  if (loan.monthly_payment > 0) {
    return `₱${formatMoney(loan.monthly_payment)} / mo (${loan.term_months} mos)`
  }
  
  return null
}
// --- Math Engine ---
const computedInterest = computed(() => {
  const p = Number(newLoanData.principal_amount) || 0
  const o = Number(newLoanData.other_charges) || 0

  if (newLoanData.calc_mode === 'interest') return Number(newLoanData.interest_amount) || 0
  
  if (newLoanData.calc_mode === 'total') {
    const t = Number(newLoanData.total_payable) || 0
    return t > (p + o) ? t - p - o : 0
  }
  
  if (newLoanData.calc_mode === 'monthly') {
    const m = Number(newLoanData.monthly_payment) || 0
    const months = Number(newLoanData.term_months) || 0
    const t = m * months
    return t > (p + o) ? t - p - o : 0
  }
  return 0
})

const computedTotal = computed(() => {
  const p = Number(newLoanData.principal_amount) || 0
  const o = Number(newLoanData.other_charges) || 0
  return p + o + computedInterest.value
})

const getTotalBurden = (loan) => (Number(loan.principal_amount) || 0) + (Number(loan.interest_amount) || 0) + (Number(loan.other_charges) || 0)
const getAmountPaid = (loan) => financeStore.transactions.filter(t => t.status === 'cleared' && t.loan_id === loan.id).reduce((acc, t) => acc + Number(t.amount), 0)
const getRemainingBalance = (loan) => {
  const remaining = getTotalBurden(loan) - getAmountPaid(loan)
  return remaining > 0 ? remaining : 0
}
const getPayoffProgress = (loan) => {
  const burden = getTotalBurden(loan)
  return burden === 0 ? 0 : getAmountPaid(loan) / burden
}

// --- Actions ---
const openAddLoanDialog = () => { 
  resetNewLoanForm()
  addLoanDialog.value = true 
}

const openEditLoanDialog = (loan) => {
  isEditing.value = true
  editingId.value = loan.id
  
  newLoanData.name = loan.name
  newLoanData.principal_amount = loan.principal_amount
  newLoanData.other_charges = loan.other_charges || null 
  newLoanData.date = loan.date
  
  newLoanData.monthly_payment = loan.monthly_payment || null
  newLoanData.term_months = loan.term_months || null

  if (loan.monthly_payment > 0 && loan.term_months > 0) {
    newLoanData.calc_mode = 'monthly'
  } else {
    newLoanData.calc_mode = 'interest'
    newLoanData.interest_amount = loan.interest_amount
  }

  // Look up if a schedule already exists to pre-fill the form
  const existingSched = financeStore.schedules.find(s => s.loan_id === loan.id)
  if (existingSched) {
    newLoanData.from_account = existingSched.from_account
    newLoanData.first_payment_date = existingSched.start_date
  } else {
    newLoanData.from_account = null
    newLoanData.first_payment_date = getTodayDate()
  }
  
  addLoanDialog.value = true
}

const resetNewLoanForm = () => {
  isEditing.value = false
  editingId.value = null
  newLoanData.name = ''; newLoanData.principal_amount = null; newLoanData.other_charges = null; newLoanData.calc_mode = 'monthly';
  newLoanData.interest_amount = null; newLoanData.total_payable = null; newLoanData.monthly_payment = null; 
  newLoanData.term_months = null; newLoanData.date = getTodayDate();
  newLoanData.frequency = 'monthly';
  newLoanData.from_account = null; newLoanData.first_payment_date = getTodayDate();
  newLoanData.first_payment_date = getTodayDate();
}

const submitNewLoan = async () => {
  // 1. Build the Loan Payload
  const loanPayload = {
    name: newLoanData.name,
    principal_amount: Number(newLoanData.principal_amount) || 0,
    other_charges: Number(newLoanData.other_charges) || 0, 
    interest_amount: computedInterest.value,
    monthly_payment: Number(newLoanData.monthly_payment) || 0, 
    term_months: Number(newLoanData.term_months) || 0,         
    date: newLoanData.date,
    is_active: true
  }

// 2. Build the Optional Schedule Payload
  let schedulePayload = null;
  
  if (newLoanData.monthly_payment > 0 && newLoanData.term_months > 0 && newLoanData.from_account) {
    
    // 🔥 UPGRADED AUTO-SPLIT MATH
    let schedAmount = newLoanData.monthly_payment;
    let schedDuration = newLoanData.term_months;

    if (newLoanData.frequency === 'weekly') {
      schedAmount = newLoanData.monthly_payment / 4;
      schedDuration = newLoanData.term_months * 4;
    } else if (newLoanData.frequency !== 'monthly') {
      // Catches bi-weekly AND all the twice-a-month cutoff options
      schedAmount = newLoanData.monthly_payment / 2;
      schedDuration = newLoanData.term_months * 2;
    }

    schedulePayload = {
      amount: Number(schedAmount),
      start_date: newLoanData.first_payment_date,
      frequency: newLoanData.frequency,
      action_type: 'expense',
      schedule_type: 'installment',
      duration: Number(schedDuration),
      from_account: newLoanData.from_account,
      to_account: null
    }
  }
  let result;

  if (isEditing.value) {
    // Send both payloads to the smart update function
    result = await financeStore.updateLoan(editingId.value, loanPayload, schedulePayload)
  } else {
    result = await financeStore.createLoan(loanPayload, schedulePayload)
  }
  
  if (!result.error) {
    addLoanDialog.value = false
    resetNewLoanForm()
  }
}

// ... Payment logic ...
const openPaymentDialog = (loan) => {
  activeLoan.value = loan
  paymentData.amount = loan.monthly_payment > 0 ? loan.monthly_payment : null
  paymentDialog.value = true
}

const resetPaymentForm = () => {
  paymentData.date = getTodayDate(); paymentData.from_account = null; paymentData.amount = null; paymentData.description = ''; activeLoan.value = null
}

const submitPayment = async () => {
  const payload = {
    date: paymentData.date, status: 'cleared', action_type: 'expense', 
    amount: paymentData.amount, from_account: paymentData.from_account,
    loan_id: activeLoan.value.id, description: paymentData.description || `Payment to ${activeLoan.value.name}`
  }
  const result = await financeStore.addTransaction(payload)
  if (!result.error) {
    paymentDialog.value = false
    resetPaymentForm()
  }
}

onMounted(() => {
  if (financeStore.accounts.length === 0 || financeStore.loans.length === 0) financeStore.fetchInitialData()
})
</script>

<style scoped>
.max-width-container { max-width: 1000px; margin: 0 auto; }
.debt-card { border-radius: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.06); }
.border-red { border-left: 6px solid #c62828; }
.border-sides { border-left: 1px solid #e0e0e0; border-right: 1px solid #e0e0e0; }
.border-right { border-right: 1px solid #e0e0e0; }
.border-left-teal { border-left: 4px solid #004d40; }
.rounded-borders { border-radius: 8px; }
</style>