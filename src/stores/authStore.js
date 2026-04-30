import { defineStore } from 'pinia'
import { supabase } from '@/supabase/config.js'
import { useFinanceStore } from './financeStore'

export const useAuthStore = defineStore('authStore', {
  state: () => ({
    user: null,
    isLoading: false,
    authError: null
  }),

  actions: {
    // Check if the user is already logged in when the app loads
    async initialize() {
      const { data } = await supabase.auth.getSession()
      this.user = data.session?.user || null

      // Set up a listener for login/logout events
      supabase.auth.onAuthStateChange((event, session) => {
        this.user = session?.user || null
      })
    },

    async register(email, password) {
      this.isLoading = true
      this.authError = null
      try {
        const { error } = await supabase.auth.signUp({ email, password })
        if (error) throw error
      } catch (err) {
        this.authError = err.message
      } finally {
        this.isLoading = false
      }
    },

    async login(email, password) {
      this.isLoading = true
      this.authError = null
      try {
        const { error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) throw error
      } catch (err) {
        this.authError = err.message
      } finally {
        this.isLoading = false
      }
    },

   async logout() {
      await supabase.auth.signOut()
      this.user = null
      
      // CRITICAL: Wipe ALL finance data from memory so the next user doesn't see it!
      const financeStore = useFinanceStore()
      financeStore.accounts = []
      financeStore.transactions = []
      financeStore.loans = []
      financeStore.schedules = []
      financeStore.goals = [] // <--- Add this line!
    },

    async sendPasswordResetEmail(email) {
      this.isLoading = true
      this.authError = null
      try {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          // This tells Supabase where to send the user after they click the email link
          redirectTo: `${window.location.origin}/reset-password`, 
        })
        if (error) throw error
        return { error: false }
      } catch (err) {
        this.authError = err.message
        return { error: true }
      } finally {
        this.isLoading = false
      }
    },

    async updatePassword(newPassword) {
      this.isLoading = true
      this.authError = null
      try {
        // updateUser automatically updates the currently logged-in user
        const { error } = await supabase.auth.updateUser({ password: newPassword })
        if (error) throw error
        return { error: false }
      } catch (err) {
        this.authError = err.message
        return { error: true }
      } finally {
        this.isLoading = false
      }
    },
    
  }
})