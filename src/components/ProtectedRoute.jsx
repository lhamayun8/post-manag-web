import  {Navigate} from "react-router-dom"
import { useAuth } from "../context/Authcontext"
export default function ProtectedRoute({children,adminOnly=false}) {
    const{user}=useAuth()
    if(!user){
        return <Navigate to="/login" replace></Navigate>
    }
    if(adminOnly && user.role!=="admin"){
        return<Navigate to="/" replace></Navigate>
    }
    return children
}
