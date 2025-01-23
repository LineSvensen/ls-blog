async function fetchPosts() {
  const response = await fetch("http://localhost:5005/posts");
  const data = await response.json(); // Fetch the entire response object
  const posts = data.result; // Extract the posts array from the result property

  const postsDiv = document.getElementById("posts");
  posts.forEach((post) => {
    const postHtml = `
        <div>
          <h2>${post.title}</h2>
          <p>${post.content}</p>
          <p>By: ${post.publisher_name}</p>
          ${
            post.image_path
              ? `<img src="http://localhost:5005${post.image_path}" alt="${post.title}" />`
              : ""
          }
        </div>
      `;
    postsDiv.innerHTML += postHtml;
  });
}

fetchPosts();
