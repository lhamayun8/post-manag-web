import React, { createContext, useContext, useState, useEffect } from "react";
import api from "../services/api";
const Authcontext = createContext();

export default function AuthProvider({ children }) {
  const [user, setUser] = useState(null)

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      const fetchuser = async () => {
        try {
          const set = await api.get("/users/me");
          setUser(set.data);
        } catch (error) {
          localStorage.removeItem("token");
          localStorage.removeItem("role");
          setUser(null);
        }
      };
      fetchuser();
    }
  }, []);

  useEffect(()=>{
    if(!user)
      return;
    const socket=new WebSocket(`ws://localhost:8000/ws/${user.id}`)
    socket.onopen=()=>{
      console.log("Websocket connection established!")
    }
    socket.onmessage=(e)=>{
      const data=JSON.parse(e.data)
      if(data.type==="friend_request"){
        alert(data.message)
      }
    }
    socket.onerror=(error)=>{
      console.log("websocket error",error)
    }
    socket.onclose=()=>{
      console.log("connection disconnected")
    }
    return()=>{
      socket.close()
    }
  },[user])

  const login = (token, data) => {
    localStorage.setItem("token", token);
    localStorage.setItem("role", data?.role || "user");
    setUser(data);
  };
  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    setUser(null);
  };
  return (
    <Authcontext.Provider value={{ user, setUser, login, logout }}>
      {children}
    </Authcontext.Provider>
  );
}

export const useAuth = () => useContext(Authcontext);
