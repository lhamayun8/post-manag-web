import React, { useState, useEffect, useRef, useCallback } from "react";
import api from "../../services/api";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/Authcontext";

export default function PostList() {
  const{user}=useAuth()
  const[posts,setPost]=useState([])
  const[search,setSearch]=useState("")
  const[err,setError]=useState("")
  const[loading,setLoading]=useState(false)
  const[hasMore,setHasMore]=useState(true)
  const [page, setPage] = useState(0);
  const[total,setTotal]=useState(0)
  const limit=5
  const[newcomment,setnewComment]=useState({})
  const[showcomment,setshowcoomment]=useState({})
  const[showlikeusers,setshowlikeusers]=useState({})
  const[expandposts,setexpandedposts]=useState({})
  const[commentsState,setCommentsState]=useState({})
  const[commentLoading,setCommentLoading]=useState({})
  const navigate=useNavigate()
  const closeerror=()=>{
    setError("")
  }
  useEffect(() => {
    fetchPost(true);
  }, [search]);

  const seedComments=(postList)=>{
    setCommentsState(prev=>{
      const next={...prev}
      postList.forEach(p=>{
        if(!next[p.id]){
          next[p.id]={items:p.comments||[],total:p.comments_total??(p.comments?.length||0)}
        }
      })
      return next
    })
  }
  const fetchPost=async (reset=true) => {
    if(loading)
      return
    setLoading(true)
    try {
      const skip=reset?0:page*limit;
      const set=await api.get("/posts", { params: { status:"published",search,limit:limit,skip:skip } });
      const newpost= set.data.posts || []
      const total=set.data.total || 0
      if(reset){
        setPost(newpost)
        setPage(1)
      }else{
        setPost(prev=>[...prev,...newpost])
        setPage(prev=>prev+1)
      }
      seedComments(newpost)
      setHasMore(skip+limit<total)
      setTotal(total)
    } catch (err) {
      setError(err.response?.data?.detail || "No published posts avaiable.");
    }finally{
      setLoading(false)
    }
  };
  const loadMore=()=>{
    if(!loading &&hasMore){
      fetchPost(false)
    }
  }
  const refreshpost=async(postid)=>{
    try{
      const set=await api.get(`/posts/${postid}`)
      setPost(prev=>prev.map(p=>p.id===postid?{...p,likes:set.data.likes}:p))
    }catch(err){
            setError(err.response?.data?.detail || "Failed to refresh posts");
    }
  }

  const likepost=async(postid)=>{
    try{
      await api.post(`/posts/${postid}/like`)
      refreshpost(postid)
    }catch(err){
      if(err.response?.status===401){
        navigate("/login")
        return;
      }
      setError(err.response?.data?.detail || "Can not like post.");
    }
  }
  const unlikepost=async(postid)=>{
    try{
      await api.delete(`/posts/${postid}/like`)
      refreshpost(postid)
    }catch(err){
      if(err.response?.status===401){
        navigate("/login")
        return;
      }
      setError(err.response?.data?.detail || "Can not unlike post.");
    }
  }
  const addcomment=async(postid)=>{
    if(!newcomment[postid])
      return;
    try{
      const set=await api.post(`/posts/${postid}/comments`,{content:newcomment[postid]})
      const newc={
        id:set.data.id,
        content:set.data.content,
        user_id:set.data.user_id,
        username:user?.name||"You",
        created_at:new Date().toISOString(),
      }
      setCommentsState(prev=>{
        const cur=prev[postid]||{items:[],total:0}
        return {...prev,[postid]:{items:[newc,...cur.items],total:cur.total+1}}
      })
      setnewComment(prev=>({...prev,[postid]:""}))
    }catch(err){
      if(err.response?.status===401){
        navigate("/login")
        return;
      }
      setError(err.response?.data?.detail || "Can not add comment.");
    }
  }
  const deletecomment=async(postid,commentid)=>{
    try{
      await api.delete(`/posts/${postid}/comments/${commentid}`)
      setCommentsState(prev=>{
        const cur=prev[postid]
        if(!cur)
          return prev
        return {...prev,[postid]:{items:cur.items.filter(c=>c.id!==commentid),total:Math.max(0,cur.total-1)}}
      })
    }catch(err){
      if(err.response?.status===401){
        navigate("/login")
        return;
      }
      setError(err.response?.data?.detail || "Can not delete comment.");
    }
  }
  const loadmorecomments=async(postid)=>{
    const cur=commentsState[postid]||{items:[],total:0}
    setCommentLoading(prev=>({...prev,[postid]:true}))
    try{
      const set=await api.get(`/posts/${postid}/comments`,{params:{skip:cur.items.length,limit:5}})
      setCommentsState(prev=>{
        const existingIds=new Set(cur.items.map(c=>c.id))
        const newones=set.data.comments.filter(c=>!existingIds.has(c.id))
        return {...prev,[postid]:{items:[...cur.items,...newones],total:set.data.total}}
      })
    }catch(err){
      setError(err.response?.data?.detail || "Can not load more comments.");
    }finally{
      setCommentLoading(prev=>({...prev,[postid]:false}))
    }
  }
  const togglecomments=(postid)=>{
    setshowcoomment(prev=>({...prev,[postid]:!prev[postid]}))
  }
  const toggledescription=(postid)=>{
    setexpandedposts((prev)=>({...prev,[postid]:!prev[postid]}))
  }
 const formatDate = (date) => {
  if (!date) return "Unknown date";

  const normalizedDate =
    typeof date === "string" && !date.endsWith("Z") && !date.includes("+")
      ? date + "Z"
      : date;

  const parsedDate = new Date(normalizedDate);

  if (isNaN(parsedDate.getTime())) {
    return "Invalid Date";
  }

  return parsedDate.toLocaleString("en-PK", {
    timeZone: "Asia/Karachi",
    dateStyle: "medium",
    timeStyle: "short",
  });
};
  const togglelikes=(postid)=>{
    if(!user){
      navigate("/login")
      return;
    }
    setshowlikeusers(prev=>({...prev,[postid]:!prev[postid]}))
  }
  return (
    <div className="posts-container">
      <h2>Published Posts</h2>
      <div className="search-container">
        <input
          type="text"
          placeholder="Search Posts"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        ></input>
        <button onClick={fetchPost} className="btn btn-primary">
          Search
        </button>
      </div>
      <div className="profile-posts">
        {posts.length===0?<p>No Published Posts</p>
        :
        posts.map((post) => {
          const comments=commentsState[post.id]||{items:post.comments||[],total:post.comments_total??(post.comments?.length||0)}
          return(
          <div key={post.id} className="post-card">
            <h2>Title:  {post.title}</h2>
            {post.image && (
          <div className="image-container">
            {" "}
            <img src={`data:image/jpeg;base64,${post.image}`} alt="post"></img>
          </div>
        )}
                <p>Posted by <b>{post.username}</b></p>
                {post.tagged_users?.length>0 &&(<p><b>Tagged:</b>{""}
                {post.tagged_users.map(tag=>tag.name).join(",")}</p>)}
                <p><strong>Published:</strong>{formatDate(post.published_at||post.created_at)}</p>
                {post.category &&(<p><strong>Category:</strong>{post.category}</p>)}
                {post.description &&(<p><strong>Description:</strong>{""}{expandposts[post.id]||post.description.length<=150?post.description:`${post.description.slice(0,150)}...`}{post.description.length>150 &&(
                  <>
                  {" "}
                  <button type="button" className="see-more-btn" onClick={()=>toggledescription(post.id)}>{expandposts[post.id]?"see less":"see more"}</button></>
                )}</p>
              )}
                <div className="likes-section">
                  <p className="likes-count" onClick={()=>togglelikes(post.id)}> ♥ {post.likes?.count||0} Likes</p>
                  {showlikeusers[post.id]&&(
                    <div className="likes-popup">{
                      !post.likes?.users ||post.likes.users.length===0?<p>No likes yet</p>
                        :
                        post.likes.users.map(person=>(
                          <div className="likes-user" key={person.id}>
                            <div className="avatar-small">{
                              person.username.charAt(0).toUpperCase()}
                              </div>
                              <span>{person.username}</span>
                              </div>
                        ))
                    }
                    </div>
                  )}
                  </div>
                <div className="post-actions">
                <button className="btn btn-primary" onClick={()=>likepost(post.id)}>Like</button>
                <button className="btn btn-danger" onClick={()=>unlikepost(post.id)}>Unlike</button>
                <button className="btn btn-secondary"onClick={()=>togglecomments(post.id)}>Comments</button>
                </div>
                {showcomment[post.id] &&(
                  <div className="comments-box">
                    <h3>Comments</h3>
                {comments.items.length===0?
                <p>No comments yet</p>:
                comments.items.map(comment=>(
                <div className="comment-card" key={comment.id}>
                  <div className="comment-avatar">
                  {comment.username.charAt(0).toUpperCase()}
                  </div>
                <div className="comment-body">
                  <div className="comment-header">
                  <strong>{comment.username}</strong>
                  <span>{formatDate(comment.created_at)}</span>
                  </div>
                  <p>{comment.content}</p>
                  {user && (user.id===comment.user_id ||user.role==="admin") && (<button className="comment-delete" onClick={()=>deletecomment(post.id,comment.id)}>Delete Comment</button>)}
                </div>
                </div>
                ))}
                {comments.items.length<comments.total && (
                  <div>
                    <button
                      type="button"
                      className="see-more-btn"
                      onClick={()=>loadmorecomments(post.id)}
                      disabled={!!commentLoading[post.id]}
                    >
                      {commentLoading[post.id]?"Loading...":`See more comments (${comments.total-comments.items.length})`}
                    </button>
                  </div>
                )}
                <div className="write-comment"><textarea placeholder="Comment..." value={newcomment[post.id]||""} onChange={(e)=>setnewComment(prev=>({...prev,[post.id]:e.target.value}))}></textarea>
                <button className="btn btn-primary" onClick={()=>addcomment(post.id)}>Post Comment</button>
                </div>
            </div>
            )} 
    </div> 
  )})}
  {loading &&<p style={{textAlign:"center"}}>Loading</p>}
  {hasMore && !loading && (
    <div style={{ textAlign: "center", margin: "2rem 0" }}>
      <button className="btn btn-primary" onClick={loadMore} style={{ padding: "10px 30px", fontSize: "16px" }}>
                See More Posts</button>
            </div>
          )}

          {!hasMore && posts.length > 0 && (
            <p style={{ textAlign: "center", color: "#666" }}>
              No more posts to load
            </p>
          )}
        {err && (
        <div className="error-box">
        <span>{err}</span>
        <button onClick={closeerror}>X</button>
        </div>
        )}  
  </div>
  </div>
  )
}
