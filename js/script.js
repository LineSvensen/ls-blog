async function fetchPosts() {
  try {
    const response = await fetch("http://localhost:5005/posts");
    const data = await response.json(); // Fetch the entire response object
    const posts = data.result; // Extract the posts array from the result property
    return posts;
  } catch (error) {
    console.error(
      "There was an error with fetching post with fetchPost",
      error
    );
    return [];
  }
}

function displayPosts(singlePosts) {
  const postsDiv = document.getElementById("posts");
  singlePosts.forEach((postContainer) => {
    const postHtmlContent = `
          <div>
              <h2>${postContainer.title}</h2>
              <p>${postContainer.content}</p>
              <p>By: ${postContainer.publisher_name}</p>
              <p>Likes: ${postContainer.total_likes}</p>
              ${
                postContainer.image_path
                  ? `<img src="http://localhost:5005${postContainer.image_path}" alt="${postContainer.title}" />`
                  : ""
              }
              <button onclick="likePost(${postContainer.id})">Like</button>
          </div>
        `;
    postsDiv.innerHTML += postHtmlContent;
  });
}

fetchPosts();

async function likePost(postId) {
  const user_id = localStorage.getItem("user_id");

  try {
    const response = await fetch(`http://localhost:5005/posts/${postId}/like`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ user_id }),
    });

    if (response.ok) {
      console.log("Post liked successfully!");
      // Optionally update the UI to reflect the like
    } else {
      console.error("Failed to like the post.");
    }
  } catch (error) {
    console.error("Error liking the post:", error);
  }
}

if (!localStorage.getItem("user_id")) {
  localStorage.setItem("user_id", `anon-${Date.now()}-${Math.random()}`);
}
const user_id = localStorage.getItem("user_id");

// Attach the function to the global scope
window.likePost = likePost;

async function loadPostsInRightOrder() {
  const waitOnFetchPosts = await fetchPosts();
  displayPosts(waitOnFetchPosts);
}

loadPostsInRightOrder();
