// Get paginated users for sharing (with search)
import { User } from "../models/user.model.js";
import { Note } from "../models/note.model.js";
// import { User } from "../models/user.model.js";

//utils
const isOwner = (note, userId) => {
  return note.userId.toString() === userId.toString();
};

const isAdmin = (user) => user.role === "admin";

const hasWriteAccess = (note, userId) => {
  return note.sharedWith.some(
    (entry) =>
      entry.user.toString() === userId.toString() && entry.access === "write"
  );
};

const getPaginatedUsers = async (req, res) => {
  try {
    let { page = 1, limit = 5, search = "", noteId } = req.query;
    page = parseInt(page) || 1;
    limit = parseInt(limit) || 5;
    const query = {};
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
      ];
    }

    // Exclude the requesting user, users already shared for the note, and the note owner
    let excludeUserIds = [];
    if (req.user && req.user._id) {
      excludeUserIds.push(req.user._id.toString());
    }
    if (noteId) {
      const note = await Note.findById(noteId);
      if (note) {
        // Exclude users already shared for the note
        if (note.sharedWith && note.sharedWith.length > 0) {
          excludeUserIds = excludeUserIds.concat(note.sharedWith.map(entry => entry.user.toString()));
        }
        // Exclude the note owner
        if (note.userId) {
          excludeUserIds.push(note.userId.toString());
        }
      }
    }
    if (excludeUserIds.length > 0) {
      query._id = { $nin: excludeUserIds };
    }

    const users = await User.find(query)
      .select("_id name email")
      .skip((page - 1) * limit)
      .limit(limit);
    const total = await User.countDocuments(query);
    res.status(200).json({ users, total });
  } catch (error) {
    res.status(500).json({ message: "Error fetching users", error: error.message });
  }
};

// Ensure this controller is not shadowed by a catch-all :id route in your router.
// In your routes file, place the /users route BEFORE any /:id or /:noteId routes.
// Archive a note
const archiveNote = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;
    const note = await Note.findById(id);
    if (!note) {
      return res.status(404).json({ message: "Note not found" });
    }
    if (!isOwner(note, userId) && !isAdmin(req.user)) {
      return res.status(403).json({ message: "Only owner or admin can archive" });
    }
    note.isArchived = true;
    await note.save();
    res.status(200).json({ message: "Note archived", note });
  } catch (error) {
    res.status(500).json({ message: "Error archiving note", error: error.message });
  }
};

// Unarchive a note
const unarchiveNote = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;
    const note = await Note.findById(id);
    if (!note) {
      return res.status(404).json({ message: "Note not found" });
    }
    if (!isOwner(note, userId) && !isAdmin(req.user)) {
      return res.status(403).json({ message: "Only owner or admin can unarchive" });
    }
    note.isArchived = false;
    await note.save();
    res.status(200).json({ message: "Note unarchived", note });
  } catch (error) {
    res.status(500).json({ message: "Error unarchiving note", error: error.message });
  }
};

// create a note
const createNote = async (req, res) => {
  try {
    const { title, content, tags } = req.body;
    const userId = req.user._id;

    const newNote = new Note({
      title,
      content,
      tags,
      userId,
    });

    await newNote.save();
    res
      .status(201)
      .json({ message: "Note created successfully", note: newNote });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error creating note", error: error.message });
  }
};

//Get all notes
const getAccessibleNotes = async (req, res) => {
  try {
    const userId = req.user._id;
    const notes = await Note.find({
      $or: [
        { userId: userId }, // Notes owned by the user
        { sharedWith: { $elemMatch: { user: userId } } }, // Notes shared with the user
      ],
    });
    res.status(200).json(notes);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error fetching notes", error: error.message });
  }
};

