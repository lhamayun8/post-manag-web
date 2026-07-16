import React, { useState } from 'react'
import { useNavigate,Link } from 'react-router-dom'
import api from '../../services/api'

export default function Register() {
    const[data,setData]=useState({name:"",email:"",password:""})
    const [error,setError]=useState("")
    const navigate=useNavigate()
    const closeerror=()=>{
    setError("")
    } 
    const handleSubmit=async(e)=>{
        e.preventDefault();
        const registerdata={...data,email:data.email.trim().toLowerCase(),name:data.name.trim()}
        try{
            await api.post("/users/register",registerdata)
            navigate("/verify",{state:{email:registerdata.email}})
        }catch(error){
        if(error.response?.status===422){
            setError("Please enter valid email or a password of at least 8 characters. You must enter a name.")
        }else{
            setError(error.response?.data?.detail || "Registration failed.");
        }
    }
    }
    const handleChange=((e)=>{
        setData({...data,[e.target.name]:e.target.value})
    })

  return (
    <div className='auth-container'>
        <h2>REGISTER</h2>
        <form onSubmit={handleSubmit}>
            <div className="form-group">
                <input name="name" placeholder='name' onChange={handleChange}></input>
            </div>
            <div className="form-group">
                <input name="email"type="email" placeholder='email' onChange={handleChange}></input>
            </div>
            <div className="form-group">
                <input name="password" type="password" placeholder='password' onChange={handleChange}></input>
            </div>
                <button type="submit">Register User</button>
        </form>
            {error && (
        <div className="error-box">
        <span>{error}</span>
        <button onClick={closeerror}>X</button>
        </div>
        )}  
        <p>Already have an account?<Link to="/login">Login</Link></p>
    </div>
  )
}
