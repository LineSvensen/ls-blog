import "dotenv/config";
import express from "express";
import cors from "cors";
import mysql from "mysql2/promise";
import multer from "multer";
import path from "path";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

if (!process.env.JWT_SECRET || !process.env.DB_HOST) {
  console.error(
    "Missing required environment variables. Check your .env file."
  );
  process.exit(1); // Exit the application if required variables are missing
}

const app = express();
const port = process.env.PORT || 5005;

// const multer = require("multer");

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/"); // Ensure this directory exists
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(
      null,
      `${file.fieldname}-${uniqueSuffix}${path.extname(file.originalname)}`
    );
  },
});

const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    const allowedTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Invalid file type. Only images are allowed."));
    }
  },
});

app.use(
  cors({
    origin: ["http://127.0.0.1:5503", "https://ls-blog-eight.vercel.app"],
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

app.get("/cors-test", (req, res) => {
  res.json({ message: "CORS is working!" });
});

app.use(express.json());
app.use("/uploads", express.static("uploads"));

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

console.log("Connection state:", pool?.state);

pool
  .getConnection()
  .then((connection) => {
    console.log("Database connection successful!");
    connection.release();
  })
  .catch((error) => {
    console.error("Database connection failed:", error.message);
    process.exit(1);
  });

app.get("/users", async (req, res) => {
  try {
    const [result, fields] = await pool.query("SELECT * FROM users");
    res.json({
      result,
    });
  } catch (error) {
    console.log("error fetching /users", error.message);
    res.status(500).json({ error: "failed to fetch users" });
  }
});

app.get("/users/:id", async (req, res) => {
  const id = Number(req.params.id);
  if (!isNaN(id)) {
    try {
      const [result] = await pool.execute("SELECT * FROM users WHERE id = ?", [
        id,
      ]);
      if (result.length) {
        res.json(result);
        console.log("result:", result);
      } else {
        res.status(404).send("no user were found");
        console.log("no user were found");
      }
    } catch (error) {
      res.status(500).send("Error with database query");
      console.log("Error with database query");
    }
  } else {
    res.status(400).send("id is not a valid number.");
    console.log("id is not a valid number.");
  }
});

app.post(
  "/posts",
  authenticateToken,
  upload.single("image"),
  async (req, res) => {
    const { title, content } = req.body;
    const user_id = req.user?.userId; // Ensure userId exists
    const imagePath = req.file ? `/uploads/${req.file.filename}` : null;

    if (!user_id) {
      return res.status(400).json({ error: "User ID is required." });
    }

    try {
      const [result] = await pool.execute(
        "INSERT INTO posts (title, content, user_id, image_path) VALUES (?, ?, ?, ?)",
        [title, content, user_id, imagePath]
      );

      res.status(201).json({
        message: "Post created successfully!",
        postId: result.insertId,
      });
    } catch (error) {
      console.error("Error creating post:", error.message);
      res.status(500).json({ error: "Failed to create post." });
    }
  }
);

// if this was a platform where you needed to be a memeber to view posts. aka facebook etc
// app.get("/posts", authenticateToken, async (req, res) => {
//   try {
//     const [posts] = await pool.query(`
//       SELECT posts.*,
//              users.username AS publisher_name,
//              COUNT(likes.id) AS total_likes
//       FROM posts
//       LEFT JOIN likes ON posts.id = likes.post_id
//       JOIN users ON posts.user_id = users.id
//       GROUP BY posts.id
//       ORDER BY posts.created_at DESC
//     `);

//     res.json({ result: posts });
//   } catch (error) {
//     console.error("Error fetching /posts:", error.message);
//     res.status(500).json({ error: "Failed to fetch posts" });
//   }
// });

app.get("/posts", async (req, res) => {
  try {
    const [posts] = await pool.query(`
      SELECT posts.*, 
             users.username AS publisher_name, 
             COUNT(likes.id) AS total_likes
      FROM posts
      LEFT JOIN likes ON posts.id = likes.post_id
      JOIN users ON posts.user_id = users.id
      GROUP BY posts.id
      ORDER BY posts.created_at DESC
    `);

    res.json({ result: posts });
  } catch (error) {
    console.error("Error fetching /posts:", error.message);
    res.status(500).json({ error: "Failed to fetch posts" });
  }
});

app.post("/posts/:id/like", async (req, res) => {
  const postId = req.params.id;
  const { user_id } = req.body;

  try {
    const [userExists] = await pool.execute(
      "SELECT id FROM users WHERE id = ?",
      [user_id]
    );
    if (userExists.length === 0) {
      await pool.execute("INSERT INTO users (id, username) VALUES (?, ?)", [
        user_id,
        `Visitor-${Date.now()}`,
      ]);
    }
    const [likeExists] = await pool.execute(
      "SELECT * FROM likes WHERE post_id = ? AND user_id = ?",
      [postId, user_id]
    );
    if (likeExists.length > 0) {
      return res
        .status(400)
        .json({ error: "You have already liked this post." });
    }
    await pool.execute("INSERT INTO likes (post_id, user_id) VALUES (?, ?)", [
      postId,
      user_id,
    ]);

    const [likeCount] = await pool.execute(
      "SELECT COUNT(*) AS total_likes FROM likes WHERE post_id = ?",
      [postId]
    );

    console.log("Updated likes count:", likeCount[0].total_likes);

    res.status(201).json({
      message: "Post liked successfully.",
      total_likes: likeCount[0].total_likes,
    });
  } catch (error) {
    console.error("Error liking the post:", error);
    res.status(500).json({ error: "Failed to like the post." });
  }
});

app.post("/login", async (req, res) => {
  const { email, password } = req.body;

  // Validate that both email and password are provided
  if (!email || !password) {
    return res.status(400).json({ error: "Email and password are required." });
  }

  try {
    const [rows] = await pool.execute("SELECT * FROM users WHERE email = ?", [
      email,
    ]);

    if (rows.length === 0) {
      return res.status(404).json({ error: "User not found." });
    }

    const user = rows[0];
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return res.status(401).json({ error: "Invalid password." });
    }

    const token = jwt.sign(
      { userId: user.id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRATION }
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
    console.error("Error during login:", error);
    res.status(500).json({ error: "Server error. Please try again later." });
  }
});

function authenticateToken(req, res, next) {
  const token = req.headers.authorization?.split(" ")[1]; // Extract token from the header

  if (!token) {
    console.error("No token provided.");
    return res.status(401).json({ error: "Access denied. No token provided." });
  }

  jwt.verify(token, process.env.JWT_SECRET, (error, user) => {
    if (error) {
      console.error("Invalid token:", error.message);
      return res.status(403).json({ error: "Invalid token." });
    }

    req.user = user; // Attach decoded token data (e.g., userId) to the request
    next();
  });
}

app.post("/register", async (req, res) => {
  const { username, email, password } = req.body;

  try {
    const hashedPassword = await bcrypt.hash(password, 10);

    await pool.execute(
      "INSERT INTO users (username, email, password) VALUES (?, ?, ?)",
      [username, email, hashedPassword]
    );
    res.status(201).json({ message: "User registered successfully" });
  } catch (error) {
    console.error("Error registering user:", error);
    res.status(500).json({ error: "Failed to register user" });
  }
});

process.on("SIGINT", async () => {
  console.log("SIGINT received: Closing the pool...");
  await pool.end();
  console.log("Database pool closed.");
  process.exit(0);
});

process.on("SIGTERM", async () => {
  console.log("SIGTERM received: Closing the pool...");
  await pool.end();
  console.log("Database pool closed.");
  process.exit(0);
});

app.listen(port, () => {
  console.log(`server is now running on http://localhost:${port}`);
});
