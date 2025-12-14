import React, { useState, useEffect  } from 'react';
import axios from 'axios';
import { useNavigate, useLocation } from 'react-router-dom';
import { useImage } from '../components/ImageContext';

const Login = ({ setUser }) => {
    const navigate = useNavigate();
  const location = useLocation();
  const registered = location.state?.registered;
  useEffect(() => {
  if (registered) {
    setShowRegistered(true); // mostramos el toast
    // limpiamos el state para que no aparezca en un futuro reload
    navigate(location.pathname, { replace: true, state: {} });
    
    // opcional: ocultar toast después de 3 segundos
    const timer = setTimeout(() => setShowRegistered(false), 3000);
    return () => clearTimeout(timer);
  }
}, [registered, navigate, location.pathname]);
  const [showRegistered, setShowRegistered] = useState(false);
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({ email: "", password: "" });

  // Cargar todas las imágenes automáticamente
  const { image } = useImage();

  const validateForm = () => {
    const errors = { email: "", password: "" };
    let isValid = true;

    if (!form.email.trim()) {
      errors.email = "El correo es obligatorio";
      isValid = false;
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      errors.email = "El correo no es válido";
      isValid = false;
    }

    if (!form.password) {
      errors.password = "La contraseña es obligatoria";
      isValid = false;
    } else if (form.password.length < 6) {
      errors.password = "La contraseña debe tener al menos 6 caracteres";
      isValid = false;
    }

    setFieldErrors(errors);
    return isValid;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setFieldErrors({ email: "", password: "" });
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    try {
      const res = await axios.post("http://localhost:4000/api/auth/login", form);
      setUser(res.data.user);
      navigate("/dashboard");
    } catch (err) {
      setError(err.response?.data?.message || "Credenciales incorrectas. Por favor, intenta de nuevo.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex relative">
      {/* Imagen de fondo que cubre toda la pantalla */}
      <div className="absolute inset-0 w-full h-full">
        <img 
          src={image} 
          alt="ETSI Informática ULL" 
          className="w-full h-full object-cover"
        />
      </div>
      
      <div className="w-full flex flex-col lg:flex-row relative z-10">
          
          {/* Formulario - Lado Izquierdo */}
                <div className="w-full lg:w-2/5 p-8 lg:p-12 bg-white/95 backdrop-blur-sm lg:rounded-r-3xl shadow-2xl">
                <div className="mb-8">
                  <h1 className="text-3xl font-extrabold text-black-900 bg-clip-text mb-3">
                  Iniciar Sesión
                  </h1>
                  <p className="text-gray-400 text-lg">Iniciar sesión con credencial ULL</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6 relative">
                  {showRegistered  && (
                  <div className="absolute -top-15 left-0 right-0 z-50 animate-slideDown">
                    <div className="bg-green-500 text-white px-4 py-3 rounded-xl shadow-2xl flex items-center gap-3">
                    <svg className="h-5 w-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.293 10.293a1 1 0 011.414 0L10 10.586l2.293-2.293a1 1 0 111.414 1.414L10 13.414l-3.707-3.707a1 1 0 011.414-1.414z" clipRule="evenodd" />
                    </svg>
                    <span className="text-sm font-medium flex-1">
                      ¡Registro completado con éxito!
                    </span>
                    </div>
                  </div>
                  )}

                  {/* Error Message - Fixed position toast */}
              {error && (
                <div className="absolute -top-15 left-0 right-0 z-50 animate-slideDown">
                  <div className="bg-red-500 text-white px-4 py-3 rounded-xl shadow-2xl flex items-center gap-3">
                    <svg className="h-5 w-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                    <span className="text-sm font-medium flex-1">{error}</span>
                    <button
                      type="button"
                      onClick={() => setError("")}
                      className="flex-shrink-0 text-white/80 hover:text-white transition-colors"
                    >
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                      </svg>
                    </button>
                  </div>
                </div>
              )}
              
              {/* Email Input */}
              <div>
                <label htmlFor="email" className="block text-sm font-semibold text-gray-700 mb-2">
                  Email
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                    </svg>
                  </div>
                  <input
                    id="email"
                    type="email"
                    placeholder="tu@email.ull.es"
                    className={`w-full pl-10 pr-4 py-3 border rounded-xl focus:ring-2 transition-all outline-none text-gray-900 ${
                      fieldErrors.email 
                        ? 'border-red-500 focus:ring-red-500 focus:border-red-500' 
                        : 'border-gray-300 focus:ring-[#7024BB] focus:border-[#7024BB]'
                    }`}
                    value={form.email}
                    onChange={(e) => {
                      setForm({ ...form, email: e.target.value });
                      if (fieldErrors.email) setFieldErrors({ ...fieldErrors, email: "" });
                    }}
                  />
                </div>
                {fieldErrors.email && (
                  <p className="mt-1.5 text-sm text-red-600 flex items-center gap-1">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    {fieldErrors.email}
                  </p>
                )}
              </div>

              {/* Password Input */}
              <div>
                <label htmlFor="password" className="block text-sm font-semibold text-gray-700 mb-2">
                  Contraseña
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  </div>
                  <input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    className={`w-full pl-10 pr-4 py-3 border rounded-xl focus:ring-2 transition-all outline-none text-gray-900 ${
                      fieldErrors.password 
                        ? 'border-red-500 focus:ring-red-500 focus:border-red-500' 
                        : 'border-gray-300 focus:ring-[#7024BB] focus:border-[#7024BB]'
                    }`}
                    value={form.password}
                    onChange={(e) => {
                      setForm({ ...form, password: e.target.value });
                      if (fieldErrors.password) setFieldErrors({ ...fieldErrors, password: "" });
                    }}
                  />
                </div>
                {fieldErrors.password && (
                  <p className="mt-1.5 text-sm text-red-600 flex items-center gap-1">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    {fieldErrors.password}
                  </p>
                )}
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-[#7024BB] to-[#8e44e5] text-white py-3.5 px-4 rounded-xl font-bold text-lg hover:from-[#5f1da0] hover:to-[#7c3ad4] focus:outline-none focus:ring-4 focus:ring-[#7024BB]/30 transform transition-all duration-200 hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
              >
                {loading ? (
                  <span className="flex items-center justify-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Iniciando sesión...
                  </span>
                ) : (
                  'Iniciar sesión'
                )}
              </button>

              {/* Links */}
              <div className="flex items-center justify-between text-sm mt-6">
                <a href="#" className="text-[#7024BB] hover:text-[#5f1da0] font-medium hover:underline">
                  ¿Olvidaste tu contraseña?
                </a>
                <a href="/register" className="text-[#7024BB] hover:text-[#5f1da0] font-medium hover:underline">
                  Crear cuenta
                </a>
              </div>

              {/* Divider */}
              <div className="relative my-8">
                <div className="relative flex justify-center text-sm">
                  <span className="bg-transparent text-gray-500 font-medium">o continúa con</span>
                </div>
              </div>

              {/* Google Button */}
              <button
                type="button"
                className="w-full flex items-center justify-center gap-3 px-4 py-3 border-2 border-gray-300 rounded-xl hover:bg-gray-50 hover:border-gray-400 transition-all duration-200 group"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                <span className="text-sm font-semibold text-gray-700 group-hover:text-gray-900">Iniciar sesión con Google</span>
              </button>
            </form>
          </div>
        </div>
    </div>
  );
};

export default Login;
