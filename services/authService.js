import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
} from "firebase/auth";
import { doc, getDoc, setDoc, updateDoc } from "firebase/firestore";
import { auth, db } from "../firebaseConfig";

export const loginUser = async (email, password) => {
  return await signInWithEmailAndPassword(auth, email, password);
};

export const registerUser = async (email, password) => {
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
    lastSearches: [],
    createdAt: new Date().toISOString(),
  });

  return userCredential;
};

export const logoutUser = async () => {
  return await signOut(auth);
};

export const getUserProfile = async (uid) => {
  const docRef = doc(db, "users", uid);
  const docSnap = await getDoc(docRef);

  if (docSnap.exists()) {
    return docSnap.data();
  } else {
    return null;
  }
};

export const updateUserProfile = async (uid, profileData) => {
  const docRef = doc(db, "users", uid);
  await updateDoc(docRef, profileData);
};
