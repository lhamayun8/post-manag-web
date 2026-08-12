import React, { useEffect, useState } from 'react'
import api from '../../services/api'
export default function FindFriends() {
    const[users,setUsers]=useState([])
    const[search,setSearch]=useState("")
    const[error,setError]=useState("")
    const[message,setMessage]=useState("")
    const [loading, setLoading] = useState(false)
    const [hasMore, setHasMore] = useState(true)
    const [page, setPage] = useState(0)
    const [total, setTotal] = useState(0)
    const limit = 10
        const closeerror=()=>{
    setError("")
    }
    const closemessage=()=>{
      setMessage("")
    }
    const getUsers=async (reset=true)=>{
        if (loading) return
        setLoading(true)
        try{
            const skip=reset?0:page*limit
            const set=await api.get("/friends/users",{params:{search:search.trim(),limit:limit,skip:skip}})
            const userdata=set.data.users || []
            const total=set.data.total ||0
            if(reset){
                setUsers(userdata)
                setPage(1)
            }else{
                setUsers(prev=>[...prev,...userdata])
                setPage(prev=>prev+1)
            }
            setTotal(total)
            setHasMore(set.data.has_more)
        }catch(err){
            setError(err.response?.data?.detail ||"failed to load users");
        }finally{
            setLoading(false)
        }
    }
    useEffect(()=>{
        const timer = setTimeout(() => {
            getUsers(true)
        }, 500)
        return () => clearTimeout(timer)
    }, [search])

    const loadMore = () => {
        if (!loading && hasMore) {
            getUsers(false)
        }
    }

    const sendRequest=async(id)=>{
        try{
            await api.post(`/friends/request/${id}`)
            setMessage("Friend request sent successfully!!")
            getUsers()
        setTimeout(()=>{
            setMessage("")
        },1500)
        }catch(err){
            setError(err.response?.data?.detail ||"Unable to send request");
        }
    }
    const list=users
  return (
    <div className='friends-section'>
        <h2>Find Friends</h2>
        <div className="search-container">
        <input
          type="text"
          placeholder="Search Users"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        ></input>
      </div>
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
        {hasMore && !loading && users.length > 0 && (
            <div style={{ textAlign: "center", margin: "2rem 0" }}>
                <button className="btn btn-primary" onClick={loadMore}>
                                See More Users ({users.length} of {total})
                            </button>
                        </div>
                    )}

                    {!hasMore && users.length > 0 && (
                        <p style={{ textAlign: "center", color: "#666" }}>
                            No more users to load
                        </p>
                    )}
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
