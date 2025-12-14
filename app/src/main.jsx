import React from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import './styles.css'
import { ImageProvider } from './components/ImageContext';

const root = createRoot(document.getElementById('root'))
root.render(
  <ImageProvider>
    <App />
  </ImageProvider>
)
