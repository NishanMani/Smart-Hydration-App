import { Routes, Route, Navigate } from "react-router-dom";
import Login from "../pages/Login";
import Dashboard from "../pages/Dashboard";
import Users from "../pages/Users";
import Reports from "../pages/Reports";
import Profile from "../pages/Profile";
import { useContext } from "react";
import { AuthContext } from "../context/AuthContext";

const AppRoutes = () => {
  const { state } = useContext(AuthContext);

  return (
    <Routes>
      <Route
        path="/login"
        element={!state.isAuthenticated ? <Login /> : <Navigate to="/" />}
      />
      <Route
        path="/"
        element={state.isAuthenticated ? <Dashboard /> : <Navigate to="/login" />}
      />
      <Route
        path="/users"
        element={state.isAuthenticated ? <Users /> : <Navigate to="/login" />}
      />
      <Route
        path="/reports"
        element={state.isAuthenticated ? <Reports /> : <Navigate to="/login" />}
      />
      <Route
        path="/profile"
        element={state.isAuthenticated ? <Profile /> : <Navigate to="/login" />}
      />
      <Route path="*" element={<Navigate to="/login" />} />
    </Routes>
    
  );
};

export default AppRoutes;