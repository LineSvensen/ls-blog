import { BASE_URL } from "./config.js";

async function fetchPosts() {
  try {
    const response = await fetch(`${BASE_URL}/posts`);
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
          <div class="flex flex-col justify-center items-center w-[360px] md:w-[360] lg:w-[500px] p-4 bg-white shadow-md rounded-lg mb-6">
              <p>By: ${postContainer.publisher_name}</p>
              <h2 class="text-xl font-bold mb-2">${postContainer.title}</h2>
              <p class="text-gray-700 mb-4">${postContainer.content}</p>
              
              ${
                postContainer.image_path
                  ? `<img src="${BASE_URL}${postContainer.image_path}" class="w-full h-auto rounded-md object-cover mb-4" alt="${postContainer.title}" />`
                  : ""
              }
              <div class="flex flex-row">
                <button onclick="likePost(${
                  postContainer.id
                })" class="p-4">Like</button>
                <p class="p-4">Likes: ${postContainer.total_likes}</p>
              </div>  
          </div>
        `;
    postsDiv.innerHTML += postHtmlContent;
  });
}

fetchPosts();

async function likePost(postId) {
  const user_id = localStorage.getItem("user_id");

  try {
    const response = await fetch(`${BASE_URL}/posts/${postId}/like`, {
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

document.getElementById("copyright-year").textContent =
  new Date().getFullYear();
