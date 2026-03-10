import { useState } from "react";
import { useUser } from "../context/UserContext";
import { useCreatePost } from "../hooks/usePosts";
import type { PostCreate } from "../types/post";
import "./PostForm.css";

export default function PostForm() {
  const { username } = useUser();
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const createPost = useCreatePost();

  const isDisabled = !title.trim() || !content.trim();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isDisabled) return;

    const payload: PostCreate = { username, title: title.trim(), content: content.trim() };

    createPost.mutate(payload, {
      onSuccess: () => {
        setTitle("");
        setContent("");
      },
    });
  };

  return (
    <form className="post-form" onSubmit={handleSubmit}>
      <h2 className="post-form__title">What's on your mind?</h2>

      <label className="post-form__label" htmlFor="post-title">
        Title
      </label>
      <input
        id="post-title"
        className="post-form__input"
        type="text"
        placeholder="Hello world"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
      />

      <label className="post-form__label" htmlFor="post-content">
        Content
      </label>
      <textarea
        id="post-content"
        className="post-form__textarea"
        placeholder="Content here"
        value={content}
        onChange={(e) => setContent(e.target.value)}
        rows={4}
      />

      <div className="post-form__actions">
        <button
          type="submit"
          className="btn btn--primary"
          disabled={isDisabled}
        >
          Create
        </button>
      </div>
    </form>
  );
}
