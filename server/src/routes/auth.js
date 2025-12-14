import express from "express";
import User from "../models/User.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { protect } from "../../middleware/auth.js";


const router = express.Router();

const cookieOptions = {
  httpOnly: true, 
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'Strict',
  maxAge: 24 * 60 * 60 * 1000
}

const generateToken = (user) => {
  return jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
    expiresIn: "30d",
  });
}

router.post("/register", async (req, res) => {
  try {
    const data = req.body;

    // validación básica
    if (!data.email || !data.password || !data.name) {
      return res.status(400).json({ error: "Faltan campos obligatorios (name, email, password)" });
    }

    const email = data.email.trim().toLowerCase();

    const existe = await User.findOne({ email });
    if (existe) {
      return res.status(409).json({ error: "El email ya está registrado" });
    }

    const hashedPassword = await bcrypt.hash(data.password, 10);

    // asignar rol según prefijo del email
    const role = email.startsWith("alu") ? "alumno" : "profesor";

    const user = new User({ ...data, email, password: hashedPassword, rol: role });
    await user.save();

    const token = generateToken(user);
    res.cookie('token', token, cookieOptions);
    
    const userResponse = {
      _id: user._id,
      name: user.name,
      email: user.email,
      rol: user.rol,
      telefono: user.telefono,
      avatarUrl: user.avatarUrl,
      activo: user.activo,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt
    };
    
    res.status(201).json({ user: userResponse, token });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "server_error", details: err.message });
  }
});

router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const emailLower = email.toLowerCase().trim();
    const user = await User.findOne({ email: emailLower });
    if (!user) {
      return res.status(401).json({ error: "Credenciales inválidas" });
    }
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ error: "Credenciales inválidas" });
    }
    const token = generateToken(user);

    res.cookie('token', token, cookieOptions);

    const userResponse = {
      _id: user._id,
      name: user.name,
      email: user.email,
      rol: user.rol,
      telefono: user.telefono,
      avatarUrl: user.avatarUrl,
      activo: user.activo,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt
    };

    res.json({ user: userResponse, token });
  }
  catch (err) {
    console.error(err);
    res.status(500).json({ error: "server_error", details: err.message });
  }
});

// me - obtener datos del usuario autenticado
router.get("/me", protect, (req, res) => {
  res.json(req.user);
});

// logout - eliminar la cookie de autenticación
router.post("/logout", (req, res) => {
  res.cookie('token', '', { ...cookieOptions, maxAge: 1 });
  res.json({ message: "Logged out successfully" });
});
export default router;