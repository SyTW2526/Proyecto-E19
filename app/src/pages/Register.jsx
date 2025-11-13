import React, { useState } from 'react'

const BG = '/mnt/data/Autenticación e inicio de sesión.png' // replace with your image path or URL

function Input({ label, type = 'text', value, onChange, placeholder, icon }) {
  return (
    <label className="block">
      <div className="text-sm font-medium text-gray-600 mb-2">{label}</div>
      <div className="relative">
        <input
          type={type}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          className="w-full rounded-xl border border-gray-200 px-4 py-3 pr-10 focus:outline-none focus:ring-2 focus:ring-purple-500"
        />
        {icon && (
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400">{icon}</div>
        )}
      </div>
    </label>
  )
}

function GoogleButton({ onClick }) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center justify-center gap-3 rounded-lg border border-gray-200 px-4 py-3 bg-white hover:shadow-sm"
    >
      <svg width="18" height="18" viewBox="0 0 533.5 544.3" xmlns="http://www.w3.org/2000/svg" aria-hidden>
        <path fill="#4285F4" d="M533.5 278.4c0-18.6-1.7-37.5-5.4-55.3H272v104.8h147.1c-6.3 33.9-25.7 62.6-54.8 81.8v67h88.5c51.8-47.8 81.7-118 81.7-198.3z"/>
        <path fill="#34A853" d="M272 544.3c73.6 0 135.3-24.3 180.4-66.1l-88.5-67c-24.6 16.5-56.2 26.3-92 26.3-70.8 0-130.8-47.8-152.3-112.2H30.6v70.6C75 486.8 166.5 544.3 272 544.3z"/>
        <path fill="#FBBC05" d="M119.7 325.4c-9.3-27.8-9.3-57.6 0-85.4V169.4H30.6c-38.1 76.3-38.1 167.3 0 243.6l89.1-87.6z"/>
        <path fill="#EA4335" d="M272 108.1c39.9-.6 78.9 14.2 108.4 40.5l81.4-81.4C407 23.6 344.3 0 272 0 166.5 0 75 57.5 30.6 149.4l89.1 70.6C141.2 155.9 201.2 108.7 272 108.1z"/>
      </svg>
      <span className="text-sm font-medium text-gray-700">Iniciar sesión con Google</span>
    </button>
  )
}

export default function AuthPage() {
  const [mode, setMode] = useState('login') // 'login' | 'register'

  return (
    <div className="min-h-screen flex bg-gray-50">
      {/* LEFT: form column */}
      <div className="w-full max-w-2xl bg-white rounded-r-3xl shadow-sm p-12 flex flex-col justify-between">
        <div>
          <div className="mb-10">
            <h1 className="text-4xl font-extrabold text-gray-900">{mode === 'login' ? 'Inicio de Sesión' : 'Registro'}</h1>
            <p className="mt-2 text-sm text-gray-500">{mode === 'login' ? 'Inicio de sesión con credencial de la ULL' : 'Crea una cuenta nueva'}</p>
          </div>

          {mode === 'login' ? <LoginForm /> : <RegisterForm onDone={() => setMode('login')} />}
        </div>

        <div>
          <hr className="my-6 border-gray-200" />
          <GoogleButton onClick={() => alert('Google login placeholder')} />
          <div className="mt-6 text-center text-sm text-gray-500">
            ¿{mode === 'login' ? 'No tienes cuenta' : 'Ya tienes cuenta'}?{' '}
            <button
              onClick={() => setMode(mode === 'login' ? 'register' : 'login')}
              className="text-purple-600 font-semibold underline ml-1"
            >
              {mode === 'login' ? 'Regístrate' : 'Inicia sesión'}
            </button>
          </div>
        </div>
      </div>

      {/* RIGHT: image column */}
      <div className="hidden md:flex-1 md:flex items-end justify-end bg-cover bg-center p-8" style={{ backgroundImage: `url(${BG})` }}>
        {/* Decorative bottom badge */}
        <div className="mb-8 mr-8 bg-white rounded-2xl shadow-lg px-5 py-3 flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-purple-700 text-white flex items-center justify-center font-bold">u</div>
          <div>
            <div className="text-sm font-bold">ULL Calendar</div>
          </div>
        </div>
      </div>
    </div>
  )
}

function LoginForm() {
  const [user, setUser] = useState('')
  const [password, setPassword] = useState('')
  const [remember, setRemember] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  async function handleSubmit(e) {
    e.preventDefault()
    setError(null)
    if (!user || !password) return setError('Introduce usuario y contraseña')
    setLoading(true)
    try {
      // placeholder: replace with real login call
      await new Promise(res => setTimeout(res, 700))
      alert('Login OK (placeholder)')
    } catch (err) {
      setError('Credenciales inválidas')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input
        label="Usuario"
        value={user}
        onChange={e => setUser(e.target.value)}
        placeholder="Introduce tu nombre de usuario"
        icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4" stroke="currentColor" strokeWidth="1.5"/></svg>}
      />

      <Input
        label="Contraseña"
        type="password"
        value={password}
        onChange={e => setPassword(e.target.value)}
        placeholder="Introduce tu contraseña"
        icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" d="M12 15v2"/><rect x="3" y="11" width="18" height="11" rx="2" stroke="currentColor" strokeWidth="1.5"/><path d="M7 11V8a5 5 0 0 1 10 0v3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>}
      />

      <div className="flex items-center justify-between text-sm">
        <label className="flex items-center gap-2 text-gray-600">
          <input type="checkbox" checked={remember} onChange={e => setRemember(e.target.checked)} className="w-4 h-4" />
          <span>Recordar</span>
        </label>
        <button type="button" className="text-purple-600">Olvidé mi contraseña</button>
      </div>

      <div>
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-purple-700 text-white rounded-xl py-3 font-semibold hover:opacity-95 disabled:opacity-60 flex items-center justify-center gap-3"
        >
          {loading ? 'Accediendo...' : 'Iniciar sesión'}
        </button>
      </div>

      {error && <div className="text-sm text-red-600">{error}</div>}
    </form>
  )
}

function RegisterForm({ onDone }) {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(null)

  async function handleSubmit(e) {
    e.preventDefault()
    setError(null)
    setSuccess(null)
    if (!name || !email || !password) return setError('Rellena nombre, email y contraseña')
    if (password.length < 6) return setError('La contraseña debe tener al menos 6 caracteres')
    if (password !== confirm) return setError('Las contraseñas no coinciden')

    setLoading(true)
    try {
      // placeholder register call
      await new Promise(res => setTimeout(res, 700))
      setSuccess('Registro completado')
      setName('')
      setEmail('')
      setPassword('')
      setConfirm('')
      if (onDone) onDone()
    } catch (err) {
      setError('Error en el registro')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input label="Nombre" value={name} onChange={e => setName(e.target.value)} placeholder="Nombre completo" />
      <Input label="Email" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="ejemplo@ull.es" />
      <Input label="Contraseña" type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Introduce tu contraseña" />
      <Input label="Confirmar contraseña" type="password" value={confirm} onChange={e => setConfirm(e.target.value)} placeholder="Repite la contraseña" />

      <div className="mt-4">
        <button type="submit" disabled={loading} className="w-full bg-purple-700 text-white rounded-xl py-3 font-semibold hover:opacity-95 disabled:opacity-60">
          {loading ? 'Registrando...' : 'Registrarme'}
        </button>
      </div>

      {error && <div className="text-sm text-red-600">{error}</div>}
      {success && <div className="text-sm text-green-600">{success}</div>}
    </form>
  )
}
