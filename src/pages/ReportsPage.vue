<template>
  <q-page class="q-pa-md max-width-container">
    <div class="row items-center justify-between q-mb-md">
      <div class="text-h5 text-weight-bold text-blue-grey-9">Financial Analytics</div>
      <q-btn color="blue-grey-9" icon="refresh" label="Refresh Data" @click="financeStore.fetchInitialData()" unelevated />
    </div>

    <!-- ==========================================
         SECTION 1: FINANCIAL HEALTH INDICATORS
         ========================================== -->
    <div class="row q-col-gutter-md q-mb-lg">
      <!-- Net Worth -->
      <div class="col-12 col-md-4">
        <q-card class="health-card bg-blue-grey-9 text-white">
          <q-card-section>
            <div class="text-caption text-blue-grey-3 text-weight-bold text-uppercase">Total Net Worth</div>
            <div class="text-h4 text-weight-bold q-my-sm">₱{{ formatMoney(netWorth) }}</div>
            <div class="text-caption text-blue-grey-2">Assets + Savings - Debt</div>
          </q-card-section>
        </q-card>
      </div>

      <!-- Savings Rate (Current Month) -->
      <div class="col-12 col-md-4">
        <q-card class="health-card bg-teal-9 text-white">
          <q-card-section class="row items-center justify-between">
            <div>
              <div class="text-caption text-teal-2 text-weight-bold text-uppercase">This Month's Savings Rate</div>
              <div class="text-h4 text-weight-bold q-my-sm">{{ savingsRate.toFixed(1) }}%</div>
              <div class="text-caption text-teal-1">Target: 20% or higher</div>
            </div>
            <q-circular-progress
              show-value
              :value="savingsRate"
              size="60px"
              :thickness="0.2"
              color="teal-2"
              track-color="teal-10"
              class="text-weight-bold"
            />
          </q-card-section>
        </q-card>
      </div>

      <!-- Total Debt -->
      <div class="col-12 col-md-4">
        <q-card class="health-card bg-red-9 text-white">
          <q-card-section>
            <div class="text-caption text-red-2 text-weight-bold text-uppercase">Total Outstanding Debt</div>
            <div class="text-h4 text-weight-bold q-my-sm">₱{{ formatMoney(Math.abs(totalDebt)) }}</div>
            <div class="text-caption text-red-1">Credit Cards & Loans</div>
          </q-card-section>
        </q-card>
      </div>
    </div>

    <!-- ==========================================
         SECTION 2: ACCOUNT DISTRIBUTION
         ========================================== -->
    <div class="row q-col-gutter-md q-mb-lg">
      <div class="col-12 col-md-6">
        <q-card class="dashboard-card">
          <q-card-section class="bg-blue-grey-1">
            <div class="text-subtitle1 text-weight-bold text-blue-grey-9">Liquid Assets & Savings</div>
          </q-card-section>
          <q-list separator>
            <q-item v-for="acc in assetAccounts" :key="acc.id">
              <q-item-section>
                <q-item-label class="text-weight-medium">{{ acc.name }}</q-item-label>
                <q-item-label caption class="text-uppercase text-weight-bold" :class="acc.type === 'savings' ? 'text-amber-9' : 'text-teal-9'">
                  {{ acc.type === 'savings' ? 'Vault' : 'Spending' }}
                </q-item-label>
              </q-item-section>
              <q-item-section side>
                <div class="text-subtitle1 text-weight-bold text-blue-grey-9">₱{{ formatMoney(acc.balance) }}</div>
              </q-item-section>
            </q-item>
          </q-list>
        </q-card>
      </div>

      <div class="col-12 col-md-6">
        <q-card class="dashboard-card">
          <q-card-section class="bg-red-1">
            <div class="text-subtitle1 text-weight-bold text-red-9">Liabilities & Debts</div>
          </q-card-section>
          <q-list separator>
            <q-item v-if="debtAccounts.length === 0">
              <q-item-section class="text-grey-7 text-center q-pa-md">No debt accounts found.</q-item-section>
            </q-item>
            <q-item v-for="acc in debtAccounts" :key="acc.id">
              <q-item-section>
                <q-item-label class="text-weight-medium">{{ acc.name }}</q-item-label>
              </q-item-section>
              <q-item-section side>
                <div class="text-subtitle1 text-weight-bold text-red-9">₱{{ formatMoney(Math.abs(acc.balance)) }}</div>
              </q-item-section>
            </q-item>
          </q-list>
        </q-card>
      </div>
    </div>

    <!-- ==========================================
         SECTION 3: PAST VS FUTURE PERFORMANCE
         ========================================== -->
    <q-card class="dashboard-card q-mb-lg">
      <q-tabs
        v-model="tab"
        dense
        class="text-grey-7 bg-blue-grey-1"
        active-color="teal-9"
        indicator-color="teal-9"
        align="justify"
      >
        <q-tab name="future" label="12-Month Future Projection" class="text-weight-bold" />
        <q-tab name="past" label="Past 6-Months History" class="text-weight-bold" />
      </q-tabs>

      <q-tab-panels v-model="tab" animated>
        
        <!-- FUTURE PROJECTION CHART -->
        <q-tab-panel name="future" class="q-pa-none">
          <div v-if="hasNegativeProjection" class="bg-red-1 text-red-10 q-pa-md text-weight-bold text-center border-bottom-red">
            <q-icon name="warning" size="sm" class="q-mr-xs"/> Warning: Your spending cash will drop below zero within this timeframe.
          </div>
          
          <div class="chart-container row items-end q-pa-md no-wrap overflow-auto">
            <div v-for="data in futureMonthlyData" :key="data.monthPrefix" class="column items-center q-mx-sm" style="min-width: 60px;">
              <div class="text-caption text-weight-bold q-mb-sm" :class="data.endBalance < 0 ? 'text-red-9' : 'text-blue-grey-9'">
                ₱{{ formatShort(data.endBalance) }}
              </div>
              <div class="bars-wrapper row q-gutter-x-xs items-end justify-center">
                <div class="bar bg-teal-4" :style="{ height: getFutureBarHeight(data.income) }">
                  <q-tooltip class="bg-teal-9">Income: ₱{{ formatMoney(data.income) }}</q-tooltip>
                </div>
                <div class="bar bg-red-4" :style="{ height: getFutureBarHeight(data.expense) }">
                  <q-tooltip class="bg-red-9">Expense: ₱{{ formatMoney(data.expense) }}</q-tooltip>
                </div>
              </div>
              <div class="text-caption text-grey-8 q-mt-sm text-weight-bold">{{ data.monthName }}</div>
            </div>
          </div>
        </q-tab-panel>

        <!-- HISTORICAL PERFORMANCE TABLE -->
        <q-tab-panel name="past" class="q-pa-none">
          <q-table flat :rows="pastMonthlyData" :columns="pastColumns" row-key="monthPrefix" hide-bottom :pagination="{ rowsPerPage: 12 }">
            <template v-slot:body-cell-net="props">
              <q-td :props="props">
                <q-chip :color="props.row.net >= 0 ? 'teal-1' : 'red-1'" :text-color="props.row.net >= 0 ? 'teal-10' : 'red-10'" dense square class="text-weight-bold">
                  {{ props.row.net > 0 ? '+' : '' }}₱{{ formatMoney(props.row.net) }}
                </q-chip>
              </q-td>
            </template>
          </q-table>
        </q-tab-panel>

      </q-tab-panels>
    </q-card>

  </q-page>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useFinanceStore } from '@/stores/financeStore'

