import {
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  setDoc,
} from "firebase/firestore";
import { auth, db } from "../firebaseConfig";

export const savePlace = async (place) => {
  const user = auth.currentUser;

  if (!user) {
    return;
  }

  await setDoc(doc(db, "users", user.uid, "savedPlaces", place.id), place);
};

export const removeSavedPlace = async (placeId) => {
  const user = auth.currentUser;

  if (!user) {
    return;
  }

  await deleteDoc(doc(db, "users", user.uid, "savedPlaces", placeId));
};

export const listenSavedPlaces = (setSavedPlaces) => {
  const user = auth.currentUser;

  if (!user) {
    setSavedPlaces([]);
    return;
  }

  const savedRef = collection(db, "users", user.uid, "savedPlaces");

  return onSnapshot(savedRef, (snapshot) => {
    const data = snapshot.docs.map((doc) => doc.data());
    setSavedPlaces(data);
  });
};
