import "./App.css";
import { Link, Route, BrowserRouter as Router, Routes } from "react-router-dom";
import Login from "./components/Auth/Login";
import Register from "./components/Auth/Register";
import Logout from "./components/Auth/Logout";
import MakePost from "./components/Posts/MakePost";
import EditPost from "./components/Posts/EditPost";
import PostInfo from "./components/Posts/PostInfo";
import PostList from "./components/Posts/PostList";
import EditPassword from "./components/Profile/EditPassword";
import EditProfile from "./components/Profile/EditProfile";
import Profile from "./components/Profile/Profile";
import Dashboard from "./Pages/Dashboard";
import Home from "./Pages/Home";
import AuthProvider, { useAuth } from "./context/Authcontext";
import ProtectedRoute from "./components/ProtectedRoute";
import Verify from "./components/Auth/Verify";
import ForgotPassword from "./components/Auth/ForgotPassword";
import ResetPassword from "./components/Auth/ResetPassword";
import VerifyNewPass from "./components/Auth/VerifyNewPass";

const publicroutes = [
  { path: "/", element: <Home></Home> },
  { path: "/login", element: <Login></Login> },
  { path: "/register", element: <Register></Register> },
  {path:"/verify",element:<Verify></Verify>},
  {path:"/forgot-password",element:<ForgotPassword></ForgotPassword>},
  {path:"/verify-new-pass",element:<VerifyNewPass></VerifyNewPass>},
  {path:"/reset-password",element:<ResetPassword></ResetPassword>},
  { path: "/posts", element: <PostList></PostList> },
  { path: "/posts/:id", element: <PostInfo></PostInfo> },
];
const privateroutes = [
  { path: "/logout", element: <Logout></Logout> },
  { path: "/posts/new", element: <MakePost></MakePost> },
  { path: "/posts/edit/:id", element: <EditPost></EditPost> },
  { path: "/profile", element: <Profile></Profile> },
  { path: "/profile/edit", element: <EditProfile></EditProfile> },
  { path: "/profile/changepass", element: <EditPassword></EditPassword> },
  { path: "/dashboard", element: <Dashboard></Dashboard> },
];
const adminroute = [
  { path: "/admin/dashboard", element: <Dashboard></Dashboard> },
];
function AppContent() {
  const { user } = useAuth();
  return (
    <>
      <nav className="navbar">
        <div className="navpost">
          <Link to="/">PostManager</Link>
        </div>

        <div className="navpostlink">
          <Link to="/posts">Posts</Link>
          {user ? (
            <>
              <Link to="/posts/new">Create Post</Link>
              <Link to="/profile">Profile</Link>
              {user?.role === "admin" && (
                <Link to="/admin/dashboard">Admin Dashboard</Link>
              )}
              <Link to="/logout">Logout</Link>
            </>
          ) : (
            <>
              <Link to="/login">Login</Link>
              <Link to="/register">Register</Link>
            </>
          )}
        </div>
      </nav>
      <Routes>
        {publicroutes.map(({ path, element }) => (
          <Route key={path} path={path} element={element}></Route>
        ))}
        {privateroutes.map(({ path, element }) => (
          <Route
            key={path}
            path={path}
            element={<ProtectedRoute>{element}</ProtectedRoute>}
          />
        ))}
        {adminroute.map(({ path, element }) => (
          <Route
            key={path}
            path={path}
            element={<ProtectedRoute adminOnly>{element}</ProtectedRoute>}
          ></Route>
        ))}
      </Routes>
    </>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <AppContent />
      </Router>
    </AuthProvider>
  );
}
