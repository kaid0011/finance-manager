import { createApp } from 'vue'
import { createPinia } from 'pinia'
import { Quasar } from 'quasar'
import router from './router'

import '@quasar/extras/material-icons/material-icons.css'
import '@quasar/extras/fontawesome-v5/fontawesome-v5.css'
import 'quasar/src/css/index.sass'
import App from './App.vue'

const myApp = createApp(App)
const pinia = createPinia()

myApp.use(pinia)
myApp.use(router)
myApp.use(Quasar, { plugins: {} })
myApp.mount('#app')