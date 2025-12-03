import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'

const resources = {
  en: {
    translation: {
      welcome: 'Welcome to LifeOS',
      dashboard: 'Dashboard',
      health: 'Health',
      finance: 'Finance',
      learn: 'Learn',
      settings: 'Settings',
      notifications: 'Notifications',
      signUp: 'Sign Up',
      logIn: 'Log In',
      getStarted: 'Get started — it\'s free',
      // Add more translations as needed
    },
  },
  es: {
    translation: {
      welcome: 'Bienvenido a LifeOS',
      dashboard: 'Panel de Control',
      health: 'Salud',
      finance: 'Finanzas',
      learn: 'Aprender',
      settings: 'Configuración',
      notifications: 'Notificaciones',
      signUp: 'Registrarse',
      logIn: 'Iniciar Sesión',
      getStarted: 'Comenzar — es gratis',
    },
  },
}

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: 'en',
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false,
    },
  })

export default i18n