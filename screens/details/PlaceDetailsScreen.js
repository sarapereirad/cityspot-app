import { useEffect, useState } from "react";
import {
  Alert,
  Image,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import * as ImagePicker from "expo-image-picker";
import {
  listenSavedPlaces,
  removeSavedPlace,
  savePlace,
} from "../../services/savedService";
import {
  calculateAverageRating,
  getPlaceRatings,
  savePlaceRating,
} from "../../services/ratingService";
import {
  listenPlacePhotos,
  uploadPlacePhoto,
} from "../../services/galleryService";

export default function PlaceDetailsScreen(props) {
  const place = props.route.params ? props.route.params.place : null;

  const [savedPlaces, setSavedPlaces] = useState([]);
  const [ratings, setRatings] = useState([]);
  const [averageRating, setAverageRating] = useState(0);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedRating, setSelectedRating] = useState(0);
  const [galleryPhotos, setGalleryPhotos] = useState([]);
  const [selectedPhoto, setSelectedPhoto] = useState(null);

  useEffect(() => {
    const unsubscribe = listenSavedPlaces(setSavedPlaces);
    return unsubscribe;
  }, []);

  useEffect(() => {
    if (!place) {
      return;
    }

    const unsubscribe = getPlaceRatings(place.id, setRatings);
    return unsubscribe;
  }, []);

  useEffect(() => {
    if (!place) {
      return;
    }

    const unsubscribe = listenPlacePhotos(place.id, setGalleryPhotos);
    return unsubscribe;
  }, []);

  useEffect(() => {
    setAverageRating(calculateAverageRating(ratings));
  }, [ratings]);

  const isPlaceSaved = () => {
    return savedPlaces.some((item) => item.id === String(place.id));
  };

  const toggleSavedPlace = async () => {
    if (isPlaceSaved()) {
      await removeSavedPlace(place.id);
    } else {
      await savePlace(place);
    }
  };

  const addPhoto = async () => {
    try {
      const permissionResult =
        await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (!permissionResult.granted) {
        Alert.alert(
          "Permission required",
          "You need to allow access to gallery.",
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        allowsEditing: true,
        quality: 0.8,
      });

      if (!result.canceled && result.assets.length > 0) {
        await uploadPlacePhoto(place.id, result.assets[0].uri);
      }
    } catch (error) {
      Alert.alert("Error", "Could not upload photo.");
    }
  };

  const getDescription = () => {
    if (place.description) {
      return place.description;
    }

    if (place.category === "Study") {
      return "This is a quiet place where people can study, work, or relax. It is useful for students or remote workers.";
    }

    if (place.category === "Restaurant") {
      return "This restaurant is a place where people can eat and spend time with friends or family.";
    }

    if (place.category === "Café") {
      return "This café is a nice place to drink coffee, relax, or meet friends.";
    }

    if (place.category === "Shopping") {
      return "This place is a shopping area where you can buy products, explore stores, and enjoy your time.";
    }

    return "This place can be useful to discover and spend time nearby.";
  };

  const handleSendRating = async () => {
    if (selectedRating === 0) {
      Alert.alert("Error", "Choose a rating first");
      return;
    }

    try {
      await savePlaceRating(place.id, selectedRating);
      setModalVisible(false);
      setSelectedRating(0);
    } catch (error) {
      Alert.alert("Error", "Could not save rating");
    }
  };

  const openMap = () => {
    props.navigation.navigate("Tabs", {
      screen: "Map",
      params: { selectedPlace: place },
    });
  };

  if (!place) {
    return (
      <View style={styles.container}>
        <Text>No place data found.</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView>
        <View>
          <Image source={{ uri: place.image }} style={styles.image} />

          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => props.navigation.goBack()}
          >
            <Ionicons name="chevron-back" size={24} color="#fff" />
          </TouchableOpacity>
        </View>

        <View style={styles.content}>
          <View style={styles.header}>
            <Text style={styles.title}>{place.name}</Text>

            <TouchableOpacity
              style={[styles.heart, isPlaceSaved() ? styles.heartSaved : null]}
              onPress={toggleSavedPlace}
            >
              <Ionicons name="heart" size={24} color="#fff" />
            </TouchableOpacity>
          </View>

          <Text style={styles.text}>
            ⭐ {averageRating.toFixed(1)} / 5 ({ratings.length})
          </Text>
          <Text style={styles.text}>
            {place.address && place.address.trim() !== ""
              ? place.address
              : "Address not available"}
          </Text>
          <Text style={styles.text}>{place.distance}</Text>
          <Text style={styles.text}>Category : {place.category}</Text>
          <Text style={styles.text}>
            {place.hours ? place.hours : "Hours not available"}
          </Text>

          <View style={styles.buttons}>
            <TouchableOpacity
              style={styles.btn}
              onPress={() => setModalVisible(true)}
            >
              <Text>Rate</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.btn} onPress={openMap}>
              <Text>Open in Map</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.section}>Description</Text>
          <Text style={styles.desc}>{getDescription()}</Text>

          <View style={styles.galleryHeader}>
            <Text style={styles.section}>Users gallery</Text>

            <TouchableOpacity style={styles.addPhotoBtn} onPress={addPhoto}>
              <Ionicons name="add" size={24} color="#fff" />
            </TouchableOpacity>
          </View>

          <View style={styles.gallery}>
            {galleryPhotos.length === 0 ? (
              <Text style={styles.desc}>No photos yet. Add the first one.</Text>
            ) : (
              galleryPhotos.map((photo) => (
                <TouchableOpacity
                  key={photo.id}
                  style={styles.galleryPhotoBox}
                  onPress={() => setSelectedPhoto(photo.imageUrl)}
                >
                  <Image
                    source={{ uri: photo.imageUrl }}
                    style={styles.galleryPhoto}
                  />
                </TouchableOpacity>
              ))
            )}
          </View>
        </View>
      </ScrollView>

      <Modal visible={selectedPhoto !== null} transparent={true}>
        <View style={styles.photoModalBg}>
          <TouchableOpacity
            style={styles.closePhotoBtn}
            onPress={() => setSelectedPhoto(null)}
          >
            <Ionicons name="close" size={30} color="#fff" />
          </TouchableOpacity>

          {selectedPhoto ? (
            <Image source={{ uri: selectedPhoto }} style={styles.bigPhoto} />
          ) : null}
        </View>
      </Modal>

      <Modal visible={modalVisible} transparent={true}>
        <View style={styles.modalBg}>
          <View style={styles.modalBox}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>RATE THE PLACE</Text>

              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={28} color="#17A9A3" />
              </TouchableOpacity>
            </View>

            <View style={styles.rateRow}>
              {[1, 2, 3, 4, 5].map((num) => (
                <TouchableOpacity
                  key={num}
                  style={[
                    styles.circle,
                    selectedRating === num ? styles.selected : null,
                  ]}
                  onPress={() => setSelectedRating(num)}
                >
                  <Text>{num}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity style={styles.sendBtn} onPress={handleSendRating}>
              <Text>SEND</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  image: {
    width: "100%",
    height: 300,
  },
  backBtn: {
    position: "absolute",
    top: 50,
    left: 20,
    backgroundColor: "#1FB6AD",
    padding: 10,
    borderRadius: 20,
  },
  content: {
    padding: 20,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  title: {
    fontSize: 30,
    fontWeight: "bold",
    flex: 1,
    marginRight: 10,
  },
  heart: {
    backgroundColor: "#4F46E5",
    padding: 10,
    borderRadius: 20,
  },
  heartSaved: {
    backgroundColor: "#111",
  },
  text: {
    fontSize: 16,
    marginTop: 4,
  },
  buttons: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 16,
    marginBottom: 12,
  },
  btn: {
    backgroundColor: "#ddd",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    marginHorizontal: 6,
  },
  section: {
    fontSize: 22,
    marginTop: 15,
    fontWeight: "bold",
  },
  desc: {
    marginTop: 5,
    fontSize: 16,
    lineHeight: 22,
  },
  galleryHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 15,
  },
  addPhotoBtn: {
    backgroundColor: "#4F46E5",
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
  },
  gallery: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginTop: 10,
  },
  galleryPhotoBox: {
    width: "30%",
    height: 90,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: "#111",
    marginRight: 10,
    marginBottom: 10,
    overflow: "hidden",
  },
  galleryPhoto: {
    width: "100%",
    height: "100%",
  },
  photoModalBg: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.95)",
    justifyContent: "center",
    alignItems: "center",
  },
  closePhotoBtn: {
    position: "absolute",
    top: 50,
    right: 25,
    zIndex: 10,
  },
  bigPhoto: {
    width: "100%",
    height: "100%",
    resizeMode: "contain",
  },
  modalBg: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.3)",
  },
  modalBox: {
    width: 260,
    backgroundColor: "#fff",
    padding: 20,
    borderRadius: 10,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  modalTitle: {
    fontWeight: "bold",
    fontSize: 16,
  },
  rateRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 20,
  },
  circle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#ddd",
    justifyContent: "center",
    alignItems: "center",
  },
  selected: {
    backgroundColor: "#17A9A3",
  },
  sendBtn: {
    marginTop: 20,
    alignSelf: "center",
    backgroundColor: "#ddd",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
});
