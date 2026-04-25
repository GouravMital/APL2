import { create } from 'zustand'

export type TabId = 'home' | 'mood' | 'journal' | 'breathe' | 'meditate' | 'sleep' | 'hydrate' | 'habits' | 'insights' | 'companion'

interface WellnessState {
  activeTab: TabId
  setActiveTab: (tab: TabId) => void
  sidebarOpen: boolean
  setSidebarOpen: (open: boolean) => void
}

export const useWellnessStore = create<WellnessState>((set) => ({
  activeTab: 'home',
  setActiveTab: (tab) => set({ activeTab: tab }),
  sidebarOpen: false,
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
}))