const financeStore = useFinanceStore()
const tab = ref('future')

// --- Utilities ---
const formatMoney = (val) => val ? Number(val).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '0.00'

// Condenses large numbers (e.g. 15000 -> 15k) for the CSS chart to prevent overlapping
const formatShort = (val) => {
  if (Math.abs(val) >= 1000) return (val / 1000).toFixed(1) + 'k'
  return val.toFixed(0)
}

const getTodayDate = () => new Date().toISOString().split('T')[0]

// --- CORE MATH ENGINE ---

// 1. Calculate the exact, real-time balance of every single account
const accountBalances = computed(() => {
  const balances = {}
  financeStore.accounts.forEach(a => balances[a.id] = 0)
  
  // Only calculate based on CLEARED transactions up to today
  financeStore.transactions.filter(t => t.status === 'cleared' && t.date <= getTodayDate()).forEach(t => {
    if (t.action_type === 'income' && balances[t.to_account] !== undefined) balances[t.to_account] += Number(t.amount)
    if (t.action_type === 'expense' && balances[t.from_account] !== undefined) balances[t.from_account] -= Number(t.amount)
    if (t.action_type === 'transfer') {
      if (balances[t.from_account] !== undefined) balances[t.from_account] -= Number(t.amount)
      if (balances[t.to_account] !== undefined) balances[t.to_account] += Number(t.amount)
    }
  })
  return balances
})

