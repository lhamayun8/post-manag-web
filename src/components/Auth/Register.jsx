import React, { useState } from 'react'
import { useNavigate,Link } from 'react-router-dom'
import api from '../../services/api'

export default function Register() {
    const[data,setData]=useState({name:"",email:"",password:""})
    const [error,setError]=useState("")
    const navigate=useNavigate()
    const handleSubmit=async(e)=>{
        e.preventDefault();
        try{
            await api.post("/users/register",data)
            navigate("/verify",{state:{email:data.email}})
        }catch(err){
            setError(err.response?.data?.detail || "Registration failed.");
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
        {error && <p style={{color:"orange"}}>{error}</p>}
        <p>Already have an account?<Link to="/login">Login</Link></p>
    </div>
  )
}
