import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../../services/api'

export default function ForgotPassword() {
    const[email,setEmail]=useState("")
    const[error,setError]=useState("")
    const navigate=useNavigate()
    const handleSubmit=async(e)=>{
        e.preventDefault()
        setError("")
        try{
            await api.post("/users/forgot-password",null,{params:{
                email:email
            }})
            navigate("/verify-new-pass",{state:{email}})
        }catch(err){
            setError(err.response?.data?.detail || "Request for reset password failed")
        }
    }
  return (
    <div className='auth-container'>
        <h2>Forgot Password</h2>
        <form onSubmit={handleSubmit}>
            <input type="email" placeholder='email' value={email} onChange={(e)=>setEmail(e.target.value)}></input>
            <button>Send code</button>
        </form>
      {error && <p style={{ color: "orange" }}>{error}</p>}
    </div>
  )
}
