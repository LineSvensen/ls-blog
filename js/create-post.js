const createPostForm = document.getElementById("create-post-form"); // Target the specific form

if (createPostForm) {
  createPostForm.addEventListener("submit", async (event) => {
    event.preventDefault(); // Prevent the default form submission

    const formData = new FormData(createPostForm); // Collect form data
    const token = localStorage.getItem("token"); // Get the user's token from localStorage

    try {
      const response = await fetch("https://ls-blog.onrender.com/posts", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`, // Attach the token in the Authorization header
        },
        body: formData, // Send form data
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
