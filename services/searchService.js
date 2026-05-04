import { doc, getDoc, updateDoc } from "firebase/firestore";
import { auth, db } from "../firebaseConfig";

export const saveSearch = async (text) => {
  try {
    const user = auth.currentUser;

    if (!user || !text.trim()) {
      return;
    }

    const userRef = doc(db, "users", user.uid);
    const userSnapshot = await getDoc(userRef);

    const userData = userSnapshot.data();
    let searches = userData?.lastSearches || [];

    searches = searches.filter((item) => item !== text);
    searches.unshift(text);
    searches = searches.slice(0, 3);

    await updateDoc(userRef, {
      lastSearches: searches,
    });
  } catch (error) {}
};

export const getSearches = async () => {
  try {
    const user = auth.currentUser;

    if (!user) {
      return [];
    }

    const userRef = doc(db, "users", user.uid);
    const userSnapshot = await getDoc(userRef);

    const userData = userSnapshot.data();
    return userData?.lastSearches || [];
  } catch (error) {
    return [];
  }
};
