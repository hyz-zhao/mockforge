import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export const useAuthStore = create(
  persist(
    (set) => ({
      token: null,
      userId: null,
      username: null,
      avatar: null,

      setAuth: (data) =>
        set({
          token: data.token,
          userId: data.userId,
          username: data.username,
          avatar: data.avatar,
        }),

      logout: () =>
        set({
          token: null,
          userId: null,
          username: null,
          avatar: null,
        }),
    }),
    {
      name: 'auth-storage',
    }
  )
)
