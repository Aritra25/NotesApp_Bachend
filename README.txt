NotesApp Backend
================

This is the backend for NotesApp, a collaborative note-taking platform built with Node.js, Express, and MongoDB.

Features:
---------
- RESTful API for notes, users, authentication, and sharing
- JWT/cookie-based authentication
- Role-based access control (admin/user)
- Note sharing with permission management
- Tagging, search, and pagination
- Secure password hashing
- CORS and security best practices


Getting Started:
---------------
1. Install dependencies:
   npm install

2. Set up environment variables:
   - Create a `.env` file in the Backend directory with the following:
     MONGO_URI=your_mongodb_connection_string
     JWT_SECRET=your_jwt_secret
     COOKIE_SECRET=your_cookie_secret
     PORT=5000
     (Add any other required variables as needed)

3. Start MongoDB:
   - Make sure MongoDB is running locally or use a cloud MongoDB service (e.g., MongoDB Atlas).

4. Start the server:
   npm run dev
   (or npm start for production)

5. The API will run at http://localhost:5000

User Roles:
-----------
- Admin: Can view all users, manage all notes, and access the dashboard.
- User: Can create, edit, share, and manage their own notes.

Authentication:
---------------
- Uses JWT tokens stored in HTTP-only cookies for secure authentication.
- Register and login endpoints: `/api/auth/register` and `/api/auth/login`
- Get current user: `/api/auth/me`

Notes API:
----------
- Create note: `POST /api/notes`
- Get all notes: `GET /api/notes`
- Get single note: `GET /api/notes/:id`
- Update note: `PUT /api/notes/:id`
- Delete note: `DELETE /api/notes/:id`
- Archive/unarchive: `POST /api/notes/:id/archive` and `/unarchive`
- Share/unshare: `POST /api/notes/:id/share` and `/unshare`
- Change permissions: `POST /api/notes/:id/permissions`

Testing:
--------
- Run tests with: `npm test`
- Test files are in the `test/` directory and use Jest.

Error Handling:
---------------
- All API errors return JSON with a `message` field.
- 401/403 for unauthorized/forbidden actions.

Security:
---------
- Passwords are hashed with bcrypt.
- CORS is enabled for frontend-backend communication.
- Helmet and other best practices are used for security.

Swagger API Documentation:
-------------------------
- Swagger docs available at `/api/docs` (if enabled in config/swagger.js)

Contact:
--------
For issues, suggestions, or contributions, please contact the project maintainer or open an issue on the repository.

Project Structure:
------------------
- controllers/: Route logic for auth, notes, dashboard
- models/: Mongoose models (User, Note)
- routes/: Express route definitions
- middlewares/: Auth and role middleware
- config/: Swagger and other configs
- test/: Jest test files

API Documentation:
------------------
- Swagger docs available at /api/docs (if enabled)

Contact:
--------
For issues or contributions, please contact the project maintainer.
