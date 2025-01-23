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
};

function displayPosts(singlePosts) {
  const postsDiv = document.getElementById("posts");
  singlePosts.forEach((postContainer) => {
    const postHtmlContent = `
        <div>
            <h2>${postContainer.title}</h2>
            <p>${postContainer.content}</p>
            <p>By: ${postContainer.publisher_name}</p>
            ${
              postContainer.image_path
                ? `<img src="http://localhost:5005${postContainer.image_path}" alt="${postContainer.title}" />`
                : ""
            }
        </div>
      `;
    postsDiv.innerHTML += postHtmlContent;
  });
};

fetchPosts();

async function loadPostsInRightOrder() {
  const waitOnFetchPosts = await fetchPosts();
  displayPosts(waitOnFetchPosts);
};

loadPostsInRightOrder();
