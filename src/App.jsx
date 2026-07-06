import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from './assets/vite.svg'
import heroImg from './assets/hero.png'
import './App.css'
import { Link, Route, BrowserRouter as Router, Routes } from 'react-router-dom'
import Login from "./components/Auth/Login"
import Register from "./components/Auth/Register"
import Logout from"./components/Auth/Logout"
import MakePost from './components/Posts/MakePost'
import EditPost from './components/Posts/EditPost'
import PostInfo from './components/Posts/PostInfo'
import PostList from './components/Posts/PostList'
import EditPassword from './components/Profile/EditPassword'
import EditProfile from './components/Profile/EditProfile'
import Profile from './components/Profile/Profile'
import Dashboard from './Pages/Dashboard'
import Home from './Pages/Home'
import AuthProvider from './context/Authcontext'

const publicroutes=[
    {path:"/",element:<Home></Home>},{path:"/login",element:<Login></Login>},
    {path:"/register",element:<Register></Register>},
    {path:"/posts",element:<PostList></PostList>},
    {path:"/posts/:id",element:<PostInfo></PostInfo>}
]
const privateroutes=[
    {path:"/logout",element:<Logout></Logout>},
    {path:"/posts/new",element:<MakePost></MakePost>},{path:"/posts/edit/:id",element:<EditPost></EditPost>},
    {path:"/profile",element:<Profile></Profile>},{path:"/profile/edit",element:<EditProfile></EditProfile>},
    {path:"/profile/changepass",element:<EditPassword></EditPassword>},{path:"/dashboard",element:<Dashboard></Dashboard>}
]
const adminroute=[
    {path:"/admin/dashboard",element:<Dashboard></Dashboard>}
]
function App() {
  return(
    <AuthProvider>
        <Router>
            <div>
                <nav className='navbar'>
                    <div className='navpost'>
                        <Link to="/">PostManager</Link>
                    </div>
                    <div className='navpostlink'>
                        <Link to="/posts">Posts</Link>
                        <Link to="/posts/new">Create Post</Link>
                        <Link to="/profile">Profile</Link>
                        <Link to="/logout">Logout</Link>
                    </div>
                </nav>
            </div>
            <Routes>
                {publicroutes.map(({path,element})=>(
                    <Route key={path} path={path} element={element}></Route>
                ))}
                {privateroutes.map(({path,element})=>(
                    <Route key={path} path={path} element={element}></Route>
                ))}
                {adminroute.map(({path,element})=>(
                    <Route key={path} path={path} element={element}></Route>
                ))}
            </Routes>
        </Router>
    </AuthProvider>
  )
}

export default App
