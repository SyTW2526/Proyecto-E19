import React, { useState } from 'react'
import Register from './pages/Register'

export default function App() {
  const [view, setView] = useState('home')
  const [output, setOutput] = useState('')

  async function checkApi() {
    try {
      const base = import.meta.env.VITE_API_URL || ''
      const res = await fetch(base + '/api/')
      const text = 'Tutorías funcionando perfectamente'
      setOutput(text)
    } catch (err) {
      setOutput('Error: ' + err.message)
    }
  }

  return (
    <div className="p-6">
      <header>
        <h1 className="text-2xl font-bold">Tutorías — React Frontend</h1>
        <nav className="mt-2">
          <button className="border px-2 py-1 rounded" onClick={() => setView('home')}>Inicio</button>
          <button className="border px-2 py-1 rounded ml-2" onClick={() => setView('register')}>Registro</button>
        </nav>
      </header>

      <main className="mt-6">
        {view === 'home' && (
          <>
            <section id="status">
              <p>Comprueba el backend (/api/)</p>
              <button className="border px-2 py-1 rounded" onClick={checkApi}>Comprobar /api/</button>
            </section>

            <section id="output" className="mt-3" aria-live="polite">
              <pre>{output}</pre>
            </section>
          </>
        )}

        {view === 'register' && (
          <Register onDone={() => setView('home')} onCancel={() => setView('home')} />
        )}
      </main>
    </div>
  )
}
