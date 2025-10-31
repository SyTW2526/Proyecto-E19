document.getElementById('btn-check').addEventListener('click', async () => {
  const out = document.getElementById('output');
  out.textContent = 'Consultando /api/ ...';
  try {
    const res = await fetch('/api/');
    const text = await res.text();
    out.textContent = `Respuesta de /api/: ${text}`;
  } catch (err) {
    out.textContent = `Error al conectar con /api/: ${err.message}`;
  }
});
