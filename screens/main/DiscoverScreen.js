import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import CategoryButton from "../../components/CategoryButton";
import { getUserLocation } from "../../services/locationService";
import { fetchNearbyPlaces } from "../../services/placeService";
import {
  listenSavedPlaces,
  removeSavedPlace,
  savePlace,
} from "../../services/savedService";

export default function DiscoverScreen(props) {
  const [nearbyPlaces, setNearbyPlaces] = useState([]);
  const [savedPlaces, setSavedPlaces] = useState([]);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    loadNearbyPlaces();
  }, []);

  useEffect(() => {
    const unsubscribe = listenSavedPlaces(setSavedPlaces);
    return unsubscribe;
  }, []);

  const isPlaceSaved = (placeId) => {
    return savedPlaces.some((place) => place.id === String(placeId));
  };

  const toggleSavedPlace = async (place) => {
    if (isPlaceSaved(place.id)) {
      await removeSavedPlace(place.id);
    } else {
      await savePlace(place);
    }
  };

  const loadNearbyPlaces = async () => {
    try {
      setLoading(true);
      setErrorMessage("");

      const location = await getUserLocation();

      if (!location) {
        Alert.alert("Permission denied", "Location is required.");
        return;
      }

      const data = await fetchNearbyPlaces(
        location.latitude,
        location.longitude,
        1000,
      );

      setNearbyPlaces(data);
    } catch (error) {
      setNearbyPlaces([]);
      setErrorMessage("Could not load nearby places.");
      Alert.alert("Error", "Could not load nearby places.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.hero}>
        <Text style={styles.heroTitle}>Find friendly spots</Text>
      </View>

      <View style={styles.content}>
        <TouchableOpacity
          style={styles.searchBar}
          onPress={() => props.navigation.navigate("Search")}
        >
          <Ionicons name="search" size={20} color="#333" />

          <Text style={styles.searchPlaceholder}>
            Search cafés, places or addresses
          </Text>

          <Ionicons name="arrow-forward" size={18} color="#111" />
        </TouchableOpacity>

        <Text style={styles.sectionTitle}>Nearby places</Text>

        {loading ? (
          <ActivityIndicator
            size="large"
            color="#4F46E5"
            style={styles.loader}
          />
        ) : errorMessage ? (
          <Text style={styles.feedbackText}>{errorMessage}</Text>
        ) : nearbyPlaces.length === 0 ? (
          <Text style={styles.feedbackText}>
            No nearby places found within 1 km.
          </Text>
        ) : (
          <ScrollView
            horizontal={true}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.rowCards}
          >
            {nearbyPlaces.map((place) => (
              <TouchableOpacity
                key={place.id}
                style={styles.smallCard}
                onPress={() =>
                  props.navigation.navigate("PlaceDetails", { place: place })
                }
              >
                <Image
                  source={{ uri: place.image }}
                  style={styles.smallImage}
                />

                <TouchableOpacity
                  style={[
                    styles.favoriteMini,
                    isPlaceSaved(place.id) ? styles.favoriteMiniSaved : null,
                  ]}
                  onPress={() => toggleSavedPlace(place)}
                >
                  <Ionicons name="heart" size={16} color="#fff" />
                </TouchableOpacity>

                <Text style={styles.smallTitle} numberOfLines={1}>
                  {place.name}
                </Text>

                {place.distance ? (
                  <Text style={styles.smallText}>{place.distance}</Text>
                ) : null}

                {place.category ? (
                  <Text style={styles.smallText}>
                    Category: {place.category}
                  </Text>
                ) : null}
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}

        <Text style={styles.sectionTitle}>Categories</Text>

        <View style={styles.categoriesContainer}>
          <CategoryButton
            label="Restaurant"
            icon="restaurant"
            onPress={() =>
              props.navigation.navigate("Search", { category: "Restaurant" })
            }
          />

          <CategoryButton
            label="Study"
            icon="book"
            onPress={() =>
              props.navigation.navigate("Search", { category: "Study" })
            }
          />

          <CategoryButton
            label="Café"
            icon="cafe"
            onPress={() =>
              props.navigation.navigate("Search", { category: "Café" })
            }
          />

          <CategoryButton
            label="Leisure"
            icon="happy"
            onPress={() =>
              props.navigation.navigate("Search", { category: "Leisure" })
            }
          />
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  hero: {
    backgroundColor: "#000",
    height: 210,
    paddingHorizontal: 24,
    paddingTop: 70,
  },
  heroTitle: {
    color: "#fff",
    fontSize: 34,
    fontWeight: "800",
    width: "80%",
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 20,
    marginTop: -10,
    backgroundColor: "#fff",
  },
  searchBar: {
    height: 52,
    borderRadius: 26,
    backgroundColor: "#fff",
    borderWidth: 1.5,
    borderColor: "#111",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  searchPlaceholder: {
    flex: 1,
    color: "#666",
    fontSize: 14,
    marginLeft: 8,
  },
  sectionTitle: {
    fontSize: 28,
    fontWeight: "700",
    color: "#111",
    marginBottom: 14,
    marginTop: 10,
  },
  loader: {
    marginVertical: 20,
  },
  rowCards: {
    flexDirection: "row",
    marginBottom: 22,
  },
  smallCard: {
    backgroundColor: "#D9D9D9",
    borderRadius: 18,
    padding: 10,
    width: 165,
    position: "relative",
    marginRight: 12,
  },
  favoriteMini: {
    position: "absolute",
    top: 16,
    right: 16,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#4F46E5",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 10,
  },
  favoriteMiniSaved: {
    backgroundColor: "#111",
  },
  smallImage: {
    width: "100%",
    height: 95,
    borderRadius: 16,
    marginBottom: 8,
  },
  smallTitle: {
    fontWeight: "700",
    fontSize: 18,
    color: "#111",
  },
  smallText: {
    fontSize: 14,
    color: "#444",
    marginTop: 2,
  },
  feedbackText: {
    color: "#666",
    fontSize: 15,
    marginBottom: 22,
  },
  categoriesContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
});