// 2. Health Indicators
const assetAccounts = computed(() => {
  return financeStore.accounts
    .filter(a => a.type === 'asset' || a.type === 'savings')
    .map(a => ({ ...a, balance: accountBalances.value[a.id] }))
    .sort((a, b) => b.balance - a.balance)
})

const debtAccounts = computed(() => {
  return financeStore.accounts
    .filter(a => a.type === 'debt')
    .map(a => ({ ...a, balance: accountBalances.value[a.id] }))
})

// Net Worth = Sum of all account balances. 
// (Since debt expenses pull the account balance negative, summing it automatically subtracts it from your wealth!)
const netWorth = computed(() => {
  return Object.values(accountBalances.value).reduce((sum, bal) => sum + bal, 0)
})

const totalDebt = computed(() => {
  // 1. Calculate revolving debt (Credit Cards from accounts)
  const revolving = debtAccounts.value.reduce((sum, a) => sum + a.balance, 0)
  
  // 2. Calculate remaining fixed loans (from our new table)
  const fixedLoans = financeStore.loans.reduce((sum, loan) => {
    const paid = financeStore.transactions
      .filter(t => t.loan_id === loan.id && t.status === 'cleared')
      .reduce((acc, t) => acc + Number(t.amount), 0)
    
    const total = Number(loan.principal_amount) + Number(loan.interest_amount)
    return sum + (total - paid)
  }, 0)

  // Revolving debt is negative, so we subtract the fixed loans to push it further negative
  return revolving - fixedLoans 
})

// 3. Savings Rate (Current Month)
const savingsRate = computed(() => {
  const currentMonth = getTodayDate().substring(0, 7)
  const currentMonthTx = financeStore.transactions.filter(t => t.status === 'cleared' && t.date.startsWith(currentMonth))
  
  const income = currentMonthTx.filter(t => t.action_type === 'income').reduce((sum, t) => sum + Number(t.amount), 0)
  const expense = currentMonthTx.filter(t => t.action_type === 'expense').reduce((sum, t) => sum + Number(t.amount), 0)
  
  if (income === 0) return 0
  const rate = ((income - expense) / income) * 100
  return rate > 100 ? 100 : (rate < 0 ? 0 : rate)
})

// --- PROJECTION GENERATORS ---

const generateMonths = (count, direction = 'future') => {
  const dates = []
  const d = new Date()
  d.setDate(1)
  
  if (direction === 'past') d.setMonth(d.getMonth() - count + 1)

  for (let i = 0; i < count; i++) {
    const year = d.getFullYear()
    const month = String(d.getMonth() + 1).padStart(2, '0')
    dates.push(`${year}-${month}`)
    d.setMonth(d.getMonth() + 1)
  }
  return direction === 'past' ? dates.reverse() : dates
}

