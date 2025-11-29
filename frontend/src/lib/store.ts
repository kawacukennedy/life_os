import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface UIState {
  sidebarOpen: boolean
  theme: 'light' | 'dark'
  notificationsEnabled: boolean
  language: string
  setSidebarOpen: (open: boolean) => void
  toggleTheme: () => void
  setNotificationsEnabled: (enabled: boolean) => void
  setLanguage: (lang: string) => void
}

export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      sidebarOpen: false,
      theme: 'light',
      notificationsEnabled: true,
      language: 'en-US',
      setSidebarOpen: (open) => set({ sidebarOpen: open }),
      toggleTheme: () =>
        set((state) => ({
          theme: state.theme === 'light' ? 'dark' : 'light',
        })),
      setNotificationsEnabled: (enabled) => set({ notificationsEnabled: enabled }),
      setLanguage: (lang) => set({ language: lang }),
    }),
    {
      name: 'ui-store',
    }
  )
)

interface UserState {
  isAuthenticated: boolean
  user: any | null
  preferences: any
  setAuthenticated: (auth: boolean) => void
  setUser: (user: any) => void
  updatePreferences: (prefs: any) => void
}

export const useUserStore = create<UserState>()(
  persist(
    (set) => ({
      isAuthenticated: false,
      user: null,
      preferences: {},
      setAuthenticated: (auth) => set({ isAuthenticated: auth }),
      setUser: (user) => set({ user }),
      updatePreferences: (prefs) =>
        set((state) => ({
          preferences: { ...state.preferences, ...prefs },
        })),
    }),
    {
      name: 'user-store',
    }
  )
)