// Get a single note
const getNoteById = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;
    const note = await Note.findById(id).lean();
    if (!note) {
      return res.status(404).json({ message: "Note not found" });
    }

    const canAccess =
      isAdmin(req.user) ||
      isOwner(note, userId) ||
      note.sharedWith.some(
        (entry) => entry.user.toString() === userId.toString()
      );
    if (!canAccess) {
      return res.status(403).json({ message: "Access denied" });
    }

    // Populate sharedWith with user name/email and also populate sharedBy (if present) with name/email
    let userMap = {};
    if (note.sharedWith && note.sharedWith.length > 0) {
      const userIds = note.sharedWith.map(entry => entry.user);
      // Also collect sharedBy ids if present
      const sharedByIds = note.sharedWith
        .map(entry => entry.sharedBy)
        .filter(Boolean)
        .map(id => id.toString());
      const allUserIds = [...userIds, ...sharedByIds, note.userId.toString()];
      const users = await User.find({ _id: { $in: allUserIds } }).select('_id name email');
      userMap = {};
      users.forEach(u => { userMap[u._id.toString()] = u; });
      note.sharedWith = note.sharedWith.map(entry => {
        const userObj = userMap[entry.user.toString()];
        let sharedByObj = undefined;
        if (entry.sharedBy) {
          sharedByObj = userMap[entry.sharedBy.toString()];
        }
        return {
          ...entry,
          name: userObj ? userObj.name : undefined,
          email: userObj ? userObj.email : undefined,
          sharedByName: sharedByObj ? sharedByObj.name : undefined,
          sharedByEmail: sharedByObj ? sharedByObj.email : undefined,
        };
      });
    }
    // Always populate note owner name/email
    if (note.userId && userMap && userMap[note.userId.toString()]) {
      note.owner = {
        _id: note.userId,
        name: userMap[note.userId.toString()].name,
        email: userMap[note.userId.toString()].email,
      };
    }

    // Add canDelete and canEdit fields for frontend
    let canDelete = false;
    let canEdit = false;
    if (isAdmin(req.user) || isOwner(note, userId)) {
      canDelete = true;
      canEdit = true;
    } else if (note.sharedWith && note.sharedWith.length > 0) {
      const sharedEntry = note.sharedWith.find(entry => entry.user.toString() === userId.toString());
      if (sharedEntry && sharedEntry.access === 'write') {
        canEdit = true;
      }
    }
    note.canDelete = canDelete;
    note.canEdit = canEdit;
    // Replace userId with owner name for frontend display
    if (note.owner && note.owner.name) {
      note.userId = note.owner.name;
    }
    res.status(200).json(note);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error fetching note", error: error.message });
  }
};

// update a note
const updateNote = async (req, res) => {
  try {
    const { noteId } = req.params;
    const userId = req.user._id;
    const note = await Note.findById(noteId);
    if (!note) {
      return res.status(404).json({ message: "Note not found" });
    }
    const canEdit =
      isAdmin(req.user) ||
      isOwner(note, userId) ||
      hasWriteAccess(note, userId);
    if (!canEdit) {
      return res.status(403).json({ message: "Access denied" });
    }
    const { title, tags, content, isArchived, sharedWith } = req.body;
    if (title !== undefined) note.title = title;
    if (tags !== undefined) note.tags = tags;
    if (content !== undefined) note.content = content;
    if (isArchived !== undefined) note.isArchived = isArchived;
    // Update sharedWith if provided (array of {user, access})
    if (Array.isArray(sharedWith)) {
      note.sharedWith = sharedWith.map(entry => ({
        user: entry.user || entry._id, // support both user and _id
        access: entry.access || entry.permission || 'read',
      }));
    }
    await note.save();
    res.status(200).json({ message: "Note updated successfully", note });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error updating note", error: error.message });
  }
};

