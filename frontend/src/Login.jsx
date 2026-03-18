import React, { useState } from 'react';
import axios from 'axios';

const API_URL = 'http://localhost:3000'; // Connecting magically via the API Gateway!

export default function Login({ setToken, setUser }) {
  const [isRegistering, setIsRegistering] = useState(false);
  const [formData, setFormData] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      if (isRegistering) {
        // Hitting the gateway, which routes to User Service (port 3001)
        await axios.post(`${API_URL}/users/register`, formData);
        setIsRegistering(false);
        setError('Awesome! Account created successfully. Please log in.');
      } else {
        const res = await axios.post(`${API_URL}/users/login`, {
          email: formData.email,
          password: formData.password
        });
        setToken(res.data.token);
        setUser(res.data.user);
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Connections failed.');
    }
  };

  return (
    <div className="auth-container">
      <div className="glass-panel auth-box">
        <h2 style={{marginBottom: '1.5rem', textAlign: 'center'}}>
          {isRegistering ? 'Create Account' : 'Welcome Back'}
        </h2>
        {error && <p style={{color: '#f87171', marginBottom: '1rem', textAlign:'center'}}>{error}</p>}
        
        <form onSubmit={handleSubmit}>
          {isRegistering && (
            <input 
              type="text" 
              className="input-field" 
              placeholder="Full Name" 
              required
              value={formData.name}
              onChange={e => setFormData({...formData, name: e.target.value})}
            />
          )}
          <input 
            type="email" 
            className="input-field" 
            placeholder="Email Address" 
            required
            value={formData.email}
            onChange={e => setFormData({...formData, email: e.target.value})}
          />
          <input 
            type="password" 
            className="input-field" 
            placeholder="Password" 
            required
            value={formData.password}
            onChange={e => setFormData({...formData, password: e.target.value})}
          />
          <button type="submit" className="btn">
            {isRegistering ? 'Sign Up to Application' : 'Secure Log In'}
          </button>
        </form>

        <p style={{marginTop: '1.5rem', textAlign: 'center', color: 'var(--text-muted)'}}>
          {isRegistering ? 'Already have an account? ' : "Don't have an account? "}
          <span 
            style={{color: 'var(--primary)', cursor: 'pointer', fontWeight: 'bold'}}
            onClick={() => { setIsRegistering(!isRegistering); setError(''); }}
          >
            {isRegistering ? 'Log In here' : 'Sign Up completely free'}
          </span>
        </p>
      </div>
    </div>
  );
}
