import React, { useEffect, useState } from 'react'
import api from '../services/api'
import { useAuth } from '../context/Authcontext'
import { useNavigate } from 'react-router-dom'

export default function Dashboard() {
    const[users,setUsers]=useState([])
    const[posts,setPosts]=useState([])
    const navigate=useNavigate()
    const {user}=useAuth()
    useEffect(()=>{
        const getData=async()=>{
            if(user?.role==="admin"){
                const uset=await api.get("/admin/users")
                setUsers(uset.data)
                const pset=await api.get("/admin/posts")
                setPosts(pset.data)
            }
        }
        getData()
    },[user])

    if(!user ||user.role!=="admin"){
        console.log("Access denied.")
        return(
            <div className='auth-container'>
                <p>You can not access this page</p>
                <button onClick={()=>navigate("/posts")} className='btn btn-primary'>Go to posts</button>
            </div>
        )
    }
    
  return (
    <div className='admin-dashboard'>
        <h1>Admin Dashboard</h1>
        <section className='admin-section'>
            <h2>Users</h2>
            <div className='table-container'>
                <ul>
                    {users.map((u)=>(
                        <li key={u.id}>{u.name},{u.email} ({u.role})
                        {u.role!=="admin" && (
                            <button onClick={async()=>{
                                try{
                                    await api.put(`/admin/makeadmin/${u.id}`,{},{headers:{Authorization:`Bearer ${localStorage.getItem("token")}`}})
                                    const uset=await api.get("/admin/users")
                                    setUsers(uset.data)
                                }catch(err){
                                    alert("failed topromote user")
                                }
                            }}>Promote to admin</button>
                        )}</li>
                    ))}
                </ul>
            </div>
            <h2>Posts</h2>
            <div className='table-container'>
                <ul>
                    {posts.map((post)=>(
                        <li key={post.id}>{post.title},{post.description}</li>
                    ))}
                </ul>
            </div>
        </section>
        <button onClick={()=>navigate("/posts")} className='btn btn-primary'>View posts</button>
    </div>
  )
}
