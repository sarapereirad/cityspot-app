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

  if (!user || !place) {
    return;
  }

  await setDoc(doc(db, "users", user.uid, "savedPlaces", String(place.id)), {
    ...place,
    id: String(place.id),
    createdAt: new Date().toISOString(),
  });
};

export const removeSavedPlace = async (placeId) => {
  const user = auth.currentUser;

  if (!user) {
    return;
  }

  await deleteDoc(doc(db, "users", user.uid, "savedPlaces", String(placeId)));
};

export const listenSavedPlaces = (setSavedPlaces) => {
  const user = auth.currentUser;

  if (!user) {
    setSavedPlaces([]);
    return () => {};
  }

  const savedRef = collection(db, "users", user.uid, "savedPlaces");

  return onSnapshot(savedRef, (snapshot) => {
    const data = snapshot.docs.map((item) => ({
      id: item.id,
      ...item.data(),
    }));

    setSavedPlaces(data);
  });
};
