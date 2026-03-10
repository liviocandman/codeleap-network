import { useState } from "react";
import type { Post } from "../types/post";
import "./DeleteModal.css";

interface EditModalProps {
  post: Post;
  onSave: (title: string, content: string) => void;
  onCancel: () => void;
}

export default function EditModal({ post, onSave, onCancel }: EditModalProps) {
  const [title, setTitle] = useState(post.title);
  const [content, setContent] = useState(post.content);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(title.trim(), content.trim());
  };

  return (
    <div className="modal-overlay" onClick={onCancel}>
      <form
        className="modal"
        onClick={(e) => e.stopPropagation()}
        onSubmit={handleSubmit}
      >
        <h2 className="modal__title">Edit item</h2>

        <label className="modal__label" htmlFor="edit-title">
          Title
        </label>
        <input
          id="edit-title"
          className="modal__input"
          type="text"
          placeholder="Hello world"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />

        <label className="modal__label" htmlFor="edit-content">
          Content
        </label>
        <textarea
          id="edit-content"
          className="modal__textarea"
          placeholder="Content here"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows={4}
        />

        <div className="modal__actions">
          <button
            type="button"
            className="btn btn--outline"
            onClick={onCancel}
          >
            Cancel
          </button>
          <button type="submit" className="btn btn--success">
            Save
          </button>
        </div>
      </form>
    </div>
  );
}
