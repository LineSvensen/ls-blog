document.getElementById("submit-button").addEventListener("submit" => {
    const thePasswordInput = getElementById("password-input").value;
    const theEmailInput = getElementById("email-input").value;

    function sendToSever() , async => {

    }
    try {
        if thePasswordInput {

        } else {

        }
        return[];
    } catch (error) {
        console.error
    }
    

}

async function updatePlainTextPasswords() {
    try {
      const [users] = await connection.query("SELECT id, password FROM users");
  
      for (const user of users) {
        const hashedPassword = await bcrypt.hash(user.password, 10);
  
        // Update the user's password with the hashed version
        await connection.execute(
          "UPDATE users SET password = ? WHERE id = ?",
          [hashedPassword, user.id]
        );
      }
  
      console.log("Passwords updated successfully!");
    } catch (error) {
      console.error("Error updating passwords:", error);
    }
};
  
updatePlainTextPasswords();
  