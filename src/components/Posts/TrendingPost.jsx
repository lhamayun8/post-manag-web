import React, { useState, useEffect, useRef, useCallback } from "react";
import api from "../../services/api";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/Authcontext";

export default function PostList() {
  const{user}=useAuth()
  const[posts,setPosts]=useState([])
  const[search,setSearch]=useState("")
  const[err,setError]=useState("")
  const[loading,setLoading]=useState(false)
  const[hasMore,setHasMore]=useState(true)
  const[page,setPage]=useState(0)
  const[total,setTotal]=useState(0)
  const limit=5
  const[newcomment,setNewComment]=useState({})
  const[showcomment,setShowComment]=useState({})
  const[showlikeusers,setShowLikeUsers]=useState({})
  const[expandposts,setExpandedPosts]=useState({})
  const[commentsState,setCommentsState]=useState({})
  const[commentLoading,setCommentLoading]=useState({})
  const navigate=useNavigate()
  const closeerror=()=>{
    setError("")
  };

  const seedComments=(postList) => {
    setCommentsState(prev => {
      const next={ ...prev }
      postList.forEach(p => {
        if (!next[p.id]) {
          next[p.id] = { items: p.comments || [], total: p.comments_total ?? (p.comments?.length || 0) }
        }
      })
      return next
    })
  }
  useEffect(()=>{
    const timer=setTimeout(()=>{
      fetchPost(true)
    }, 500)
    return ()=>clearTimeout(timer);
  }, [search])
  const fetchPost=async (reset = true,forcerefresh=false) => {
    if (loading) 
      return;
    setLoading(true)
    try {
      const skip=reset?0:page*limit;
      const set=await api.get("/feed/trending", { params: { 
          search: search || undefined,
          limit: limit,
          skip: skip,
          days: 30,
          refresh:forcerefresh
        } 
      });
      const newPosts=set.data.posts || []
      const totalCount=set.data.total || 0
      const hasMoreData=set.data.has_more || false
      if (reset) {
        setPosts(newPosts)
        setPage(1)
      } else {
        setPosts(prev => [...prev, ...newPosts])
        setPage(prev => prev + 1)
      }
      seedComments(newPosts)
      
      setTotal(totalCount)
      setHasMore(hasMoreData)
    } catch (err) {
      setError(err.response?.data?.detail || "No trending posts available.")
    } finally {
      setLoading(false)
    }
  }
  const loadMore=()=>{
    if (!loading && hasMore) {
      fetchPost(false)
    }
  };
  const refreshpost=async(postid)=>{
    try {
      const set=await api.get(`/posts/${postid}`)
      setPosts(prev => prev.map(p => p.id === postid ? { ...p, likes: response.data.likes } : p))
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to refresh post")
    }
  };

  const likepost=async (postid) => {
    try {
      await api.post(`/posts/${postid}/like`)
      refreshpost(postid)
    } catch(err){
      if(err.response?.status === 401) {
        navigate("/login")
        return;
      }
      setError(err.response?.data?.detail || "Cannot like post.")
    }
  };

  const unlikepost=async(postid)=>{
    try {
      await api.delete(`/posts/${postid}/like`)
      refreshpost(postid)
    } catch (err) {
      if (err.response?.status === 401) {
        navigate("/login")
        return
      }
      setError(err.response?.data?.detail || "Cannot unlike post");
    }
  };

  const addcomment=async(postid)=>{
    if (!newcomment[postid]) 
      return;
    try {
      const set = await api.post(`/posts/${postid}/comments`, { content: newcomment[postid] })
      const newc = {
        id: set.data.id,
        content: set.data.content,
        user_id: set.data.user_id,
        username: user?.name || "You",
        created_at: new Date().toISOString(),
      }
      setCommentsState(prev => {
        const cur = prev[postid] || { items: [], total: 0 }
        return { ...prev, [postid]: { items: [newc, ...cur.items], total: cur.total + 1 } }
      })
      setNewComment(prev => ({ ...prev, [postid]: "" }))
    } catch (err) {
      if (err.response?.status === 401) {
        navigate("/login")
        return;
      }
      setError(err.response?.data?.detail || "Cannot add comment")
    }
  };

  const deletecomment = async (postid, commentid) => {
    try {
      await api.delete(`/posts/${postid}/comments/${commentid}`)
      setCommentsState(prev => {
        const cur = prev[postid]
        if (!cur) return prev
        return { ...prev, [postid]: { items: cur.items.filter(c => c.id !== commentid), total: Math.max(0, cur.total - 1) } }
      })
    } catch (err) {
      if (err.response?.status === 401) {
        navigate("/login")
        return
      }
      setError(err.response?.data?.detail || "Cannot delete comment")
    }
  };

  const loadmorecomments = async (postid) => {
    const cur = commentsState[postid] || { items: [], total: 0 }
    setCommentLoading(prev => ({ ...prev, [postid]: true }))
    try {
      const set = await api.get(`/posts/${postid}/comments`, { params: { skip: cur.items.length, limit: 5 } })
      setCommentsState(prev => {
        const existingIds = new Set(cur.items.map(c => c.id))
        const newones = set.data.comments.filter(c => !existingIds.has(c.id))
        return { ...prev, [postid]: { items: [...cur.items, ...newones], total: set.data.total } }
      })
    } catch (err) {
      setError(err.response?.data?.detail || "Cannot load more comments.")
    } finally {
      setCommentLoading(prev => ({ ...prev, [postid]: false }))
    }
  };

  const togglecomments = (postid) => {
    setShowComment(prev => ({ ...prev, [postid]: !prev[postid] }))
  }

  const toggledescription = (postid) => {
    setExpandedPosts(prev => ({ ...prev, [postid]: !prev[postid] }))
  };

  const formatDate = (date) => {
    return new Date(date + "Z").toLocaleString("en-PK", {
      timeZone: "Asia/Karachi",
      dateStyle: "medium",
      timeStyle: "short",
    });
  };
  const handleRefresh=()=>{
  setPosts([])
  setPage(0)
  setHasMore(true)
  fetchPost(true,true)
  }

  const togglelikes = (postid) => {
    if (!user) {
      navigate("/login")
      return;
    }
    setShowLikeUsers(prev => ({ ...prev, [postid]: !prev[postid] }))
  }

  return (
    <div className="posts-container">
      <h2>Trending Posts</h2>
      {loading && posts.length === 0 ? (
        <p style={{ textAlign: "center" }}>Loading trending posts...</p>
      ) : posts.length === 0 ? (
        <p>No Trending Posts</p>
      ) : (
        posts.map((post) => {
          const comments = commentsState[post.id] || { items: post.comments || [], total: post.comments_total ?? (post.comments?.length || 0) }
          return (
          <div key={post.id} className="post-card">
            <h2>Title: {post.title}</h2>
            
            {post.image && (
              <div className="image-container">
                <img src={`data:image/jpeg;base64,${post.image}`} alt="post" />
              </div>
            )}
            
            <p>
              Posted by <b>{post.username}</b>
            </p>
            
            {post.tagged_users?.length > 0 && (
              <p>
                <b>Tagged:</b>{" "}
                {post.tagged_users.map(tag => tag.name).join(", ")}
              </p>
            )}
            
            <p>
              <strong>Published:</strong>{" "}
              {formatDate(post.published_at || post.created_at)}
            </p>
            
            {post.category && (
              <p>
                <strong>Category:</strong> {post.category}
              </p>
            )}
            
            <div>
              👍 {post.likes_count ?? post.likes?.count ?? 0} {" | "} 💬{" "}
              {post.comments_count ?? post.comments?.length ?? 0}
            </div>
            
            {post.score !== undefined && (
              <p>
                <strong>Trending Score:</strong> {post.score}
              </p>
            )}
            
            {post.description && (
              <p>
                <strong>Description:</strong>{" "}
                {expandposts[post.id] || post.description.length <= 150
                  ? post.description
                  : `${post.description.slice(0, 150)}...`}
                {post.description.length > 150 && (
                  <>
                    {" "}
                    <button
                      type="button"
                      className="see-more-btn"
                      onClick={() => toggledescription(post.id)}
                    >
                      {expandposts[post.id] ? "see less" : "see more"}
                    </button>
                  </>
                )}
              </p>
            )}
            
            <div className="likes-section">
              <p className="likes-count" onClick={() => togglelikes(post.id)}>
                ♥ {post.likes?.count || 0} Likes
              </p>
              {showlikeusers[post.id] && (
                <div className="likes-popup">
                  {!post.likes?.users || post.likes.users.length === 0 ? (
                    <p>No likes yet</p>
                  ) : (
                    post.likes.users.map(person => (
                      <div className="likes-user" key={person.id}>
                        <div className="avatar-small">
                          {person.username?.charAt(0).toUpperCase() || "?"}
                        </div>
                        <span>{person.username}</span>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
            
            <div className="post-actions">
              <button className="btn btn-primary" onClick={() => likepost(post.id)}>
                Like
              </button>
              <button className="btn btn-danger" onClick={() => unlikepost(post.id)}>
                Unlike
              </button>
              <button
                className="btn btn-secondary"
                onClick={() => togglecomments(post.id)}
              >
                Comments
              </button>
            </div>
            
            {showcomment[post.id] && (
              <div className="comments-box">
                <h3>Comments</h3>
                {comments.items.length === 0 ? (
                  <p>No comments yet</p>
                ) : (
                  comments.items.map(comment => (
                    <div className="comment-card" key={comment.id}>
                      <div className="comment-avatar">
                        {comment.username?.charAt(0).toUpperCase() || "?"}
                      </div>
                      <div className="comment-body">
                        <div className="comment-header">
                          <strong>{comment.username}</strong>
                          <span>{formatDate(comment.created_at)}</span>
                        </div>
                        <p>{comment.content}</p>
                        {user && (user.id === comment.user_id || user.role === "admin") && (
                          <button
                            className="comment-delete"
                            onClick={() => deletecomment(post.id, comment.id)}
                          >
                            Delete Comment
                          </button>
                        )}
                      </div>
                    </div>
                  ))
                )}
                {comments.items.length < comments.total && (
                  <div className="see-more-container">
                    <button
                      type="button"
                      className="see-more-btn"
                      onClick={() => loadmorecomments(post.id)}
                      disabled={!!commentLoading[post.id]}
                    >
                      {commentLoading[post.id] ? "Loading..." : `See more comments (${comments.total - comments.items.length})`}
                    </button>
                  </div>
                )}
                <div className="write-comment">
                  <textarea
                    placeholder="Comment..."
                    value={newcomment[post.id] || ""}
                    onChange={(e) =>
                      setNewComment(prev => ({ ...prev, [post.id]: e.target.value }))
                    }
                  />
                  <button
                    className="btn btn-primary"
                    onClick={() => addcomment(post.id)}
                  >
                    Post Comment
                  </button>
                </div>
              </div>
            )}
          </div>
        )})
      )}

      {loading && posts.length > 0 && (
        <p style={{ textAlign: "center" }}>Loading more...</p>
      )}

      {hasMore && !loading && posts.length > 0 && (
        <div style={{ textAlign: "center", margin: "2rem 0" }}>
          <button
            className="btn btn-primary"
            onClick={loadMore}
            style={{ padding: "10px 30px", fontSize: "16px" }}
          >
            See More Posts ({posts.length} of {total})
          </button>
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
  );
}