// DELETE a note
const deleteNote = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;
    const note = await Note.findById(id);
    if (!note) {
      return res.status(404).json({ message: "Note not found" });
    }
    if (!isOwner(note, userId) && !isAdmin(req.user)) {
      return res
        .status(403)
        .json({ message: "Only owner or admin can delete" });
    }

    // Remove note from owner's notes array
    await User.findByIdAndUpdate(note.userId, { $pull: { notes: note._id } });

    // Remove note from all shared users' notes arrays
    if (note.sharedWith && note.sharedWith.length > 0) {
      const sharedUserIds = note.sharedWith.map(entry => entry.user);
      await User.updateMany(
        { _id: { $in: sharedUserIds } },
        { $pull: { notes: note._id } }
      );
    }

    await note.deleteOne();
    res.status(200).json({ message: "Note deleted successfully" });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error deleting note", error: error.message });
  }
};

// share a note
// import { User } from "../models/user.model.js";
const shareNote = async (req, res) => {
  try {
    const { userId, access } = req.body;
    const note = await Note.findById(req.params.id);
    if (!note) return res.status(404).json({ message: "Note not found" });

    if (!isOwner(note, req.user._id) && !isAdmin(req.user)) {
      return res.status(403).json({ message: "Only owner or admin can share" });
    }

    const existing = note.sharedWith.find(
      (entry) => entry.user.toString() === userId
    );

    if (existing) {
      existing.access = access;
    } else {
      note.sharedWith.push({ user: userId, access });
      // Add note to the shared user's notes array if not already present
      await User.findByIdAndUpdate(userId, { $addToSet: { notes: note._id } });
    }

    await note.save();
    res.status(200).json({ message: "Note shared", note });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error sharing note", error: error.message });
  }
};

// unshare a note
const unshareNote = async (req, res) => {
  try {
    const { userId } = req.body;
    const note = await Note.findById(req.params.id);
    if (!note) return res.status(404).json({ message: "Note not found" });

    if (!isOwner(note, req.user._id) && !isAdmin(req.user)) {
      return res
        .status(403)
        .json({ message: "Only owner or admin can unshare" });
    }

    note.sharedWith = note.sharedWith.filter(
      (entry) => entry.user.toString() !== userId
    );

    // Remove note from the user's notes array
    await User.findByIdAndUpdate(userId, { $pull: { notes: note._id } });

    await note.save();
    res.status(200).json({ message: "Note unshared", note });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error unsharing note", error: error.message });
  }
};

// change access level
const changeSharedAccess = async (req, res) => {
  try {
    const { userId, access } = req.body;
    const note = await Note.findById(req.params.id);
    if (!note) return res.status(404).json({ message: "Note not found" });

    if (!isOwner(note, req.user._id) && !isAdmin(req.user)) {
      return res
        .status(403)
        .json({ message: "Only owner or admin can change access level" });
    }

    const entry = note.sharedWith.find(
      (entry) => entry.user.toString() === userId
    );

    if (!entry) {
      return res.status(404).json({ message: "User not found in shared list" });
    }

    entry.access = access;
    // Ensure note is in the user's notes array if not already present
    await User.findByIdAndUpdate(userId, { $addToSet: { notes: note._id } });

    await note.save();
    res.status(200).json({ message: "Access level changed", note });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error changing access level", error: error.message });
  }
};

// Filters notes by tags/ archived
const getFilteredNotes = async (req, res) => {
  try {
    const { tags, isArchived } = req.query;
    const userId = req.user._id;

    const filter = {
      $or: [
        { userId: userId }, // Notes owned by the user
        { sharedWith: { $elemMatch: { user: userId } } }, // Notes shared with the user
      ],
    };

    if (tags) {
      filter.tags = { $in: tags.split(",") };
    }
    if (isArchived !== undefined) {
      filter.isArchived = isArchived === "true";
    }

    const notes = await Note.find(filter);
    res.status(200).json(notes);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error fetching filtered notes", error: error.message });
  }
};

export {
  createNote,
  getAccessibleNotes,
  getNoteById,
  updateNote,
  deleteNote,
  shareNote,
  changeSharedAccess,
  unshareNote,
  getFilteredNotes,
  archiveNote,
  unarchiveNote,
  getPaginatedUsers,
};
