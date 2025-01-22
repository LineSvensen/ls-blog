import jwt from "jsonwebtoken";
import "dotenv/config";
import express from "express";
import cors from "cors";
import mysql from "mysql2/promise";

// dotenv.config();

const app = express();

const port = process.env.PORT || 5005;

app.use(cors());
app.use(express.json());

async function connectToDatabase() {
  try {
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      port: process.env.DB_PORT,
      connectTimeout: 20000,
    });

    console.log("Connected to the database!");
    connection.end();
  } catch (error) {
    console.log("Oh no! Something went wrong with the database connection:");
    console.log("Code:", error.code);
    console.log("Message:", error.message);
  }
}

connectToDatabase();

app.listen(port, () => {
  console.log(`server is now running on http://localhost:${port}`);
});
