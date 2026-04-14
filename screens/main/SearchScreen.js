import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import PlaceCard from "../../components/PlaceCard";
import { places } from "../../data/places";
import { getUserLocation } from "../../services/locationService";
import { fetchPlacesByCategoryNearby } from "../../services/placeService";

export default function SearchScreen(props) {
  const initialCategory = props.route.params?.category || "";
  const [searchText, setSearchText] = useState(initialCategory);
  const [allPlaces, setAllPlaces] = useState(places);
  const [filteredPlaces, setFilteredPlaces] = useState(places);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    if (initialCategory.trim()) {
      loadCategoryPlaces(initialCategory);
    } else {
      setAllPlaces(places);
      setFilteredPlaces(places);
      setSearchText("");
    }
  }, [initialCategory]);

  const loadCategoryPlaces = async (category) => {
    try {
      setLoading(true);
      setErrorMessage("");
      setSearchText(category);

      const location = await getUserLocation();

      if (!location) {
        Alert.alert("Permission denied", "Location is required.");
        return;
      }
      const data = await fetchPlacesByCategoryNearby({
        category: category,
        latitude: location.latitude,
        longitude: location.longitude,
        radius: 1500,
      });

      setAllPlaces(data);
      setFilteredPlaces(data);
    } catch (error) {
      setAllPlaces([]);
      setFilteredPlaces([]);
      setErrorMessage("Could not load places.");
    } finally {
      setLoading(false);
    }
  };

  const filterPlaces = (text) => {
    setSearchText(text);

    if (!text.trim()) {
      setFilteredPlaces(allPlaces);
      return;
    }

    const filtered = allPlaces.filter((place) => {
      const value = text.toLowerCase();

      return (
        place.name.toLowerCase().includes(value) ||
        (place.category && place.category.toLowerCase().includes(value)) ||
        (place.address && place.address.toLowerCase().includes(value))
      );
    });

    setFilteredPlaces(filtered);
  };

  return (
    <View style={styles.container}>
      <View style={styles.topRow}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => props.navigation.goBack()}
        >
          <Ionicons name="chevron-back" size={24} color="#fff" />
        </TouchableOpacity>

        <View style={styles.searchInputWrapper}>
          <Ionicons name="search" size={18} color="#444" />
          <TextInput
            placeholder="Search places"
            value={searchText}
            onChangeText={filterPlaces}
            style={styles.input}
          />
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.results}>
        {loading ? (
          <ActivityIndicator
            size="large"
            color="#4F46E5"
            style={styles.loader}
          />
        ) : errorMessage ? (
          <Text style={styles.feedbackText}>{errorMessage}</Text>
        ) : filteredPlaces.length === 0 ? (
          <Text style={styles.feedbackText}>No places found.</Text>
        ) : (
          filteredPlaces.map((place) => (
            <PlaceCard
              key={place.id}
              place={place}
              onPress={() => {}}
              onFavoritePress={() => {}}
            />
          ))
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    paddingTop: 60,
    paddingHorizontal: 18,
  },
  topRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 18,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#44D3C2",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
  },
  searchInputWrapper: {
    flex: 1,
    height: 52,
    borderRadius: 26,
    backgroundColor: "#fff",
    borderWidth: 1.5,
    borderColor: "#111",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
  },
  input: {
    flex: 1,
    marginLeft: 8,
    fontSize: 15,
  },
  results: {
    paddingBottom: 24,
  },
  loader: {
    marginTop: 20,
  },
  feedbackText: {
    color: "#666",
    fontSize: 15,
    marginTop: 8,
  },
});
