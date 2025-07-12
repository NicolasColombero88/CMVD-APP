import { createSlice } from '@reduxjs/toolkit'

export const auth= createSlice({
    name: 'auth',
    initialState: {companyId:"",email:"",id:"",name:"",role:"",token:""},
    reducers:{
        addAuth:(state,action)=>{
            console.log(state,action);
            return action.payload;
        }
    }
})
export const {addAuth}=auth.actions
export default auth.reducer
