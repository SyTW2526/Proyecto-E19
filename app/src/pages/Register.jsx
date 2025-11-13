import React, { useState } from 'react'
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const Register = ({ setUser }) => {
  const [form, setForm] = useState({
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
  
  return <div>
    <form onSubmit={handleSubmit}>
      <h2>Register</h2>
      <input 
        type="text" 
        placeholder="name" 
        className="border p-2 w-full mb-3"
        value={form.name}
        onChange={(e) => setForm({...form, name: e.target.value})}
        /><br />
        <input 
        type="email" 
        placeholder="email" 
        className="border p-2 w-full mb-3"
        value={form.email}
        onChange={(e) => setForm({...form, email: e.target.value})}
        /><br />
    
      <input
        type="password"
        placeholder="password"
        className="border p-2 w-full mb-3"
        value={form.password}
        onChange={(e) => setForm({...form, password: e.target.value})}
        /><br />
      <button type="submit" className="bg-blue-500 text-white p-2 w-full">Register</button>
        
    </form>
  </div>
}


export default Register;