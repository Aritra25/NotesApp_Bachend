import { User } from "../models/user.model.js";
import { Note } from "../models/note.model.js";
import dayjs from "dayjs";

export const getMostActiveUsers = async (req, res) => {
  try {
    const users = await Note.aggregate([
      { $group: { _id: "$userId", notesCount: { $sum: 1 } } },
      {
        $lookup: {
          from: "users",
          localField: "_id",
          foreignField: "_id",
          as: "user",
        },
      },
      { $unwind: "$user" },
      { $project: { name: "$user.name", email: "$user.email", notesCount: 1 } },
      { $sort: { notesCount: -1 } },
      { $limit: 5 },
    ]);

    res.json(users);
  } catch (err) {
    res
      .status(500)
      .json({
        message: "Failed to fetch most active users",
        error: err.message,
      });
  }
};

export const getMostUsedTags = async (req, res) => {
  try {
    const tags = await Note.aggregate([
      { $unwind: "$tags" },
      { $group: { _id: "$tags", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 5 },
      { $project: { tag: "$_id", count: 1, _id: 0 } },
    ]);

    res.json(tags);
  } catch (err) {
    res
      .status(500)
      .json({ message: "Failed to fetch most used tags", error: err.message });
  }
};

export const getNotesPerDay = async (req, res) => {
  try {
    const today = dayjs().startOf("day");
    const last7Days = [...Array(7)].map((_, i) => today.subtract(i, "day"));

    const result = await Note.aggregate([
      {
        $match: {
          createdAt: {
            $gte: last7Days[6].toDate(),
            $lte: today.endOf("day").toDate(),
          },
        },
      },
      {
        $group: {
          _id: {
            $dateToString: { format: "%Y-%m-%d", date: "$createdAt" },
          },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    const data = last7Days.reverse().map((day) => {
      const formatted = day.format("YYYY-MM-DD");
      const match = result.find((r) => r._id === formatted);
      return { date: formatted, count: match?.count || 0 };
    });

    res.json(data);
  } catch (err) {
    res
      .status(500)
      .json({ message: "Failed to fetch notes per day", error: err.message });
  }
};
