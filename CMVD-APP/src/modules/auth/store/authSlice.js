import { createSlice } from '@reduxjs/toolkit';

const storedAuth = localStorage.getItem('auth');
const initialState = storedAuth ? JSON.parse(storedAuth) : { companyId: "", email: "", id: "", name: "", role: "", token: "" };

export const auth = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    addAuth: (state, action) => {
      localStorage.setItem('auth', JSON.stringify(action.payload));
      return action.payload;
    },
    clearAuth: (state) => {
      localStorage.removeItem('auth');
      return { companyId: "", email: "", id: "", name: "", role: "", token: "" };
    }
  }
});

export const { addAuth, clearAuth } = auth.actions;
export default auth.reducer;
