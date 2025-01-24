import bcrypt from "bcrypt";
import mysql from "mysql2/promise";
import "dotenv/config";

(async () => {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT,
  });
  const [users] = await connection.query(
    "SELECT id, password FROM users WHERE password NOT LIKE '$2b$%'"
  );
  for (const user of users) {
    const hashedPassword = await bcrypt.hash(user.password, 10);
    await connection.execute("UPDATE users SET password = ? WHERE id = ?", [
      hashedPassword,
      user.id,
    ]);
    console.log(`Updated password for user ID: ${user.id}`);
  }
  console.log("All plaintext passwords have been hashed.");
  connection.end();
})();
