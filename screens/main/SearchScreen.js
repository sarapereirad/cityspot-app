import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import { saveSearch, getSearches } from "../../services/searchService";
import PlaceCard from "../../components/PlaceCard";
import { getUserLocation } from "../../services/locationService";
import {
  listenSavedPlaces,
  removeSavedPlace,
  savePlace,
} from "../../services/savedService";
import {
  fetchPlacesByCategoryNearby,
  fetchPlacesByTextNearby,
} from "../../services/placeService";

export default function SearchScreen(props) {
  const initialCategory = props.route.params?.category || "";

  const [searchText, setSearchText] = useState(initialCategory);
  const [places, setPlaces] = useState([]);
  const [lastSearches, setLastSearches] = useState([]);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [savedPlaces, setSavedPlaces] = useState([]);

  useEffect(() => {
    const unsubscribe = listenSavedPlaces(setSavedPlaces);
    return unsubscribe;
  }, []);

  useEffect(() => {
    loadLastSearches();
  }, []);

  useEffect(() => {
    if (initialCategory) {
      searchCategory(initialCategory);
    }
  }, [initialCategory]);

  const loadLastSearches = async () => {
    const data = await getSearches();
    setLastSearches(data);
  };

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

  const getLocation = async () => {
    const location = await getUserLocation();

    if (!location) {
      Alert.alert("Permission denied", "Location is required.");
      return null;
    }

    return location;
  };

  const searchCategory = async (category) => {
    try {
      setLoading(true);
      setErrorMessage("");
      setSearchText(category);

      const location = await getLocation();

      if (!location) {
        return;
      }

      const data = await fetchPlacesByCategoryNearby({
        category: category,
        latitude: location.latitude,
        longitude: location.longitude,
        radius: 2000,
      });

      setPlaces(data.slice(0, 100));
    } catch (error) {
      setPlaces([]);
      setErrorMessage("Could not load places.");
    } finally {
      setLoading(false);
    }
  };

  const searchPlaces = async (text) => {
    if (!text.trim()) {
      setPlaces([]);
      return;
    }

    try {
      setLoading(true);
      setErrorMessage("");

      await saveSearch(text.trim());
      await loadLastSearches();

      const location = await getLocation();

      if (!location) {
        return;
      }

      const data = await fetchPlacesByTextNearby({
        text: text.trim(),
        latitude: location.latitude,
        longitude: location.longitude,
        radius: 2000,
      });

      setPlaces(data);
    } catch (error) {
      setPlaces([]);
      setErrorMessage("Could not search places.");
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    searchPlaces(searchText);
  };

  const handleLastSearchPress = (text) => {
    setSearchText(text);
    searchPlaces(text);
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
            onChangeText={setSearchText}
            onSubmitEditing={handleSearch}
            returnKeyType="search"
            style={styles.input}
          />
        </View>
      </View>

      {!searchText.trim() && places.length === 0 ? (
        <View style={styles.lastSearchContainer}>
          <Text style={styles.sectionTitle}>Last searches</Text>

          {lastSearches.length === 0 ? (
            <Text style={styles.feedbackText}>No recent searches.</Text>
          ) : (
            lastSearches.map((item, index) => (
              <TouchableOpacity
                key={index}
                style={styles.searchItem}
                onPress={() => handleLastSearchPress(item)}
              >
                <Ionicons name="time-outline" size={18} color="#666" />
                <Text style={styles.searchText}>{item}</Text>
              </TouchableOpacity>
            ))
          )}
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.results}>
          {loading ? (
            <ActivityIndicator
              size="large"
              color="#4F46E5"
              style={styles.loader}
            />
          ) : errorMessage ? (
            <Text style={styles.feedbackText}>{errorMessage}</Text>
          ) : places.length === 0 ? null : (
            places.map((place) => (
              <PlaceCard
                key={place.id}
                place={place}
                isSaved={isPlaceSaved(place.id)}
                onPress={() =>
                  props.navigation.navigate("PlaceDetails", { place: place })
                }
                onFavoritePress={() => toggleSavedPlace(place)}
              />
            ))
          )}
        </ScrollView>
      )}
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
  lastSearchContainer: {
    marginTop: 20,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: "#111",
    marginBottom: 14,
  },
  searchItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F2F2F2",
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 10,
  },
  searchText: {
    marginLeft: 10,
    fontSize: 16,
    color: "#111",
  },
});
