import React, { createContext, useContext, useState, useEffect } from "react";
import api from "../services/api";
import socket from "../socket";
const Authcontext = createContext();
export default function AuthProvider({ children }) {
  const[user,setUser]=useState(JSON.parse(localStorage.getItem("user")||"null"));
  const[loading,setLoading]=useState(true);
  useEffect(() => {
    const token=localStorage.getItem("token");
    if (!token) {
      setLoading(false);
      return;
    }
    const fetchuser=async()=>{
      try {
        const set=await api.get("/users/me");
        setUser(set.data);
      } catch(error) {
        localStorage.removeItem("token");
        localStorage.removeItem("role");
        setUser(null);
      } finally {
        setLoading(false);
      }
    };
    fetchuser();
  },[]);
  useEffect(()=>{
    if(!user) 
      return;
    socket.connect()
    const registeruser=()=>{
      socket.emit("register",user.id)
    }
    socket.on("connect",registeruser)
    socket.on("notification",(data)=>{if(data.type==="friend_request"){alert(data.message)}
    if(data.type==="message_request"){alert("New message request from"+data.sender)}
  })
  return()=>{socket.off("connect",registeruser);socket.off("notification");socket.disconnect()}},[user])
  const login=(token,data)=>{
    localStorage.setItem("token",token);
    localStorage.setItem("user",JSON.stringify(data))
    localStorage.setItem("role",data?.role||"user");
    setUser(data);
  };
  const logout=()=>{
    socket.disconnect()
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    localStorage.removeItem("user")
    setUser(null);
  };
  return (
    <Authcontext.Provider value={{user,setUser,login,logout,loading}}>
      {children}
    </Authcontext.Provider>
  );
}

export const useAuth=()=>useContext(Authcontext);