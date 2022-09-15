import { Navigate } from "react-router-dom";
import { useContext } from "react";
import AuthContext from "../../providers/AuthProvider";

const PrivateRoute = ({ children }) => {
  let { user } = useContext(AuthContext);
  return !user ? <Navigate to="/login" /> : <>{children}</>;
};

export default PrivateRoute;
