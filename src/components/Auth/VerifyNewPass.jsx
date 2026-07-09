import React,{useState} from 'react'
import api from '../../services/api'
import { useLocation, useNavigate } from 'react-router-dom'

export default function VerifyNewPass() {
    const location=useLocation()
    const[message,setMessage]=useState("")
    const navigate=useNavigate()
    const[code,setCode]=useState("")
    const[error,setError]=useState("")
    const email=location.state?.email||""
    const handleSubmit=async(e)=>{
        e.preventDefault()
        setMessage("")
        setError("")
        try{
            await api.post("/users/reset-password-code",{email,code})
            setMessage("Code is verified. You may set a new password now.")
            setTimeout(()=>{
                navigate("/reset-password",{state:{email,code}});
            },1500)
        }catch(err){
             setError(err.response?.data?.detail || "Invalid verification code")
        }
    }
    const handleResend=async(e)=>{
        try{
            await api.post("/users/forgot-password",null,{params:{email}})
            setMessage("New verification codeis sent to your email")
        }catch(err){
            setError(err.response?.data?.detail || "could not send new code")
        }

    }
    
  return (
    <div className='auth-container'>
        <h2>Verify code</h2>
        <form onSubmit={handleSubmit}>
            <input placeholder='Verification code' value={code} onChange={(e)=>setCode(e.target.value)}></input>
            <button type="submit">Verify code</button>
        </form>
        <button onClick={handleResend} style={{marginTop:"10px"}}>Resend code</button>
        {message && <p style={{color:"green",fontWeight:"bold"}}>{message}</p>}
        {error && <p style={{ color: "orange" }}>{error}</p>}
    </div>
  )
}
