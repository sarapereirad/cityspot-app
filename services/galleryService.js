import {
  addDoc,
  collection,
  onSnapshot,
  orderBy,
  query,
} from "firebase/firestore";
import { getDownloadURL, ref, uploadBytes } from "firebase/storage";
import { auth, db, storage } from "../firebaseConfig";

export const uploadPlacePhoto = async (placeId, imageUri) => {
  const user = auth.currentUser;

  if (!user || !placeId || !imageUri) {
    return;
  }

  const response = await fetch(imageUri);
  const blob = await response.blob();

  const photoName = new Date().getTime().toString();
  const storageRef = ref(
    storage,
    "placeGalleries/" + String(placeId) + "/" + photoName,
  );

  await uploadBytes(storageRef, blob);

  const downloadUrl = await getDownloadURL(storageRef);

  await addDoc(collection(db, "placeGalleries", String(placeId), "photos"), {
    imageUrl: downloadUrl,
    userId: user.uid,
    createdAt: new Date().toISOString(),
  });
};

export const listenPlacePhotos = (placeId, setPhotos) => {
  if (!placeId) {
    setPhotos([]);
    return () => {};
  }

  const photosRef = collection(db, "placeGalleries", String(placeId), "photos");
  const photosQuery = query(photosRef, orderBy("createdAt", "desc"));

  return onSnapshot(photosQuery, (snapshot) => {
    const data = snapshot.docs.map((item) => ({
      id: item.id,
      ...item.data(),
    }));

    setPhotos(data);
  });
};
