## CodeLeap Network – Fullstack Challenge

This repository contains a fullstack implementation of the **CodeLeap Network** challenge, built with a **React + Vite + TypeScript** frontend and a **Django REST Framework** backend acting as a BFF (Backend‑for‑Frontend) over the public CodeLeap API, with extra social features (likes and comments).

---

### Features

- **Public feed integration**:  
  - Uses the official `https://dev.codeleap.co.uk/careers/` API for posts (list, create, update, delete).  
  - Infinite scrolling and periodic refresh of the feed using React Query.

- **Authentication & User Identity**:
  - Primary flow via **Firebase Authentication** (email/password, abstracted behind a simple “username” input).
  - Graceful **fallback to localStorage** username when Firebase is misconfigured or unavailable (useful for interview/demo).
  - Backend validates Firebase ID tokens when present and falls back to a header‑based dummy auth (`X-Username`) for local development.

- **Social layer on top of CodeLeap posts**:
  - **Likes**: each authenticated user can like/unlike any post (stored in the backend DB).
  - **Comments**: users can comment on posts; comments are persisted locally and attached to each proxied post.
  - Each post is augmented with:
    - `likes_count`
    - `comments_count`
    - `is_liked_by_me`
    - embedded `comments` list.

- **Modern UX/UI**:
  - Clean, responsive layout.
  - Animated interactions with **Framer Motion** (e.g. like button, comments panel).
  - Modals for editing and deleting posts.

- **Production‑ready deployment setup**:
  - Backend configured for **Render.com** (Python web service + PostgreSQL) using `render.yaml` and `build.sh`.
  - Frontend configured for **Vercel** SPA hosting using `vercel.json` and Vite.

---

### Project Structure

- **`backend/`** – Django REST API (BFF and social features)
  - `config/` – Django project config (settings, urls, WSGI/ASGI).
  - `posts/` – app that proxies CodeLeap API and manages likes/comments:
    - `views.py` – `PostViewSet` implementing:
      - CRUD via HTTP proxy to CodeLeap (`list`, `retrieve`, `create`, `partial_update`, `destroy`).
      - Social actions: `like` (POST/DELETE) and `comments` (GET/POST).
    - `models.py` – `Like` and `Comment` models.
    - `serializers.py` – `CommentSerializer`.
    - `authentication.py` – `FirebaseAuthentication` & `DummyUsernameAuthentication`.
  - `requirements.txt` – Python dependencies.
  - `build.sh` – build script for Render (install deps, collect static, migrate).

- **`frontend/`** – React SPA (Vite + TypeScript)
  - `src/api/posts.ts` – Axios instance and all post/like/comment API calls.
  - `src/context/UserContext.tsx` – global auth/user state (Firebase + localStorage fallback).
  - `src/hooks/usePosts.ts` – React Query hooks (`useInfinitePosts`, `useCreatePost`, `useUpdatePost`, `useDeletePost`, `useLikePost`, `useUnlikePost`, `useAddComment`).
  - `src/components/` – UI components:
    - `Header`, `PostForm`, `PostCard`, `DeleteModal`, `EditModal`.
  - `src/pages/` – top‑level pages:
    - `LoginPage` – username input + login flow.
    - `MainPage` – feed with infinite scroll, post creation, edit/delete, likes and comments.
  - `src/firebase.ts` – Firebase app/auth initialization with environment‑based config and demo defaults.
  - `vite.config.ts`, `tsconfig*.json` – bundler and TS configuration.

---

### Tech Stack

- **Frontend**
  - React 19
  - TypeScript
  - Vite
  - React Router
  - @tanstack/react-query
  - Axios
  - Firebase JS SDK (Auth)
  - Framer Motion
  - react-intersection-observer

- **Backend**
  - Python 3.11
  - Django 4.2
  - Django REST Framework
  - django-cors-headers
  - django-filter
  - firebase-admin
  - gunicorn, whitenoise
  - dj-database-url, psycopg2-binary, python-dotenv, requests

---

### Running the Backend (Django API)

**Prerequisites**
- Python 3.11+
- `pip` (and optionally a virtualenv)

**1. Install dependencies**

```bash
cd backend
pip install -r requirements.txt
```

**2. Environment variables**

Create a `.env` file in `backend/` (optional for local dev; sensible defaults exist) and configure as needed:

```bash
DJANGO_SECRET_KEY=your-dev-secret-key
DJANGO_DEBUG=True
DJANGO_ALLOWED_HOSTS=localhost,127.0.0.1

# Optional: Firebase Admin credentials (for full token verification)
GOOGLE_APPLICATION_CREDENTIALS=/absolute/path/to/service-account.json
```

If `GOOGLE_APPLICATION_CREDENTIALS` is not set, Firebase Admin will try application default credentials and emit a warning, but the app still works with dummy/local auth.

**3. Migrations & DB**

```bash
cd backend
python manage.py migrate
```

By default, local development uses SQLite (`db.sqlite3`). In production (Render), `DATABASE_URL` is injected and parsed by `dj-database-url`.

**4. Run the development server**

```bash
cd backend
python manage.py runserver 0.0.0.0:8000
```

The main API entrypoint for the frontend is:

- `http://localhost:8000/careers/`

---

### Running the Frontend (React + Vite)

