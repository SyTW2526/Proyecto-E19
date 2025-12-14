import { createContext, useContext, useState } from 'react';
import escuelaSuperior from '../images/Facultad-Bellas-Artes.jpg';

const ImageContext = createContext();

export const useImage = () => useContext(ImageContext);

export const ImageProvider = ({ children }) => {
  // Temporalmente usar una imagen fija para probar
  const [image, setImage] = useState(escuelaSuperior);

  /* CÓDIGO ORIGINAL COMENTADO - para restaurar la funcionalidad aleatoria
  const KEY = 'bgImage';

  // Inicializar de forma síncrona: lee sessionStorage o elige y guarda una imagen inmediatamente
  const initialImage = (() => {
    if (typeof window === 'undefined') return null;
    try {
      const stored = sessionStorage.getItem(KEY);
      if (stored) return stored;

      const images = import.meta.glob('../images/*.{png,jpg,jpeg}', { eager: true, import: 'default' });
      const imageArray = Object.values(images);
      if (!imageArray.length) return null;

      const chosen = imageArray[Math.floor(Math.random() * imageArray.length)];
      try { sessionStorage.setItem(KEY, chosen); } catch (e) { // ignore }
      return chosen;
    } catch (err) {
      console.error("ImageProvider init error:", err);
      return null;
    }
  })();

  const [image, setImage] = useState(initialImage);
  */

  return (
    <ImageContext.Provider value={{ image }}>
      {children}
    </ImageContext.Provider>
  );
};
