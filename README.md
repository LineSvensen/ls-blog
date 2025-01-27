# LS Blog

Welcome to this repo! This is my first fullstack project. I made a blog for myself where i can create posts about my developer-journey and share advice. Visitors can read posts. The plan is to have full CRUD (its coming).

Theres some additional/unused code in this project, in case i want to scale up the blog (platforms, multiple users and admins).

The user experience and overall design will be more improved soon.

---

## Features

- **User Authentication**: Admin login for secure post creation.
- **Post Creation**: Upload title, content and image.
- **Responsive Design**: Styled using Tailwind CSS for all screen sizes over 360px.
- **Dynamic Content**: Posts are fetched and displayed dynamically from a MySQL database.
- **Environment Variables**: Securely manage database and JWT configurations.

---

## Project Structure

```
ls-blog/
│
├── css/
│   ├── style.css           # Source CSS for Tailwind
|
|
├── dist/
│       └── output.css      # Compiled Tailwind CSS
│
├── js/
│   ├── config.js           # Configuration for BASE_URL
│   ├── create-post.js      # Logic for creating new posts
│   ├── index.js            # Backend server logic
│   ├── login.js            # Admin login functionality
│   └── script.js           # Dynamic post fetching and rendering
│
├── uploads/                # Directory for uploaded images
│
├── index.html              # Homepage
├── login.html              # Admin login page
├── create-post.html        # Post creation page for admins
├── .env                    # Environment variables (JWT keys, DB credentials)
├── README.md               # Project documentation
└── tailwind.config.js      # Tailwind CSS configuration
```

## Prerequisites

- Node.js and npm installed.
- MySQL database configured.
- Tailwind CSS installed.

---

## Installation

1. Clone the repository:

   ```bash
   git clone https://github.com/your-repo-name/ls-blog.git
   cd ls-blog

   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Set up your environment variables: Create a .env file in the root directory with the following keys:

   ```
   JWT_SECRET=your_jwt_secret
   JWT_EXPIRATION=1d
   DB_HOST=your_database_host
   DB_USER=your_database_user
   DB_PASSWORD=your_database_password
   DB_NAME=your_database_name
   DB_PORT=your_database_port

   ```

4. Hash existing plaintext passwords in the database:

   ```
   node hashPasswordFolder/hashPasswords.js

   ```

5. Usage

Start the Development Server

```
npm run dev
```

The server will start at http://localhost:5005.

Build Tailwind CSS

```
npm run build:css
```

This will compile style.css into dist/output.css

## Deployment

Vercel (Frontend):

- Deploy the frontend using Vercel.
- Update the BASE_URL in config.js to your Render backend URL.

Render (Backend):

- Deploy the backend to Render.
- Add your .env variables in Render's "Environment" settings.

---

## Routes

#### Backend API

- GET /posts: Fetch all posts.
- POST /posts: Create a new post (requires admin token).
- POST /login: Admin login.
- GET /users: Fetch all users.

---

## Admin Login

- Use /login.html to log in as an admin or click on "Admin" link at the top.
- On successful login, you will be redirected to the create-post.html page to create posts.

## Technologies

- Frontend: HTML, Tailwind CSS, JavaScript
- Backend: Node.js, Express.js
- Database: MySQL
- Authentication: JWT
- File Upload: Multer

## Troubleshooting

CORS Issues:
Ensure your cors middleware is configured with the correct origin URLs.
Database Connection:

Check your .env file for correct MySQL credentials.
Build Errors:

If build:css fails, ensure Tailwind CSS is installed and configured properly.

## Future Improvements

- More options when creating posts, more images etc.
- Be able to update and delete posts.
- Add a pagination system for posts.
- Implement search.
- Categories and public archive.
- Better overall UX and design.
- Loader.
- Comments section, like and share.

## Author

Line Svensen

### License

This project is licensed under the ISC License.
