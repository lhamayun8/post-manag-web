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
            navigate("/login")
        }catch(err){
            setError("registration error")
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
                <input name="email"type="email" placeholder='email' onChange={handleChange}></input>
                <input name="password" type="password" placeholder='password' onChange={handleChange}></input>
                <button type="submit">Register User</button>
            </div>        
        </form>
        {error && <p style={{color:"orange"}}>{error}</p>}
        <p>Already have an account?<Link to="/login">Login</Link></p>
    </div>
  )
}
