import { createContext, useContext, useState, useEffect, type ReactNode } from "react";
import { onAuthStateChanged, User, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut } from "firebase/auth";
import { auth } from "../firebase";

interface UserContextValue {
  username: string;
  firebaseUser: User | null;
  loading: boolean;
  login: (email: string) => Promise<void>;
  logout: () => Promise<void>;
}

const UserContext = createContext<UserContextValue | null>(null);

export function UserProvider({ children }: { children: ReactNode }) {
  const [firebaseUser, setFirebaseUser] = useState<User | null>(null);
  const [username, setUsername] = useState<string>("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check localStorage fallback first
    const savedUsername = localStorage.getItem("codeleap_username");

    // Attempt Firebase
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setFirebaseUser(user);
      if (user && user.email) {
        const extracted = user.email.split("@")[0];
        setUsername(extracted);
        localStorage.setItem("codeleap_username", extracted);
      } else if (savedUsername) {
        setUsername(savedUsername);
      } else {
        setUsername("");
      }
      setLoading(false);
    }, (error) => {
      console.warn("Firebase config error, falling back to localStorage", error);
      if (savedUsername) {
        setUsername(savedUsername);
      }
      setLoading(false);
    });

    // If Firebase itself failed to init properly, safety timeout
    const fallbackTimer = setTimeout(() => {
      if (loading) {
        if (savedUsername) setUsername(savedUsername);
        setLoading(false);
      }
    }, 2000);

    return () => {
      unsubscribe();
      clearTimeout(fallbackTimer);
    };
  }, []);

  const login = async (inputName: string) => {
    const email = `${inputName.toLowerCase().replace(/[^a-z0-9]/g, '')}@codeleapdemo.com`;
    const password = "dummyPassword123!";
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (error: any) {
      if (error.code === 'auth/user-not-found' || error.code === 'auth/invalid-credential') {
        try {
          await createUserWithEmailAndPassword(auth, email, password);
        } catch (createErr: any) {
          if (createErr.code?.includes('api-key')) {
            // Fallback
            localStorage.setItem("codeleap_username", inputName);
            setUsername(inputName);
          } else {
            throw createErr;
          }
        }
      } else if (error.code?.includes('api-key')) {
        console.warn("Dummy Firebase Key detected. Falling back to local username storage.");
        localStorage.setItem("codeleap_username", inputName);
        setUsername(inputName);
      } else {
        console.error("Firebase Login Error", error);
        throw error;
      }
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
    } catch (e) {
      console.warn("Ignoring signout error", e);
    }
    localStorage.removeItem("codeleap_username");
    setUsername("");
    setFirebaseUser(null);
  };

  return (
    <UserContext.Provider value={{ username, firebaseUser, loading, login, logout }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error("useUser must be used within a UserProvider");
  }
  return context;
}
