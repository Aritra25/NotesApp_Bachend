import jwt from "jsonwebtoken";
import { User } from "../models/user.model.js";

// const JWT_SECRET = process.env.JWT_SECRET;
// console.log(JWT_SECRET)

export const authMiddleware = async (req, res, next) => {
  try {
    const token = req.cookies.token;
    const secret = process.env.JWT_SECRET;
    // console.log('Token:', token);
    // console.log('Token length:', token ? token.length : 0);
    // console.log('JWT_SECRET:', secret);
    // console.log('JWT_SECRET length:', secret ? secret.length : 0);
    if (!token) return res.status(401).json({ message: "Unauthorized" });

    const decoded = jwt.verify(token, secret);
    const user = await User.findById(decoded.id).select("-password");
    if (!user) return res.status(404).json({ message: "User not found" });

    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({ message: "Invalid token", error: err.message });
  }
};
