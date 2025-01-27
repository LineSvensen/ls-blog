import { BASE_URL } from "./config.js";

document
  .getElementById("log-in-form")
  .addEventListener("submit", async (event) => {
    event.preventDefault();
    const emailInput = document.getElementById("email-input").value;
    const passwordInput = document.getElementById("password-input").value;

    try {
      const response = await fetch(`${BASE_URL}/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email: emailInput, password: passwordInput }),
      });

      const data = await response.json();

      if (response.ok) {
        localStorage.setItem("token", data.token);
        window.location.href = "create-post.html";
        console.log("Server Response:", data);
      } else {
        document.getElementById("log-in-status").innerText =
          data.error || "Login failed :O Please try again later";
      }
    } catch (error) {
      console.error("Error connecting to the server:", error);
      document.getElementById("log-in-status").innerText =
        "Error connecting to the server.";
    }
  });
