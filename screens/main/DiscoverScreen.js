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
import { Ionicons } from "@expo/vector-icons";
import CategoryButton from "../../components/CategoryButton";
import { getUserLocation } from "../../services/locationService";
import { fetchNearbyPlaces } from "../../services/placeService";

export default function DiscoverScreen({ navigation }) {
  const [nearbyPlaces, setNearbyPlaces] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    loadNearbyPlaces();
  }, []);

  const loadNearbyPlaces = async () => {
    try {
      setLoading(true);
      setErrorMessage("");

      const userLocation = await getUserLocation();
      const results = await fetchNearbyPlaces(
        userLocation.latitude,
        userLocation.longitude,
        1000,
      );

      setNearbyPlaces(results);
    } catch (error) {
      setNearbyPlaces([]);
      setErrorMessage(error.message);
      Alert.alert("Error", error.message);
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
          onPress={() => navigation.navigate("Search")}
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
            style={{ marginVertical: 20 }}
          />
        ) : errorMessage ? (
          <Text style={styles.feedbackText}>{errorMessage}</Text>
        ) : nearbyPlaces.length === 0 ? (
          <Text style={styles.feedbackText}>
            No nearby places found within 1km.
          </Text>
        ) : (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.rowCards}
          >
            {nearbyPlaces.map((place) => (
              <TouchableOpacity
                key={place.id}
                style={styles.smallCard}
                onPress={() => navigation.navigate("Search")}
              >
                <View style={styles.favoriteMini}>
                  <Ionicons name="heart" size={14} color="#000" />
                </View>

                <Image
                  source={{ uri: place.image }}
                  style={styles.smallImage}
                />

                <Text style={styles.smallTitle} numberOfLines={1}>
                  {place.name}
                </Text>
                {place.distance ? (
                  <Text style={styles.smallText}>{place.distance}</Text>
                ) : null}
                {place.category ? (
                  <Text style={styles.smallText}>
                    Category : {place.category}
                  </Text>
                ) : null}
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}

        <Text style={styles.sectionTitle}>Categories</Text>

        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <CategoryButton
            label="Restaurant"
            icon="restaurant"
            onPress={() =>
              navigation.navigate("Search", { category: "Restaurant" })
            }
          />
          <CategoryButton
            label="Study"
            icon="book"
            onPress={() => navigation.navigate("Search", { category: "Study" })}
          />
          <CategoryButton
            label="Café"
            icon="cafe"
            onPress={() => navigation.navigate("Search", { category: "Café" })}
          />
          <CategoryButton
            label="Outdoor"
            icon="leaf"
            onPress={() =>
              navigation.navigate("Search", { category: "Outdoor" })
            }
          />
        </ScrollView>
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
  rowCards: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 22,
  },
  smallCard: {
    backgroundColor: "#D9D9D9",
    borderRadius: 18,
    padding: 10,
    width: 165,
    position: "relative",
  },
  favoriteMini: {
    position: "absolute",
    top: 10,
    right: 10,
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 10,
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
});
