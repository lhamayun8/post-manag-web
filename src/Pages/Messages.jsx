import React, { useState } from 'react'
import Inbox from '../components/Messages/Inbox'
import Requests from '../components/Messages/Requests'
import Chat from '../components/Messages/Chat'
import SearchUsers from '../components/Messages/SearchUsers'
import { useLocation } from 'react-router-dom'
export default function Messages() {
    const location=useLocation()
    const[tab,setTab]=useState(location.state?.tab||"inbox")
    const[convoid,setconvoid]=useState(location.state?.convo_id||null)
    const[receiver,setReceiver]=useState(null)
    const[receivername,setreceivername]=useState("")
    const currentuser=JSON.parse(localStorage.getItem("user") || "null")
  return (
    <div className='messages-page'>
        <div className='messages-sidebar'>
            <button onClick={()=>setTab("inbox")}>Inbox</button>
            <button onClick={()=>setTab("requests")}>Requests</button>
            <button onClick={()=>setTab("search")}>New Message</button>
        </div>
        <div className='messages-content'>
            {tab==="inbox" && <Inbox setTab={setTab} setconvoid={setconvoid} setreceivername={setreceivername} setReceiver={setReceiver}></Inbox>}
            {tab==="requests" &&<Requests setTab={setTab} setconvoid={setconvoid} setreceivername={setreceivername} setReceiver={setReceiver} selectedconvo={convoid}></Requests>}
            {tab==="search" &&<SearchUsers setTab={setTab} setconvoid={setconvoid} setReceiver={setReceiver} setreceivername={setreceivername}></SearchUsers>}
            {tab==="chat" &&  currentuser &&(<Chat convoid={convoid} setconvoid={setconvoid} receiver={receiver} receivername={receivername} currentuserid={currentuser.id}></Chat>)}
        </div>
      
    </div>
  )
}
