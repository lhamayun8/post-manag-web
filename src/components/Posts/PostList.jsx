import React, { useState,useEffect } from 'react'
import api from '../../services/api'
import { Link } from 'react-router-dom'

export default function PostList() {
    const [posts,setPost]=useState([])
    const[search,setSearch]=useState("")
    const[err,setError]=useState("")

    useEffect(()=>{
        fetchPost()
    },[])
    const fetchPost=(async()=>{
        try{
            const set=await api.get('/posts',{params:{search}})
            setPost(set.data);
        }catch(error){
            setError("can not load post list")
        }
    })

    return (
    <div className='posts-container'>
        <h2>Posts</h2>
        <div className='search-container'>
            <input type="text" placeholder='Search Posts' value={search} 
            onChange={(e)=>setSearch(e.target.value)}></input>
            <button onClick={fetchPost} className='btn btn-primary'>Search</button>
        </div>
        {err && <p style={{color:"orange"}}>{err}</p>}
        <ul>
            {posts.map((post)=>(
                <li key={post.id} className='post-item'>
                    <Link to={`/posts/${post.id}`} >{post.title}</Link>
                </li>
        ))}
        </ul>
        <Link to="/posts/new" className='btn btn-primary'>Create new post</Link>
    </div>
  )
}
