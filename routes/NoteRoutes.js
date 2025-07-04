// import { getPaginatedUsers } from "../controllers/noteController.js";


import express from "express";
import {
  createNote,
  getAccessibleNotes,
  getNoteById,
  updateNote,
  deleteNote,
  shareNote,
  unshareNote,
  changeSharedAccess,
  getFilteredNotes,
  archiveNote,
  unarchiveNote,
  getPaginatedUsers
} from "../controllers/noteController.js";


import { authMiddleware } from "../middlewares/authMiddleware.js";
import { authorizeAdmin } from "../middlewares/authorizeRoles.js";

const router = express.Router();


/**
 * @swagger
 * /api/notes:
 *   post:
 *     summary: Create a new note
 *     tags: [Notes]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *               content:
 *                 type: string
 *               tags:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       201:
 *         description: Note created successfully
 *       401:
 *         description: Unauthorized
 */
router.post("/", authMiddleware, createNote);


/**
 * @swagger
 * /api/notes:
 *   get:
 *     summary: Get all accessible notes (owned or shared)
 *     tags: [Notes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: Notes per page
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search by title or content
 *       - in: query
 *         name: tag
 *         schema:
 *           type: string
 *         description: Filter by tag(s), comma separated
 *     responses:
 *       200:
 *         description: List of notes
 *       401:
 *         description: Unauthorized
 */
router.get("/", authMiddleware, getAccessibleNotes);


/**
 * @swagger
 * /api/notes/filter:
 *   get:
 *     summary: Get filtered notes (tags, archived, search)
 *     tags: [Notes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: tags
 *         schema:
 *           type: string
 *         description: Filter by tags (comma separated)
 *       - in: query
 *         name: isArchived
 *         schema:
 *           type: boolean
 *         description: Filter by archived status
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search by title/content/tag
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: Notes per page
 *     responses:
 *       200:
 *         description: List of filtered notes
 *       401:
 *         description: Unauthorized
 */
router.get("/filter", authMiddleware, getFilteredNotes);

/**
 * @swagger
 * /api/notes/users:
 *   get:
 *     summary: Get paginated users for sharing
 *     tags: [Notes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: Users per page
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search by name or email
 *     responses:
 *       200:
 *         description: List of users
 *       401:
 *         description: Unauthorized
 */
router.get("/users", authMiddleware, getPaginatedUsers);



/**
 * @swagger
 * /api/notes/{id}:
 *   get:
 *     summary: Get a single note by ID
 *     tags: [Notes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: Note ID
 *     responses:
 *       200:
 *         description: Note found
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Note not found
 */
router.get("/:id", authMiddleware, getNoteById);


/**
 * @swagger
 * /api/notes/{noteId}:
 *   put:
 *     summary: Update a note
 *     tags: [Notes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: noteId
 *         schema:
 *           type: string
 *         required: true
 *         description: Note ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *               content:
 *                 type: string
 *               tags:
 *                 type: array
 *                 items:
 *                   type: string
 *               isArchived:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Note updated
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Note not found
 */
router.put("/:noteId", authMiddleware, updateNote);


/**
 * @swagger
 * /api/notes/{id}:
 *   delete:
 *     summary: Delete a note
 *     tags: [Notes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: Note ID
 *     responses:
 *       200:
 *         description: Note deleted
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Note not found
 */
router.delete("/:id", authMiddleware, deleteNote);


/**
 * @swagger
 * /api/notes/{id}/share:
 *   post:
 *     summary: Share a note with another user
 *     tags: [Notes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: Note ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               userId:
 *                 type: string
 *               access:
 *                 type: string
 *                 enum: [read, write]
 *     responses:
 *       200:
 *         description: Note shared
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Note not found
 */
router.post("/:id/share", authMiddleware, shareNote);


/**
 * @swagger
 * /api/notes/{id}/unshare:
 *   post:
 *     summary: Unshare a note from a user
 *     tags: [Notes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: Note ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               userId:
 *                 type: string
 *     responses:
 *       200:
 *         description: Note unshared
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Note not found
 */
router.post("/:id/unshare", authMiddleware, unshareNote);


/**
 * @swagger
 * /api/notes/{id}/change-access:
 *   post:
 *     summary: Change access level for a shared user
 *     tags: [Notes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: Note ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               userId:
 *                 type: string
 *               access:
 *                 type: string
 *                 enum: [read, write]
 *     responses:
 *       200:
 *         description: Access level changed
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Note or user not found
 */
router.post("/:id/change-access", authMiddleware, changeSharedAccess);

/**
 * @swagger
 * /api/notes/{id}/archive:
 *   post:
 *     summary: Archive a note
 *     tags: [Notes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: Note ID
 *     responses:
 *       200:
 *         description: Note archived
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Note not found
 */
router.post('/:id/archive', authMiddleware, archiveNote);

/**
 * @swagger
 * /api/notes/{id}/unarchive:
 *   post:
 *     summary: Unarchive a note
 *     tags: [Notes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: Note ID
 *     responses:
 *       200:
 *         description: Note unarchived
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Note not found
 */
router.post('/:id/unarchive', authMiddleware, unarchiveNote);

export default router;
