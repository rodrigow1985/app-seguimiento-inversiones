import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface CurrencyStore {
  currency: 'ARS' | 'USD'
  toggle: () => void
  set: (currency: 'ARS' | 'USD') => void
}

export const useCurrencyStore = create<CurrencyStore>()(
  persist(
    (set) => ({
      currency: 'USD',
      toggle: () =>
        set((s) => ({ currency: s.currency === 'USD' ? 'ARS' : 'USD' })),
      set: (currency) => set({ currency }),
    }),
    { name: 'currency-preference' },
  ),
)
