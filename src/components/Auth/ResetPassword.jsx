import React, { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import api from '../../services/api'

export default function ResetPassword() {
    const location=useLocation()
    const[message,setMessage]=useState("")
    const navigate=useNavigate()
    const[data,setData]=useState({code:"",new:""})
    const[error,setError]=useState("")
    const email=location.state?.email||""
    const code=location.state?.code||""
    const handleSubmit=async(e)=>{
        e.preventDefault()
        setMessage("")
        setError("")
        try{
            await api.post("/users/reset-password",{email,code,new_password:data.new})
            setMessage("Password is updated")
            setTimeout(()=>{
                navigate("/login");
            },500)
        }catch(err){
             setError(err.response?.data?.detail || "Password can not be changed")
        }
    }
  return (
    <div className='auth-container'>
      <h2>Reset Password</h2>
      <form onSubmit={handleSubmit}>
        <input placeholder='new password' type="password" value={data.new} onChange={(e)=>setData({...data,new:e.target.value})}></input>
        <button>Change Password</button>
      </form>
      {message && <p style={{color:"green",fontWeight:"bold"}}>{message}</p>}
      {error && <p style={{ color: "orange" }}>{error}</p>}
    </div>
  )
}
