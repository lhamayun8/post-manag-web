import React, { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import api from "../../services/api";

export default function Verify() {
    const location=useLocation()
    const navigate=useNavigate()
    const email=(location.state?.email||"").toLowerCase()
    const[code,setCode]=useState("")
    const[error,setError]=useState("")
    const[message,setMessage]=useState("")
    const closeerror=()=>{
    setError("")
    }
    const closemessage=()=>{
      setMessage("")
    }
    const handleSubmit=async(e)=>{
        e.preventDefault()
        setError("")
        setMessage("")
        try{
            const set=await api.post("/users/verify",{email:email.trim().toLowerCase(),code})
            setMessage("Email verified successsfully!!")
            setTimeout(()=>{
                navigate("/login")
            },1000)
        }catch(err){
            setError(err.response?.data?.detail||"Verification failed")
        }
    }
    const handleResend=async(e)=>{
        setError("")
        setMessage("")
        try{
            await api.post("/users/resend-verification",null,{params:{email}})
            setMessage("New verification code is sent to your email")
        }catch(err){
            setError(err.response?.data?.detail || "could not send new code")
        }

    }
  return (
    <div className='auth-container'>
        <h2>Verify Email</h2>
        <p>A verification code is sent to <br/>{email}</p>
        <form onSubmit={handleSubmit}>
        <input placeholder="Enter the code" value={code} onChange={(e)=>setCode(e.target.value)}></input>
        <p style={{color:"#d97706",fontWeight:"bold",marginTop:"20px"}}>This verification code is valid for 15 minutes</p>
        <button type="submit">Verify</button>
        </form>
        <button onClick={handleResend} style={{marginTop:"15px"}}>Resend code</button>
        {message && (
        <div className="message-box">
        <span>{message}</span>
        <button onClick={closemessage}>X</button>
        </div>
        )}
         {error && (
        <div className="error-box">
        <span>{error}</span>
        <button onClick={closeerror}>X</button>
        </div>
        )}  
    </div>
  )
}
