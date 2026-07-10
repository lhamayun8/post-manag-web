import React, { useState,useEffect } from 'react'
import api from '../../services/api'
export default function MyFriends() {
    const[friends,setFriends]=useState([])
    const[error,setError]=useState("")
    const getFriends=async()=>{
        try{
            const set=await api.get("/friends/")
            setFriends(set.data)
        }catch(err){
            setError(err.response?.data?.detail ||"failed to load friends");
        }
    }
    useEffect(()=>{
        getFriends()
    },[])
  return (
    <div className='friends-section'>
        <h2>My friends</h2>
        {friends.length===0?(<p>You do not have any friends yet</p>):
        (<div className='users-list'>{friends.map((friend)=>(
            <div className='user-card' key={friend.id}>
                <div>
                    <h4>{friend.name}</h4>
                    <p>{friend.email}</p>
                </div>
            <button className='friends-btn' disabled>Friends</button>
            </div>
        ))}
        </div>
        )}
      {error && <p style={{ color: "orange" }}>{error}</p>}   
    </div>
  )
}
