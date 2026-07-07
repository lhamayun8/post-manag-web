import React, { useContext, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../../services/api'
export default function MakePost() {
    const[data,setData]=useState({title:"",description:"",category:"",status:"draft",image:""})
    const navigate=useNavigate()
    const[error,setError]=useState("")
    const handleChange=(e)=>{
            setData({...data,[e.target.name]:e.target.value})
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
    const handleSubmit=async(e)=>{
        e.preventDefault();
        const token=localStorage.getItem("token")
        if(!token){
            setError("please login first")
            return;
        }
        try{
            await api.post("/posts/",data)
            navigate("/posts")
        }catch(err){
            setError("failed to create new post.try again")
            console.error(err)
        }
    }  
    return (
    <div className='auth-container'>
        <h2>Create new post</h2>
        <form onSubmit={handleSubmit}>
            <div className='form-group'>
                <input name="title"placeholder='title' onChange={handleChange}></input>
                <textarea name="description" placeholder='description' value={data.description}onChange={handleChange}></textarea>
                <input name="category" placeholder='category' value={data.category}onChange={handleChange}></input>
                <input type="file" name="image" accept='image/*' onChange={handleimagechange}></input>
                <select name="status" onChange={handleChange} value={data.status}>
                    <option value="draft">Draft</option>
                    <option value="published">Published</option>
                </select>
            </div>
            <button type="submit">Create Post</button>
        </form>
        {error && <p style={{color:"orange"}}>{error}</p>}
    </div>
  )
}
