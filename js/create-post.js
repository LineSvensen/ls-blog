import BASE_URL from "./config";

const createPostForm = document.getElementById("create-post-form");
if (createPostForm) {
  createPostForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const formData = new FormData(createPostForm);
    const token = localStorage.getItem("token");
    if (!token) {
      alert("You must log in before creating a post.");
      return;
    }

    try {
      const response = await fetch(`${BASE_URL}/posts`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      if (response.ok) {
        const data = await response.json();
        alert("Post created successfully!");
        console.log("Post created:", data);
      } else {
        const error = await response.json();
        alert(`Error: ${error.error}`);
        console.error("Error creating post:", error);
      }
    } catch (error) {
      alert("An error occurred while creating the post.");
      console.error("Error:", error);
    }
  });
}
