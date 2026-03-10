import { useState } from "react";
import type { Post } from "../types/post";
import { useUser } from "../context/UserContext";
import { useLikePost, useUnlikePost, useAddComment } from "../hooks/usePosts";
import { timeAgo } from "../utils/timeAgo";
import { FaHeart, FaRegHeart, FaRegComment } from "react-icons/fa";
import { motion, AnimatePresence } from "framer-motion";
import "./PostCard.css";

interface PostCardProps {
  post: Post;
  onEdit: (post: Post) => void;
  onDelete: (post: Post) => void;
}

export default function PostCard({ post, onEdit, onDelete }: PostCardProps) {
  const { username } = useUser();
  const isOwner = username === post.username;

  const likeMutation = useLikePost();
  const unlikeMutation = useUnlikePost();
  const addCommentMutation = useAddComment();

  const [showComments, setShowComments] = useState(false);
  const [commentInput, setCommentInput] = useState("");

  const handleLikeToggle = () => {
    if (post.is_liked_by_me) {
      unlikeMutation.mutate(post.id);
    } else {
      likeMutation.mutate(post.id);
    }
  };

  const handleCommentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentInput.trim()) return;
    addCommentMutation.mutate({ id: post.id, content: commentInput.trim() }, {
      onSuccess: () => setCommentInput("")
    });
  };

  const renderContentWithMentions = (text: string) => {
    return text.split(/(@\w+)/g).map((part, i) =>
      part.startsWith("@") ? <strong key={i} style={{ color: "#7695EC" }}>{part}</strong> : part
    );
  };

  return (
    <motion.article
      className="post-card"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.3 }}
    >
      <div className="post-card__header">
        <h3 className="post-card__title">{post.title}</h3>
        {isOwner && (
          <div className="post-card__actions">
            <button
              className="post-card__icon-btn"
              onClick={() => onDelete(post)}
              aria-label="Delete post"
              title="Delete"
            >
              <svg width="20" height="24" viewBox="0 0 20 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M1.5 5.5H18.5" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M6.5 5.5V3.5C6.5 2.39543 7.39543 1.5 8.5 1.5H11.5C12.6046 1.5 13.5 2.39543 13.5 3.5V5.5" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M3.5 5.5L4.5 20.5C4.5 21.6046 5.39543 22.5 6.5 22.5H13.5C14.6046 22.5 15.5 21.6046 15.5 20.5L16.5 5.5" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M8.5 10.5V17.5" stroke="white" strokeWidth="1.8" strokeLinecap="round" />
                <path d="M11.5 10.5V17.5" stroke="white" strokeWidth="1.8" strokeLinecap="round" />
              </svg>
            </button>
            <button
              className="post-card__icon-btn"
              onClick={() => onEdit(post)}
              aria-label="Edit post"
              title="Edit"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M14.06 2.94a1.5 1.5 0 0 1 2.12 0l4.88 4.88a1.5 1.5 0 0 1 0 2.12L9.12 21.88A1.5 1.5 0 0 1 8.06 22.5H3.5A1.5 1.5 0 0 1 2 21V16.44a1.5 1.5 0 0 1 .44-1.06L14.06 2.94Z" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M12 5L19 12" stroke="white" strokeWidth="1.8" strokeLinecap="round" />
              </svg>
            </button>
          </div>
        )}
      </div>
      <div className="post-card__body">
        <div className="post-card__meta">
          <span className="post-card__username">@{post.username}</span>
          <span className="post-card__time">{timeAgo(post.created_datetime)}</span>
        </div>
        <p className="post-card__content">{post.content}</p>


        <div className="post-card__footer">
          <button className="post-card__action-btn" onClick={handleLikeToggle}>
            <motion.div whileHover={{ scale: 1.2 }} whileTap={{ scale: 0.9 }}>
              {post.is_liked_by_me ? <FaHeart color="#e0245e" size={20} /> : <FaRegHeart size={20} />}
            </motion.div>
            <span>{post.likes_count || 0}</span>
          </button>
          <button className="post-card__action-btn" onClick={() => setShowComments(!showComments)}>
            <motion.div whileHover={{ scale: 1.2 }} whileTap={{ scale: 0.9 }}>
              <FaRegComment size={20} />
            </motion.div>
            <span>{post.comments_count || 0}</span>
          </button>
        </div>

        <AnimatePresence>
          {showComments && (
            <motion.div
              className="post-card__comments-section"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              style={{ overflow: "hidden" }}
            >
              <h4 style={{ margin: "16px 0 8px", fontSize: "16px", color: "#777" }}>Comments</h4>
              {/* The PostSerializer natively embeds the comments in post.comments */}
              {(post as any).comments?.map((comment: any) => (
                <div key={comment.id} style={{ padding: "8px 0", borderBottom: "1px solid #eee" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
                    <strong style={{ fontSize: "14px", color: "#7695EC" }}>@{comment.username}</strong>
                    <span style={{ fontSize: "12px", color: "#999" }}>{timeAgo(comment.created_datetime)}</span>
                  </div>
                  <p style={{ margin: 0, fontSize: "14px", color: "#333" }}>{renderContentWithMentions(comment.content)}</p>
                </div>
              ))}

              <form onSubmit={handleCommentSubmit} style={{ marginTop: "16px", display: "flex", gap: "8px" }}>
                <input
                  type="text"
                  placeholder="Write a comment..."
                  value={commentInput}
                  onChange={(e) => setCommentInput(e.target.value)}
                  style={{ flex: 1, padding: "8px", borderRadius: "8px", border: "1px solid #777" }}
                />
                <button
                  type="submit"
                  disabled={!commentInput.trim() || addCommentMutation.isPending}
                  style={{ padding: "8px 16px", backgroundColor: "#7695EC", color: "white", border: "none", borderRadius: "8px", cursor: "pointer", fontWeight: "bold" }}
                >
                  Post
                </button>
              </form>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.article>
  );
}
