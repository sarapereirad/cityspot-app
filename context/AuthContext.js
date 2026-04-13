import { createContext, useContext, useEffect, useState } from "react";
import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
} from "firebase/auth";
import { auth, db } from "../firebaseConfig";
import { doc, getDoc, setDoc, updateDoc } from "firebase/firestore";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [initializing, setInitializing] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (authenticatedUser) => {
      setUser(authenticatedUser);

      if (authenticatedUser) {
        const userRef = doc(db, "users", authenticatedUser.uid);
        const userSnap = await getDoc(userRef);

        if (userSnap.exists()) {
          setUserProfile(userSnap.data());
        } else {
          setUserProfile(null);
        }
      } else {
        setUserProfile(null);
      }

      setInitializing(false);
    });

    return unsubscribe;
  }, []);

  const login = async (email, password) => {
    return await signInWithEmailAndPassword(auth, email, password);
  };

  const register = async (email, password) => {
    const userCredential = await createUserWithEmailAndPassword(
      auth,
      email,
      password,
    );

    await setDoc(doc(db, "users", userCredential.user.uid), {
      email,
      firstName: "",
      lastName: "",
      photoUri: "",
      savedPlaces: 3,
      lastSearches: ["Café", "Study", "Restaurant"],
      createdAt: new Date().toISOString(),
    });

    setUserProfile({
      email,
      firstName: "",
      lastName: "",
      photoUri: "",
      savedPlaces: 3,
      lastSearches: ["Café", "Study", "Restaurant"],
      createdAt: new Date().toISOString(),
    });

    return userCredential;
  };

  const logout = async () => {
    return await signOut(auth);
  };

  const updateProfile = async ({ firstName, lastName, photoUri }) => {
    if (!user) return;

    const userRef = doc(db, "users", user.uid);

    const updatedData = {
      firstName,
      lastName,
      photoUri: photoUri || "",
    };

    await updateDoc(userRef, updatedData);

    setUserProfile((prev) => ({
      ...prev,
      ...updatedData,
    }));
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        userProfile,
        initializing,
        login,
        register,
        logout,
        updateProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
