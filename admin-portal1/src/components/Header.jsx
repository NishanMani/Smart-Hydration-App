 import { useNavigate } from "react-router-dom";
import ThemeToggle from "./ThemeToggle";
import ProfileDropdown from "./Dropdown";
import logo from "../assets/logo.png";
import "../styles/common.css";

const Header = () => {
  const navigate = useNavigate();

  return (
    <header className="header">
      <div className="header-logo" onClick={() => navigate("/")}> 
        <img src={logo} alt="Logo" />
      </div>
      <div className="header-right">
        <ThemeToggle />
        <ProfileDropdown />
      </div>
    </header>
  );
};

export default Header;