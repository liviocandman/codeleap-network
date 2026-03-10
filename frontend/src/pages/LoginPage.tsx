import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useUser } from "../context/UserContext";
import "./LoginPage.css";

export default function LoginPage() {
  const [input, setInput] = useState("");
  const { login, username, loading } = useUser();
  const navigate = useNavigate();

  // Redirect if already logged in via Firebase
  useEffect(() => {
    if (username && !loading) {
      navigate("/feed");
    }
  }, [username, loading, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    try {
      await login(input.trim());
      navigate("/feed");
    } catch (err) {
      console.error(err);
      alert("Error logging in");
    }
  };

  if (loading) return <div className="login-page">Loading...</div>;

  return (
    <div className="login-page">
      <form className="login-card" onSubmit={handleSubmit}>
        <h1 className="login-card__title">Welcome to CodeLeap network!</h1>

        <label className="login-card__label" htmlFor="username-input">
          Please enter your username
        </label>
        <input
          id="username-input"
          className="login-card__input"
          type="text"
          placeholder="John doe"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          autoFocus
        />

        <div className="login-card__actions">
          <button
            type="submit"
            className="btn btn--primary"
            disabled={!input.trim()}
          >
            ENTER
          </button>
        </div>
      </form>
    </div>
  );
}
