import { NavLink } from "react-router-dom";

const Navbar = () => {
  return (
    <nav className="navbar">
      <NavLink to="/" className="nav-link">
        Dashboard
      </NavLink>
      <NavLink to="/users" className="nav-link">
        Users
      </NavLink>
      <NavLink to="/reports" className="nav-link">
        Reports
      </NavLink>
    </nav>
  );
};

export default Navbar;