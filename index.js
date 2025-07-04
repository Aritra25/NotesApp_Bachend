import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { swaggerDocs } from './config/swagger.js';
import noteRoutes from './routes/NoteRoutes.js';
import authRoutes from './routes/authRoutes.js';
import dashboardRoutes from './routes/dashbardRoutes.js';
import cookieParser from 'cookie-parser';

dotenv.config();

const app = express();
// app.use(cors());
app.use(cors({ origin: "http://localhost:5173", credentials: true }));

app.use(express.json());
app.use(cookieParser());

// API routes
app.use('/api/notes', noteRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/dashboard', dashboardRoutes);

// Swagger only in non-test environments
if (process.env.NODE_ENV !== 'test') {
  swaggerDocs(app);
}

// Only connect DB and start server if not in test mode
if (process.env.NODE_ENV !== 'test') {
  const MONGO_URI = process.env.MONGO_URI;
  mongoose
    .connect(MONGO_URI)
    .then(() => {
      console.log('MongoDB connected');

      const PORT = process.env.PORT || 5000;
      app.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
      });
    })
    .catch((err) => {
      console.error('MongoDB connection error:', err);
      process.exit(1);
    });
}

export default app;
