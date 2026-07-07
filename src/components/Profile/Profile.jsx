import React, { useState, useEffect} from 'react'
import api from '../../services/api'
import { Link } from 'react-router-dom'

export default function Profile() {
    const [profile,setProfile]=useState(null)
    const[error,setError]=useState("")

    useEffect(()=>{
        const fetchProfile=async ()=>{
          try{
                const set=await api.get("/users/me")
                setProfile(set.data);
          }catch(err){
            setError("failed to load profile")
          }
        }
        fetchProfile()
    },[])
    if(!profile){
      return <p>LOADING</p>
    }
  return (
    <div className='auth-container'>
        <h2>MY PROFILE</h2>
        <div className='profile-details'>
          <p>Name:{profile.name}</p>
          <p>Email:{profile.email}</p>
          <p>Role:{profile.role ||'user'}</p>
        </div>
        <div className='post-actions'>
          <Link to="/profile/edit" className='btn btn-primary'>Edit your profile</Link>
          <Link to="/profile/changepass" className='btn btn-info'>Change your password</Link>
        </div>
    </div>
  )
}
