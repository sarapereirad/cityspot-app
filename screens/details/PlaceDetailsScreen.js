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

export default function PlaceDetailsScreen(props) {
  const place = props.route.params ? props.route.params.place : null;

  const [savedPlaces, setSavedPlaces] = useState([]);
  const [ratings, setRatings] = useState([]);
  const [averageRating, setAverageRating] = useState(0);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedRating, setSelectedRating] = useState(0);

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
    setAverageRating(calculateAverageRating(ratings));
  }, [ratings]);

  const isPlaceSaved = () => {
    return savedPlaces.some((item) => item.id === place.id);
  };

  const toggleSavedPlace = async () => {
    if (isPlaceSaved()) {
      await removeSavedPlace(place.id);
    } else {
      await savePlace(place);
    }
  };

  const getDescription = () => {
    if (place.description) {
      return place.description;
    }

    if (place.category === "Study") {
      return "This is a quiet place where people can study, work, or relax. It can be useful for students or remote workers.";
    }

    if (place.category === "Restaurant") {
      return "This restaurant is a place where people can eat and spend time with friends or family. It can be useful when looking for food nearby.";
    }

    if (place.category === "Café") {
      return "This café is a nice place to drink coffee, relax, or work for a short time. It can also be useful for meeting friends.";
    }

    return "This outdoor place can be useful for walking, relaxing, or spending time outside. It is a good option when looking for fresh air nearby.";
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
          <Text style={styles.text}>{place.address}</Text>
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

          <Text style={styles.section}>Gallery</Text>

          <View style={styles.gallery}>
            <Image source={{ uri: place.image }} style={styles.smallImg} />
            <Image source={{ uri: place.image }} style={styles.smallImg} />
            <Image source={{ uri: place.image }} style={styles.smallImg} />
          </View>
        </View>
      </ScrollView>

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
  gallery: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 10,
  },
  smallImg: {
    width: "30%",
    height: 90,
    borderRadius: 10,
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
