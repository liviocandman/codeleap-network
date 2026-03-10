import { useState, useEffect } from "react";
import { Navigate } from "react-router-dom";
import { useInView } from "react-intersection-observer";
import { useUser } from "../context/UserContext";
import { useInfinitePosts, useUpdatePost, useDeletePost } from "../hooks/usePosts";
import type { Post } from "../types/post";
import Header from "../components/Header";
import PostForm from "../components/PostForm";
import PostCard from "../components/PostCard";
import DeleteModal from "../components/DeleteModal";
import EditModal from "../components/EditModal";
import "./MainPage.css";

export default function MainPage() {
  const { username, loading, logout } = useUser();
  const {
    data,
    isLoading: postsLoading,
    isError,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage
  } = useInfinitePosts();

  const updatePost = useUpdatePost();
  const deletePostMutation = useDeletePost();

  const { ref, inView } = useInView();

  const [editingPost, setEditingPost] = useState<Post | null>(null);
  const [deletingPost, setDeletingPost] = useState<Post | null>(null);

  useEffect(() => {
    if (inView && hasNextPage) {
      fetchNextPage();
    }
  }, [inView, hasNextPage, fetchNextPage]);

  if (loading) return <div className="main-page">Loading session...</div>;

  // Redirect to login if no username
  if (!username) {
    return <Navigate to="/" replace />;
  }

  const handleEdit = (post: Post) => setEditingPost(post);
  const handleDelete = (post: Post) => setDeletingPost(post);

  const handleEditSave = (title: string, content: string) => {
    if (!editingPost) return;
    updatePost.mutate(
      { id: editingPost.id, data: { title, content } },
      { onSuccess: () => setEditingPost(null) }
    );
  };

  const handleDeleteConfirm = () => {
    if (!deletingPost) return;
    deletePostMutation.mutate(deletingPost.id, {
      onSuccess: () => setDeletingPost(null),
    });
  };

  return (
    <div className="main-page">
      <div className="main-page__container">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#7695EC', borderTopLeftRadius: '16px', borderTopRightRadius: '16px', paddingRight: '24px' }}>
          <Header />
          <button onClick={() => logout()} style={{ backgroundColor: 'transparent', border: '1px solid white', color: 'white', padding: '6px 12px', borderRadius: '4px', cursor: 'pointer', fontWeight: 700 }}>Logout</button>
        </div>
        <div className="main-page__content">
          <PostForm />

          {postsLoading && (
            <p className="main-page__status">Loading posts...</p>
          )}
          {isError && (
            <p className="main-page__status main-page__status--error">
              Failed to load posts. Is the server running?
            </p>
          )}

          {data?.pages.map((page, i) => (
            <div key={i}>
              {page.results.map((post: Post) => (
                <PostCard
                  key={post.id}
                  post={post}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                />
              ))}
            </div>
          ))}

          <div ref={ref} style={{ height: "20px" }} />
          {isFetchingNextPage && <p className="main-page__status">Loading more posts...</p>}

          {data && data.pages[0].results.length === 0 && !postsLoading && (
            <p className="main-page__status">
              No posts yet. Be the first to share something!
            </p>
          )}
        </div>
      </div>

      {deletingPost && (
        <DeleteModal
          onConfirm={handleDeleteConfirm}
          onCancel={() => setDeletingPost(null)}
        />
      )}

      {editingPost && (
        <EditModal
          post={editingPost}
          onSave={handleEditSave}
          onCancel={() => setEditingPost(null)}
        />
      )}
    </div>
  );
}
