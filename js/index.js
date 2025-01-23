import jwt from "jsonwebtoken";
import "dotenv/config";
import express from "express";
import cors from "cors";
import mysql from "mysql2/promise";
import multer from "multer";
import path from "path";

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
    await connectToDataBase(); // Ensure connection
    const [posts] = await connection.query(`
            SELECT posts.*, users.username AS publisher_name
            FROM posts
            JOIN users ON posts.user_id = users.id
            ORDER BY posts.created_at DESC
        `);
    res.json({
      result: posts,
    });
  } catch (error) {
    res.status(500).send("error fetching /posts");
    console.log("error fetching /posts");
    console.error("Error fetching /posts:", error);
    console.log(posts);
  }
});

app.post("/posts", upload.single("image"), async (req, res) => {
  const { title, content, users_id } = req.body; // Extract post details
  const imagePath = req.file ? `/uploads/${req.file.filename}` : null; // Save file path

  try {
    const [result] = await connection.query(
      "INSERT INTO posts (title, content, users_id, image_path) VALUES (?, ?, ?, ?)",
      [title, content, users_id, imagePath]
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

app.listen(port, () => {
  console.log(`server is now running on http://localhost:${port}`);
});
