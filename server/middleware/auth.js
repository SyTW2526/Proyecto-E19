import jwt from "jsonwebtoken";
import User from "../src/models/User.js";

export const protect = async (req, res, next) => {
  try {
    const token = req.cookies.token;

    if (!token) {
      return res.status(401).json({ message: "Not authorized, no token" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userId = decoded.id;

    // petición a la base de datos (MongoDB) usando Mongoose
    const user = await User.findById(userId).select("username email");

    if (!user) {
      return res.status(401).json({ message: "Not authorized, user not found" });
    }

    req.user = { id: user._id, username: user.username, email: user.email };
    next();
    
  } catch (error) {
    console.error("Auth middleware error:", error);
    return res.status(401).json({ message: "Not authorized, token failed" });
  }
}