// Future Runway (12 Months)
const futureMonthlyData = computed(() => {
  const months = generateMonths(12, 'future')
  const savingsIds = financeStore.accounts.filter(a => a.type === 'savings').map(a => a.id)
  
  // Starting Cash = Sum of all non-savings, non-debt asset accounts
  let runningBalance = financeStore.accounts
    .filter(a => a.type === 'asset')
    .reduce((sum, a) => sum + accountBalances.value[a.id], 0)
  
  const result = []
  
  months.forEach(monthPrefix => {
    const monthTx = financeStore.transactions.filter(t => t.date.startsWith(monthPrefix))
    let inc = 0; let exp = 0;
    
    monthTx.forEach(t => {
      if (t.action_type === 'income' && !savingsIds.includes(t.to_account)) inc += Number(t.amount)
      if (t.action_type === 'expense' && !savingsIds.includes(t.from_account)) exp += Number(t.amount)
      if (t.action_type === 'transfer' && !savingsIds.includes(t.from_account) && savingsIds.includes(t.to_account)) exp += Number(t.amount)
      if (t.action_type === 'transfer' && savingsIds.includes(t.from_account) && !savingsIds.includes(t.to_account)) inc += Number(t.amount)
    })
    
    runningBalance += (inc - exp)
    const d = new Date(monthPrefix + '-01')
    result.push({ monthPrefix, monthName: d.toLocaleDateString('default', { month: 'short', year: '2-digit' }), income: inc, expense: exp, endBalance: runningBalance })
  })
  return result
})

const maxFutureBarValue = computed(() => {
  let max = 1
  futureMonthlyData.value.forEach(d => { if (d.income > max) max = d.income; if (d.expense > max) max = d.expense })
  return max
})

const getFutureBarHeight = (value) => `${(value / maxFutureBarValue.value) * 100}%`
const hasNegativeProjection = computed(() => futureMonthlyData.value.some(d => d.endBalance < 0))

// Past Performance (6 Months)
const pastMonthlyData = computed(() => {
  const months = generateMonths(6, 'past')
  const result = []
  
  months.forEach(monthPrefix => {
    // Only look at CLEARED history
    const monthTx = financeStore.transactions.filter(t => t.status === 'cleared' && t.date.startsWith(monthPrefix))
    const inc = monthTx.filter(t => t.action_type === 'income').reduce((sum, t) => sum + Number(t.amount), 0)
    const exp = monthTx.filter(t => t.action_type === 'expense').reduce((sum, t) => sum + Number(t.amount), 0)
    
    const d = new Date(monthPrefix + '-01')
    result.push({ monthPrefix, monthName: d.toLocaleDateString('default', { month: 'short', year: 'numeric' }), income: inc, expense: exp, net: inc - exp })
  })
  return result
})

const pastColumns = [
  { name: 'monthName', label: 'Month', field: 'monthName', align: 'left' },
  { name: 'income', label: 'Total Earned (₱)', field: 'income', align: 'right', format: val => formatMoney(val) },
  { name: 'expense', label: 'Total Spent (₱)', field: 'expense', align: 'right', format: val => formatMoney(val) },
  { name: 'net', label: 'Net Cash Flow', field: 'net', align: 'right' }
]

onMounted(() => {
  if (financeStore.accounts.length === 0) financeStore.fetchInitialData()
})
</script>

<style scoped>
.max-width-container { max-width: 1200px; margin: 0 auto; }
.health-card { border-radius: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.1); height: 100%; }
.dashboard-card { border-radius: 12px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.06); height: 100%; }
.border-bottom-red { border-bottom: 2px solid #b71c1c; }

/* CSS Bar Chart Styles */
.chart-container { min-height: 220px; overflow-x: auto; padding-top: 40px; }
.bars-wrapper { height: 120px; width: 32px; }
.bar { width: 14px; border-radius: 4px 4px 0 0; min-height: 2px; transition: height 0.5s ease-in-out; }

/* Webkit Scrollbar styling for the chart */
.chart-container::-webkit-scrollbar { height: 8px; }
.chart-container::-webkit-scrollbar-thumb { background: #cfd8dc; border-radius: 4px; }

:deep(.q-table th) { font-weight: 700; color: #263238; background-color: #f5f7f8; }
</style>