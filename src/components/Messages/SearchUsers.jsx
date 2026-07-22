import React, { useEffect, useState } from 'react'
import axios from 'axios'

export default function SearchUsers({setTab,setconvoid,setReceiver,setreceivername}) {
    const[users,setusers]=useState([])
    const[search,setSearch]=useState("")
    const[loading,setLoading]=useState(false)
    const[error,setError]=useState("")
    const closeerror=()=>{
    setError("")
    }
    useEffect(()=>{
        const delay=setTimeout(()=>{
            if(search.trim()===""){
                setusers([])
                return
            }
            setLoading(true)
            axios.get(`http://localhost:8000/messages/search?find=${search}`,{
                headers:{Authorization:`Bearer ${localStorage.getItem("token")}`}
            }).then(set=>setusers(set.data)).catch(()=>setusers([])).finally(()=>setLoading(false))
        },300)
        return()=>clearTimeout(delay)
    },[search])

    async function startchat(user){
        try{
            const set= await axios.get(
            "http://localhost:8000/messages/inbox",{headers:{
              Authorization:`Bearer ${localStorage.getItem("token")}`,
          }});
          const existingchat=set.data.find(chat=>chat.user_id===user.id)
          setReceiver(user.id)
          setreceivername(user.name)
          if(existingchat){
            setconvoid(existingchat.conversation_id)
          }else{
            setconvoid(null)
          }
          setTab("chat")
          if(window.refreshInbox){
            window.refreshInbox()
          }
        }catch(err){
             setError(err.response?.data?.detail ||"Failed to load old chats")
        }
}
  return (
    <div>
      <h2>New Message</h2>
      <input placeholder='search user...' value={search} onChange={e=>setSearch(e.target.value)}></input>
      {loading &&<p>Searching...</p>}
      {users.map(user=>(<div key={user.id} className='user-card' onClick={()=>startchat(user)}>
        <div className='user-avatar'>{user.name[0]}</div>
        <div><h4>{user.name}</h4>
        <p>{user.email}</p>
        </div>
        </div>))}
                {error && (
        <div className="error-box">
        <span>{error}</span>
        <button onClick={closeerror}>X</button>
        </div>
        )}  
    </div>
  )
}
