import { configureStore } from '@reduxjs/toolkit'
import auth from '@/modules/auth/store/authSlice'
export const store = configureStore({
  reducer: {
    auth
  }
})