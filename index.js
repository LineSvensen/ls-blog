// index.js (PostgreSQL / Supabase version)

import "dotenv/config";
import express from "express";
import cors from "cors";

import multer from "multer";
import path from "path";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import fs from "fs";

import pg from "pg";
const { Pool } = pg;

// ---------- Files / uploads ----------
const uploadsDir =
  process.env.NODE_ENV === "production" ? "/mnt/uploads" : "mnt/uploads";

if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
  console.log(`Created missing directory: ${uploadsDir}`);
}

// ---------- Env checks ----------
if (!process.env.JWT_SECRET || !process.env.DATABASE_URL) {
  console.error("Missing required environment variables.");
  process.exit(1);
}

// ---------- App ----------
const app = express();
const port = Number(process.env.PORT || 5005);

// Multer storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadsDir),
  filename: (req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(
      null,
      `${file.fieldname}-${uniqueSuffix}${path.extname(file.originalname)}`,
    );
  },
});

const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    const allowedTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
      console.log(`Saving file to uploads directory: ${file.originalname}`);
    } else {
      cb(new Error("Invalid file type. Only images are allowed."));
    }
  },
});

// CORS
app.use(
  cors({
    origin: ["http://127.0.0.1:5503", "https://ls-blog-eight.vercel.app"],
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
);

app.use("/uploads", express.static(uploadsDir));
app.use(express.json());

// ---------- PostgreSQL pool ----------
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  // Supabase/managed Postgres often needs SSL in hosted environments
  ssl:
    process.env.NODE_ENV === "production"
      ? { rejectUnauthorized: false }
      : false,
});

// Test DB connection
pool
  .connect()
  .then((client) => {
    console.log("Database connection successful!");
    client.release();
  })
  .catch((error) => {
    console.error("Database connection failed:", error.message);
    process.exit(1);
  });

// ---------- Helpers ----------
function authenticateToken(req, res, next) {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) {
    return res.status(401).json({ error: "Access denied. No token provided." });
  }

  jwt.verify(token, process.env.JWT_SECRET, (error, user) => {
    if (error) {
      return res.status(403).json({ error: "Invalid token." });
    }
    req.user = user;
    next();
  });
}

// ---------- Routes ----------
app.get("/cors-test", (req, res) => {
  res.json({ message: "CORS is working!" });
});

app.get("/users", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM users");
    res.json({ result: result.rows });
  } catch (error) {
    console.error("Error fetching /users:", error.message);
    res.status(500).json({ error: "Failed to fetch users" });
  }
});

app.get("/users/:id", async (req, res) => {
  const id = Number(req.params.id);
  if (Number.isNaN(id)) {
    return res.status(400).send("ID is not a valid number.");
  }

  try {
    const result = await pool.query("SELECT * FROM users WHERE id = $1", [id]);
    if (result.rows.length) {
      res.json(result.rows);
    } else {
      res.status(404).send("No user was found");
    }
  } catch (error) {
    console.error("Error fetching /users/:id:", error.message);
    res.status(500).send("Error with database query");
  }
});

app.get("/posts", async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT posts.*,
             users.username AS publisher_name
      FROM posts
      JOIN users ON posts.user_id = users.id
      ORDER BY posts.created_at DESC
    `);

    res.json({ result: result.rows });
  } catch (error) {
    console.error("Error fetching /posts:", error.message);
    res.status(500).json({ error: "Failed to fetch posts" });
  }
});

app.post(
  "/posts",
  authenticateToken,
  upload.single("image"),
  async (req, res) => {
    console.log("Uploaded file:", req.file);

    const { title, content } = req.body;
    const user_id = req.user?.userId;
    const imagePath = req.file ? `/uploads/${req.file.filename}` : null;

    if (!user_id) {
      return res.status(400).json({ error: "User ID is required." });
    }

    try {
      const result = await pool.query(
        `INSERT INTO posts (title, content, user_id, image_path)
         VALUES ($1, $2, $3, $4)
         RETURNING id`,
        [title, content, user_id, imagePath],
      );

      res.status(201).json({
        message: "Post created successfully!",
        postId: result.rows[0].id,
      });
    } catch (error) {
      console.error("Error creating post:", error.message);
      res.status(500).json({ error: "Failed to create post." });
    }
  },
);

app.post("/login", async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: "Email and password are required." });
  }

  try {
    const result = await pool.query("SELECT * FROM users WHERE email = $1", [
      email,
    ]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "User not found." });
    }

    const user = result.rows[0];
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return res.status(401).json({ error: "Invalid password." });
    }

    const token = jwt.sign(
      { userId: user.id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRATION || "1d" },
    );

    res.status(200).json({
      message: "Login successful!",
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
      },
    });
  } catch (error) {
    console.error("Error during login:", error.message);
    res.status(500).json({ error: "Server error. Please try again later." });
  }
});

// ---------- Start ----------
app.listen(port, "0.0.0.0", () => {
  console.log(`Server running on port ${port}`);
});
