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
  this.isLoading = true;
  this.authError = null;
  try {
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) throw error;
    
    return { error: false }; 
  } catch (err) {
    this.authError = err.message;
    return { error: true, message: err.message };
  } finally {
    this.isLoading = false;
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

    // Used for resetting a forgotten password via email link
    async updatePassword(newPassword) {
      this.isLoading = true
      this.authError = null
      try {
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

    // NEW: Securely change password from inside the app
    async changePassword(currentPassword, newPassword) {
      this.isLoading = true
      this.authError = null
      
      try {
        // 1. Get the current logged-in user to find their email address
        const { data: { user }, error: userError } = await supabase.auth.getUser()
        if (userError || !user) throw new Error('Could not verify your account. Please log out and back in.')

        // 2. Verify current password
        const { error: verifyError } = await supabase.auth.signInWithPassword({
          email: user.email, 
          password: currentPassword
        })
        if (verifyError) throw new Error('The current password you entered is incorrect.')

        // 3. Update to the new password
        const { error: updateError } = await supabase.auth.updateUser({ password: newPassword })
        if (updateError) throw updateError

        return { error: false }
      } catch (err) {
        this.authError = err.message
        return { error: true, message: err.message }
      } finally {
        this.isLoading = false
      }
    },
    
  }
})