import { BASE_URL } from "./config.js";

if (!localStorage.getItem("visitor_id")) {
  localStorage.setItem("visitor_id", `visitor-${Date.now()}-${Math.random()}`);
}

const visitor_id = localStorage.getItem("visitor_id");
console.log("Visitor ID:", visitor_id);

document.addEventListener("DOMContentLoaded", () => {
  async function fetchPosts() {
    const token = localStorage.getItem("token");

    try {
      const response = await fetch(`${BASE_URL}/posts`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Server error: ${response.statusText}`);
      }

      const data = await response.json();
      return data.result || [];
    } catch (error) {
      console.error("Error fetching posts:", error.message);
      return [];
    }
  }

  function displayPosts(singlePosts) {
    const postsDiv = document.getElementById("posts");

    if (!postsDiv) {
      console.error("Element with id 'posts' is missing in the DOM.");
      return;
    }
    postsDiv.innerHTML = "";
    singlePosts.forEach((postContainer) => {
      const postDiv = document.createElement("div");
      postDiv.className =
        "flex flex-col justify-center items-center w-[360px] md:w-[500px] lg:w-[1000px] p-4 bg-white shadow-md rounded-lg mb-6";

      postDiv.innerHTML = `
        <div class="flex flex-row p-4 text-gray-600">
          <p class="px-2 text-sm">Av: ${postContainer.publisher_name}</p>
          <p class="px-2 text-sm">Publisert: ${new Date(
            postContainer.created_at
          ).toLocaleDateString("no-NO", {
            year: "numeric",
            month: "long",
            day: "numeric",
          })}</p>
        </div>
        <h2 class="text-xl font-bold mb-2">${postContainer.title}</h2>
        <p class="text-gray-700 mb-4">${postContainer.content}</p>
        ${
          postContainer.image_path
            ? `<img src="${BASE_URL}${postContainer.image_path}" class="w-[500px] h-auto rounded-md object-cover mb-4" alt="${postContainer.title}" />`
            : ""
        }
      `;
      postsDiv.appendChild(postDiv);
    });
  }

  async function loadPostsInRightOrder() {
    const posts = await fetchPosts();
    displayPosts(posts);
  }

  loadPostsInRightOrder();

  const copyrightElement = document.getElementById("copyright-year");

  if (copyrightElement) {
    copyrightElement.textContent = new Date().getFullYear();
  } else {
    console.error("Element with id 'copyright-year' is missing in the DOM.");
  }
});
