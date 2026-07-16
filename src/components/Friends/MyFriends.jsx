import React, { useState,useEffect } from 'react'
import api from '../../services/api'
import { useNavigate } from 'react-router-dom'
export default function MyFriends() {
    const[friends,setFriends]=useState([])
    const[error,setError]=useState("")
    const navigate=useNavigate()
    const closeerror=()=>{
    setError("")
    }
    const getFriends=async()=>{
        try{
            const set=await api.get("/friends/")
            setFriends(set.data)
        }catch(err){
            setError(error.response?.data?.detail ||"failed to load friends");
        }
    }
    useEffect(()=>{
        getFriends()
    },[])
    const removefriend=async(id)=>{
        try{
            await api.delete(`/friends/${id}`)
            setFriends((prev)=>prev.filter((friend)=>friend.id!==id))
        }catch(err){
             setError(error.response?.data?.detail ||"Failed to remove friend");
        }
    }
  return (
    <div className='friends-section'>
        <h2>My friends</h2>
        {friends.length===0?(
            <p>You do not have any friends yet</p>):
        (<div className='users-list'>{friends.map((friend)=>(
            <div className='user-card' key={friend.id}>
                <div className='user-info'>
                    <div className='user-avatar'>
                        {friend.name?.charAt(0).toUpperCase()}
                    </div>
                    <div className='user-details'>
                        <h4>{friend.name}</h4>
                        <p>{friend.email}</p>
                    </div>
                    </div>
                    <div className='friend-actions'>
                        <button className='btn btn-primary' onClick={()=>navigate(`/profile/${friend.id}`)}>View Profile</button>
                        <button className='btn btn-danger' onClick={()=>removefriend(friend.id)}>Remove Friend</button>
                    </div>
                </div>
        ))}
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
