import React, { useEffect, useState } from 'react'
import api from '../services/api'
import MyFriends from '../components/Friends/MyFriends'
import FindFriends from '../components/Friends/FindFriends'
import SentRequests from '../components/Friends/SentRequests'
import FriendRequests from '../components/Friends/FriendRequests'

export default function Friends() {
    const[tab,setTab]=useState("find")
  return (
    <div className='friends-page'>
        <div className='friends-sidebar'>
            <button onClick={()=>setTab("find")}>Find Friends</button>
            <button onClick={()=>setTab("sent")}>Sent requests</button>
            <button onClick={()=>setTab("requests")}>Friend Requests</button>
            <button onClick={()=>setTab("friends")}>My Friends</button>
        </div>
        <div className='friends-content'>
            {
                tab==="find" &&<FindFriends></FindFriends>
            }
            {
                tab==="sent" &&<SentRequests></SentRequests>
            }
            {
                tab==="requests"&&<FriendRequests></FriendRequests>
            }
            {
                tab==="friends"&&<MyFriends></MyFriends>
            }
        </div>
    </div>
    )
}
