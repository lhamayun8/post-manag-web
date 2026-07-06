import React, { useEffect, useState } from 'react'
import { useNavigate,useParams } from 'react-router-dom'
import api from '../../services/api'

export default function EditPost() {
    const {id}=useParams()
    const navigate=useNavigate()
    const[err,setError]=useState("")
    const handleSubmit= async (e)=>{
      e.preventDefault();
        const token=localStorage.getItem("token")
        if(!token){
          setError("login first")
            return;
        }
        try{
            await api.post(`/posts/${id}`,data)
            navigate(`/posts/${id}`)
        }catch(err){
          setError("can not update post.try again later")
            console.error(err)
        }
    }
    const handleimagechange=(e)=>{
        const file=e.target.files[0]
        if(file){
            if(file.size>500*1024){
              setError("image size exceed. it must be less than 500Kb")
                return;
            }
            const read=new FileReader()
            read.onloadend=()=>{
                setData({...data,image:read.result})
            }
            read.readAsDataURL(file)
        }
    }
    const handleChange=(e)=>{
      if(e.target.name=="image"){
            setData({...data,image:e.target.files[0]})
        }else{
            setData({...data,[e.target.name]:e.target.value})
        }
    }
    const [data,setData]=useState({title:"",description:"",category:"",status:"draft",image:""})
    useEffect(()=>{
      const fetchpost=async()=>{
        try{
        const set=await api.get(`/posts/${id}`)
        setData({title:set.data.title,description:set.data.description,category:set.data.category,
          status:set.data.status,image:set.data.image||""
        })
      }catch(error){
        setError("failed to load post")
      }
      }
      fetchpost()
    },[id])
  return (
    <div className='auth-container'>
        <h2>Edit Post</h2>
        <form onSubmit={handleSubmit}>
          <div className='form-group'>
            <input name="title" value={data.title} onChange={handleChange}></input>
            <textarea name="description" value={data.description} onChange={handleChange}></textarea>
            <input name="category" value={data.category}onChange={handleChange}></input>
            <select name="status" value={data.status} onChange={handleChange}>
              <option value="draft">Draft</option>
              <option value="published">Published</option>
            </select>
            {data.image && (
              <div>
                <p>
                  Current image :
                </p>
                <img src={data.image} alt="post"></img>
                </div>
            )}
            <input type="file" name="image" acceot="image/*"  onChange={handleimagechange}></input>
          </div>
            <button type="submit">Update</button>
        </form>
        {err && <p style={{color:"orange"}}>{err}</p>}
    </div>
  )
}
