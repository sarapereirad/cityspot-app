// Firebase Firestore documentation:
// https://firebase.google.com/docs/firestore
import {
  addDoc,
  collection,
  onSnapshot,
  query,
  where,
} from "firebase/firestore";
import { db } from "../firebaseConfig";

export const savePlaceRating = async (placeId, rating) => {
  if (!placeId || !rating) {
    return;
  }

  await addDoc(collection(db, "ratings"), {
    placeId: placeId,
    rating: rating,
    createdAt: new Date().toISOString(),
  });
};

export const getPlaceRatings = (placeId, setRatings) => {
  if (!placeId) {
    setRatings([]);
    return () => {};
  }
  const q = query(collection(db, "ratings"), where("placeId", "==", placeId));

  return onSnapshot(q, (snapshot) => {
    const data = snapshot.docs.map((doc) => doc.data().rating);
    setRatings(data);
  });
};

export const calculateAverageRating = (ratings) => {
  if (ratings.length === 0) {
    return 0;
  }

  const sum = ratings.reduce((total, item) => total + item, 0);
  return Number((sum / ratings.length).toFixed(1));
};
