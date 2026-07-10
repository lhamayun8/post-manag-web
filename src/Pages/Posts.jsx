import React, { useState } from 'react'
import { useAuth } from '../context/Authcontext'
import PostList from '../components/Posts/PostList'
import MyDrafts from '../components/Posts/MyDrafts'
import MyPosts from '../components/Posts/MyPosts'
import MakePost from '../components/Posts/MakePost'
import EditPost from '../components/Posts/EditPost'
export default function Posts() {
    const{user}=useAuth()
    const[editId,setEditId]=useState(null)
    const[tab,setTab]=useState("published")
  return (
    <div className='posts-page'>            
        <div className='posts-sidebar'>
            <button onClick={()=>setTab("published")}>Published Posts</button>
            {user &&(
                <>
                <button onClick={()=>setTab("myposts")}>My Posts</button>
                <button onClick={()=>setTab("drafts")}>My Drafts</button>
                <button onClick={()=>setTab("create")}>Create Post</button>
                </>
            )}
        </div>
        <div className='posts-content'>
            {tab==="published" && (<PostList></PostList>)}
            {user && tab==="myposts" && (<MyPosts setTab={setTab} setEditId={setEditId}></MyPosts>)}
            {user && tab==="drafts" &&(<MyDrafts setTab={setTab} setEditId={setEditId}></MyDrafts>) }
            {user && tab==="create" &&(<MakePost></MakePost>)}
            {user && tab==="edit" &&(<EditPost id={editId} setTab={setTab}></EditPost>)}
        </div>
      
    </div>
  )
}
