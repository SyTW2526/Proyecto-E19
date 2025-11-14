import React, { useState } from 'react'
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import registerImage from '../images/etsi_informatica.png';

const Register = ({ setUser }) => {
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
  })
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post("http://localhost:4000/api/auth/register", form);
      setUser(res.data);
      navigate("/");
    } catch (err) {
      setError(err.response?.data?.message || "Ha habido un error en el registro");
    }
  }
  
  return (
    <>
      <h1 className="login-title">ULL CALENDAR</h1>
      <div className="login-container">
        <div className="login-left">
          <form className="login-form" onSubmit={handleSubmit}>
            <h2>Register</h2>
            <input
              type="text"
              placeholder="Name"
              className="login-input"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
            <input
              type="email"
              placeholder="Email"
              className="login-input"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />
            <input
              type="password"
              placeholder="Password"
              className="login-input"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
            />
            <button type="submit" className="login-button">Register</button>
            {error && <p className="error">{error}</p>}
          </form>
        </div>
        <div className="login-right">
          <img src={registerImage} alt="Illustration de register" />
        </div>
      </div>
    </>
  )
}

export default Register;