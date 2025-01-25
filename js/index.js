
import "dotenv/config";
import express from "express";
import cors from "cors";
import mysql from "mysql2/promise";
import multer from "multer";
import path from "path";
import bcrypt from "bcrypt";

// import jwt from "jsonwebtoken";

const app = express();

const port = process.env.PORT || 5005;

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/");
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, file.fieldname + "-" + uniqueSuffix + ext);
  },
});

const upload = multer({ storage });

app.use(cors());

app.use(express.json());
app.use("/uploads", express.static("uploads"));

let connection;
async function connectToDataBase() {
  try {
    if (!connection || connection.state === "disconnected") {
      connection = await mysql.createConnection({
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME,
        port: process.env.DB_PORT,
        connectTimeout: 20000,
      });
      console.log("Connected to the database!");
    }
  } catch (error) {
    console.error("Failed to connect to the database:", error.message);
    throw error; // Rethrow the error
  }
}

connectToDataBase();

console.log("Connection state:", connection?.state);

app.get("/users", async (req, res) => {
  try {
    const [result, fields] = await connection.query("SELECT * FROM users");
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
      const [result] = await connection.execute(
        "SELECT * FROM users WHERE id = ?",
        [id]
      );
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

app.get("/posts", async (req, res) => {
  try {
    const [posts] = await connection.query(`
        SELECT posts.*, 
               users.username AS publisher_name, 
               COUNT(likes.id) AS total_likes
        FROM posts
        LEFT JOIN likes ON posts.id = likes.post_id
        JOIN users ON posts.user_id = users.id
        GROUP BY posts.id
        ORDER BY posts.created_at DESC
      `);

    res.json({
      result: posts,
    });
  } catch (error) {
    res.status(500).send("Error fetching /posts");
    console.error("Error fetching /posts:", error);
  }
});

app.post("/posts", upload.single("image"), async (req, res) => {
  const { title, content, user_id } = req.body; // Extract post details
  const imagePath = req.file ? `/uploads/${req.file.filename}` : null; // Save file path

  try {
    const [result] = await connection.query(
      "INSERT INTO posts (title, content, user_id, image_path) VALUES (?, ?, ?, ?)",
      [title, content, user_id, imagePath]
    );
    res.json({
      message: "The post was created successfully!",
      postId: result.insertId,
    });
  } catch (error) {
    console.error("Error saving post:", error.message);
    res.status(500).json({ error: "Failed to create post.." });
  }
});

// when user click on likebutton, send 1 like to the post id in server, then store it, then update total likes for that id post,
// then save it.

// "INSERT INTO posts (likes) VALUES (?)",
// [likes]

// app.get("/likes", async (req, res) => {

// });

app.post("/posts/:id/like", async (req, res) => {
  const postId = req.params.id;
  const { user_id } = req.body;

  try {
    // Attempt to insert a new like
    await connection.execute(
      "INSERT INTO likes (post_id, user_id) VALUES (?, ?)",
      [postId, user_id]
    );

    res.status(201).json({ message: "Post liked successfully" });
  } catch (error) {
    // Handle duplicate likes
    if (error.code === "ER_DUP_ENTRY") {
      res.status(400).json({ error: "You have already liked this post" });
    } else {
      console.error("Error liking the post:", error);
      res.status(500).json({ error: "Failed to like the post" });
    }
  }
});

app.post("/posts/:id/unlike", async (req, res) => {
  const postId = req.params.id;
  const { user_id } = req.body;

  try {
    const [result] = await connection.execute(
      "DELETE FROM likes WHERE post_id = ? AND user_id = ?",
      [postId, user_id]
    );

    if (result.affectedRows > 0) {
      res.status(200).json({ message: "Post unliked successfully" });
    } else {
      res.status(404).json({ error: "Like not found" });
    }
  } catch (error) {
    console.error("Error unliking the post:", error);
    res.status(500).json({ error: "Failed to unlike the post" });
  }
});

app.post("/login", async (req, res) => {
  const { email, password } = req.body;

  try {
    // Find the user by email
    const [rows] = await connection.execute(
      "SELECT * FROM users WHERE email = ?",
      [email]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: "User not found." });
    }

    const user = rows[0];

    // Compare the provided password with the stored hashed password
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return res.status(401).json({ error: "Invalid password." });
    }

    // If successful, return a success message or a session token
    res.status(200).json({ message: "Login successful!", userId: user.id });
  } catch (error) {
    console.error("Error during login:", error);
    res.status(500).json({ error: "Server error. Please try again later." });
  }
});

app.post("/register", async (req, res) => {
  const { username, email, password } = req.body;

  try {
    // Hash the password before storing it
    const hashedPassword = await bcrypt.hash(password, 10);

    // Store the hashed password in the database
    await connection.execute(
      "INSERT INTO users (username, email, password) VALUES (?, ?, ?)",
      [username, email, hashedPassword]
    );

    res.status(201).json({ message: "User registered successfully" });
  } catch (error) {
    console.error("Error registering user:", error);
    res.status(500).json({ error: "Failed to register user" });
  }
});

app.listen(port, () => {
  console.log(`server is now running on http://localhost:${port}`);
});
