import React, { useEffect, useState } from 'react'
import api from '../../services/api'
export default function FindFriends() {
    const[users,setUsers]=useState([])
    const[search,setSearch]=useState("")
    const[error,setError]=useState("")
    const[message,setMessage]=useState("")
        const closeerror=()=>{
    setError("")
    }
    const closemessage=()=>{
      setMessage("")
    }
    const getUsers=async ()=>{
        try{
            const set=await api.get("/friends/users")
            setUsers(set.data)
        }catch(err){
            setError(error.response?.data?.detail ||"failed to load users");
        }
    }
    useEffect(()=>{
        getUsers()
    },[])
    const sendRequest=async(id)=>{
        try{
            await api.post(`/friends/request/${id}`)
            setMessage("Friend request sent successfully!!")
            getUsers()
        setTimeout(()=>{
            setMessage("")
        },1500)
        }catch(err){
            setError(error.response?.data?.detail ||"Unable to send request");
        }
    }
    const list=users.filter((user)=>user.name.toLowerCase().includes(search.toLowerCase()))
  return (
    <div className='friends-section'>
        <h2>Find Friends</h2>
        <input type="text" placeholder='Search' className='search-input' value={search} onChange={(e)=>setSearch(e.target.value)}></input>
        <div className='users-list'>
            {list.length===0 ?(<p>No users exist.</p>):(
                list.map((user)=>(
                <div className='user-card' key={user.id}>
                    <div>
                        <h4>{user.name}</h4>
                        <p>{user.email}</p>
                    </div>
                    <div>{user.status==="none" &&(
                        <button className='add-btn' onClick={()=>sendRequest(user.id)}>Add Friend</button>
                    )}
                    {user.status==="pending" &&(
                        <button className='pending-btn' disabled>Pending</button>
                    )}
                    {user.status==="received" &&(
                        <button className='received-btn' disabled>Request Received</button>
                    )}
                    {user.status==="friends"&&(
                        <button className='friends-btn' disabled>Friends</button>
                    )}
                    </div>
                </div>
                    ))
            )}
        </div>
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
