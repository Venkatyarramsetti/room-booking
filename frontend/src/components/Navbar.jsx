import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const Navbar = () => {
  const { user, logout, isAuthenticated, isAdmin } = useAuth();
  const location = useLocation();

  const isActiveLink = (path) => {
    return location.pathname === path;
  };

  const handleLogout = () => {
    logout();
  };

  return (
    <nav className="navbar">
      <div className="container">
        <div className="navbar-content">
          <div className="navbar-brand">
            <Link to="/">
              <h1>🏢 Room Booking</h1>
            </Link>
          </div>
          
          <div className="navbar-links">
            <Link 
              to="/" 
              className={`nav-link ${isActiveLink('/') ? 'active' : ''}`}
            >
              Home
            </Link>
            
            {!isAuthenticated() ? (
              <>
                <Link 
                  to="/login" 
                  className={`nav-link ${isActiveLink('/login') ? 'active' : ''}`}
                >
                  Login
                </Link>
                <Link 
                  to="/register" 
                  className={`nav-link ${isActiveLink('/register') ? 'active' : ''}`}
                >
                  Register
                </Link>
              </>
            ) : (
              <>
                <Link 
                  to="/dashboard" 
                  className={`nav-link ${isActiveLink('/dashboard') ? 'active' : ''}`}
                >
                  Dashboard
                </Link>
                
                {isAdmin() && (
                  <Link 
                    to="/admin" 
                    className={`nav-link ${isActiveLink('/admin') ? 'active' : ''}`}
                  >
                    Admin Panel
                  </Link>
                )}
                
                <div className="user-info">
                  <span className="nav-link">
                    Welcome, {user.fullName}
                    {isAdmin() && <span> (Admin)</span>}
                  </span>
                  <button 
                    onClick={handleLogout} 
                    className="logout-btn"
                  >
                    Logout
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;