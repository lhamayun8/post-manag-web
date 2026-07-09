import React, { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import api from "../../services/api";

export default function Verify() {
    const location=useLocation()
    const navigate=useNavigate()
    const email=location.state?.email||""
    const[code,setCode]=useState("")
    const[error,setError]=useState("")
    const[message,setMessage]=useState("")
    const handleSubmit=async(e)=>{
        e.preventDefault()
        try{
            const set=await api.post("/users/verify",{email,code})
            setMessage("Email verified successsfully!!")
            setTimeout(()=>{
                navigate("/login")
            },1000)
        }catch(err){
            setError(err.response?.data?.detail||"Verification failed")
        }
    }
  return (
    <div className='auth-container'>
        <h2>Verify Email</h2>
        <p>A verification code is sent to <br/>{email}</p>
        <form onSubmit={handleSubmit}>
        <input placeholder="Enter the code" value={code} onChange={(e)=>setCode(e.target.value)}></input>
        <button type="submit">Verify</button>
        </form>
      {message && <p style={{color:"green",fontWeight:"bold"}}>{message}</p>}
    </div>
  )
}