**Prerequisites**
- Node.js 18+ (LTS recommended)
- npm (or pnpm/yarn, if you adapt commands)

**1. Install dependencies**

```bash
cd frontend
npm install
```

**2. Environment variables**

Create `frontend/.env` (or `.env.local`) to point to your backend and, optionally, a real Firebase project:

```bash
VITE_API_BASE_URL=http://localhost:8000

# Optional – use real Firebase instead of demo defaults
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_auth_domain
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_bucket
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

If you omit Firebase env vars, the app uses **dummy config** and transparently falls back to localStorage‑only usernames.

**3. Start the dev server**

```bash
cd frontend
npm run dev
```

By default Vite runs on `http://localhost:5173`. Open it in the browser and you should see the login screen.

---

### How Authentication Works

- **Frontend**
  - The user provides a plain username.
  - `UserContext` converts it into a synthetic email (`<sanitized>@codeleapdemo.com`) and tries:
    - `signInWithEmailAndPassword`
    - If that fails with `user-not-found` / `invalid-credential`, it attempts `createUserWithEmailAndPassword`.
    - If Firebase API key is invalid or misconfigured, it logs a warning and falls back to storing the username in `localStorage`.
  - The current Firebase user (if any) is observed via `onAuthStateChanged`; the derived username is kept in context and localStorage.

- **Backend**
  - If a request has `Authorization: Bearer <idToken>`, `FirebaseAuthentication` verifies the token using `firebase-admin`, then creates/gets a matching Django `User`.
  - If no valid token is present but a `X-Username` header exists (injected by the frontend from localStorage), `DummyUsernameAuthentication` creates/gets a simple `User` with that username.

This lets the app function **both with and without a real Firebase project**, which is ideal for code challenges and reviewers.

---

### API Overview (Backend BFF)

Base URL (local): `http://localhost:8000`

- **Posts (proxy to CodeLeap + augmentation)**
  - `GET /careers/`  
    - Query params: `limit`, `offset`  
    - Returns paginated posts from CodeLeap with extra fields:
      - `likes_count`, `comments_count`, `is_liked_by_me`, `comments`.
  - `GET /careers/<id>/`
  - `POST /careers/` – create a post (expects `username`, `title`, `content`).
  - `PATCH /careers/<id>/` – update a post.
  - `DELETE /careers/<id>/` – delete a post.

- **Likes**
  - `POST /careers/<id>/like/` – like a post (auth required).
  - `DELETE /careers/<id>/like/` – unlike a post (auth required).

- **Comments**
  - `GET /careers/<id>/comments/` – list comments for a post.
  - `POST /careers/<id>/comments/` – create comment (`content`), auth required.

All of the above are consumed by the React app via `src/api/posts.ts`.

---

### Frontend Behaviour Summary

- **Login Page**
  - Asks only for a username.
  - On submit:
    - Runs the login flow via `useUser()`.
    - Redirects to `/feed` when successful.

- **Main Feed**
  - Shows a header with a logout button.
  - Displays a “What’s on your mind?” form to create posts.
  - Lists posts with:
    - Title, content, author, relative time (`timeAgo` utility).
    - Edit/Delete actions only for the owner of the post.
    - Like button + count, Comment button + count.
  - Comments panel:
    - Slide‑down section listing existing comments (with highlighting for `@mentions`).
    - Input to add new comment.
  - Infinite scroll:
    - Uses `react-intersection-observer` + React Query `useInfiniteQuery`.
    - Also periodically refetches every 15s to keep the feed up to date.

---

### Deployment Notes

- **Backend (Render)**
  - Defined as a Python web service in `render.yaml`:
    - `rootDir: backend`
    - `buildCommand: ./build.sh`
    - `startCommand: gunicorn config.wsgi:application`
  - Uses a managed PostgreSQL instance (`codeleap-db`) with `DATABASE_URL` injected automatically.
  - Sets environment variables such as `DJANGO_SECRET_KEY`, `DJANGO_DEBUG=False`, `DJANGO_ALLOWED_HOSTS`, and `PYTHON_VERSION`.

- **Frontend (Vercel)**
  - A simple SPA deploy:
    - `npm run build` (default Vite build).
    - `vercel.json` rewrites all routes to `/index.html` to support React Router.
  - Needs `VITE_API_BASE_URL` set to the Render backend URL (e.g. `https://codeleap-backend.onrender.com`).

---

### Development Tips

- When running locally:
  - Start **backend first** at `http://localhost:8000`.
  - Then start **frontend** and ensure `VITE_API_BASE_URL` matches.
- To test without Firebase:
  - Do **not** configure real Firebase env vars.
  - Use any username; it will be stored purely in localStorage and sent as `X-Username`.
- For admin access to DB data (likes/comments/users):
  - Create a superuser:
    ```bash
    cd backend
    python manage.py createsuperuser
    python manage.py runserver
    ```
  - Then visit `http://localhost:8000/admin/`.

---

### Possible Improvements (Future Work)

- Add unit/integration tests for:
  - BFF proxy behaviour and error handling.
  - Like/comment endpoints and permissions.
  - React hooks/components (e.g. via React Testing Library).
- Add optimistic UI updates for likes/comments to reduce perceived latency.
- Improve error surfaces and toasts on the frontend.
- Add paging controls / “Load more” fallback when intersection observer is not available.

