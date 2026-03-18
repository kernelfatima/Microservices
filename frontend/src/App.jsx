import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './Login';
import Products from './Products';

function App() {
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [user, setUser] = useState(JSON.parse(localStorage.getItem('user')));

  useEffect(() => {
    if (token) {
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
    } else {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    }
  }, [token, user]);

  const handleLogout = () => {
    setToken(null);
    setUser(null);
  };

  return (
    <Router>
      <div className="navbar">
        <div className="nav-logo">MicroStore</div>
        <div>
          {token ? (
            <button className="btn" style={{width: 'auto', background: 'transparent', border: '1px solid rgba(255,255,255,0.2)'}} onClick={handleLogout}>
              Logout ({user?.name || 'User'})
            </button>
          ) : null}
        </div>
      </div>

      <div className="app-layout">
        {user?.isAdmin && (
          <div className="admin-sidebar glass-panel" style={{borderRadius: 0, borderTop: 0, borderBottom: 0, borderLeft: 0, minHeight: 'calc(100vh - 80px)'}}>
            <h3 style={{marginBottom: '1.5rem', color: '#10b981'}}>🛡️ Admin Panel</h3>
            <a href="#" className="admin-link">📊 Dashboard Analytics</a>
            <a href="#" className="admin-link">👥 Manage Users</a>
            <a href="#" className="admin-link">⚙️ System Settings</a>
            <div style={{marginTop: '2rem', padding: '1rem', background: 'rgba(16, 185, 129, 0.1)', borderRadius: '8px', border: '1px solid rgba(16, 185, 129, 0.2)'}}>
                <p style={{fontSize: '0.85rem', color: '#10b981'}}><strong>Admin Status Confirmed!</strong><br />Your JWT token granted you absolute access to this secure panel.</p>
            </div>
          </div>
        )}
        
        <div className="main-content">
          <Routes>
            <Route path="/login" element={!token ? <Login setToken={setToken} setUser={setUser} /> : <Navigate to="/" />} />
            <Route path="/" element={token ? <Products token={token} /> : <Navigate to="/login" />} />
          </Routes>
        </div>
      </div>
    </Router>
  );
}

export default App;
