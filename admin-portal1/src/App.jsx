import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useContext } from "react";
import { AuthContext } from "./context/AuthContext";

import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Users from "./pages/Users";
import Reports from "./pages/Reports";
import Profile from "./pages/Profile";

import Header from "./components/Header";
import Navbar from "./components/Navbar";

const Layout = () => {
  const { isAuthenticated } = useContext(AuthContext);

  return (
    <>
      {isAuthenticated && <Header />}
      {isAuthenticated && <Navbar />}

      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/" element={isAuthenticated ? <Dashboard /> : <Navigate to="/login" />}/>
        <Route path="/users" element={isAuthenticated ? <Users /> : <Navigate to="/login" />}/>
        <Route path="/reports" element={isAuthenticated ? <Reports /> : <Navigate to="/login" />}/>
        <Route path="/profile" element={isAuthenticated ? <Profile /> : <Navigate to="/login" />}/>
      </Routes>
    </>
  );
};

export default function App() {
  return (
    <BrowserRouter>
      <Layout />
    </BrowserRouter>
  );
}