import express from "express";
import { authorizeAdmin } from "../middlewares/authorizeRoles.js";
import { authMiddleware } from "../middlewares/authMiddleware.js";
import {
  getMostActiveUsers,
  getMostUsedTags,
  getNotesPerDay,
} from "../controllers/dashboardController.js";

const router = express.Router();


/**
 * @swagger
 * /api/dashboard/most-active-users:
 *   get:
 *     summary: Get the most active users (admin only)
 *     tags: [Dashboard]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of most active users
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */
router.get("/most-active-users", authMiddleware, authorizeAdmin, getMostActiveUsers);

/**
 * @swagger
 * /api/dashboard/most-used-tags:
 *   get:
 *     summary: Get the most used tags (admin only)
 *     tags: [Dashboard]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of most used tags
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */
router.get("/most-used-tags", authMiddleware, authorizeAdmin, getMostUsedTags); 

/**
 * @swagger
 * /api/dashboard/notes-per-day:
 *   get:
 *     summary: Get the number of notes created per day (admin only)
 *     tags: [Dashboard]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Notes per day statistics
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */
router.get("/notes-per-day", authMiddleware, authorizeAdmin, getNotesPerDay);

export default router;