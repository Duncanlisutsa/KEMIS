import { useContext } from "react";
import { Navigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";

function RoleProtectedRoute({ children, allowedRoles }) {
  const { user, loading } = useContext(AuthContext);

  if (loading) {
    return <h2>Loading...</h2>;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (!allowedRoles.includes(user.role)) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}

export default RoleProtectedRoute;