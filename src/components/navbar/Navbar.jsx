import React from 'react';
import "./navbar.css";
import { Link } from "react-router-dom";
const Navbar = () => {
  return (
    <div className="navbar-container">
    <div className="navbar">
      <div className="logo">
        Note Maker
      </div>
      <div className="nav-links">
        <Link to="/dashboard" style={{textDecoration:"none"}} className="link">Home</Link>
        <Link to="/about" style={{textDecoration:"none"}} className="link">About</Link>    
      </div>
    </div>
    </div>
  )
}

export default Navbar;
