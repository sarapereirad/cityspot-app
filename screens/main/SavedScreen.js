import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import PlaceCard from "../../components/PlaceCard";
import {
  listenSavedPlaces,
  removeSavedPlace,
} from "../../services/savedService";
import { getUserLocation } from "../../services/locationService";

export default function SavedScreen(props) {
  const [savedPlaces, setSavedPlaces] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = listenSavedPlaces((data) => {
      updateSavedPlacesDistance(data);
    });

    return unsubscribe;
  }, []);

  const toRadians = (degrees) => {
    return degrees * (Math.PI / 180);
  };

  const getDistanceInMeters = (lat1, lon1, lat2, lon2) => {
    const earthRadius = 6371000;
    const dLat = toRadians(lat2 - lat1);
    const dLon = toRadians(lon2 - lon1);

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(toRadians(lat1)) *
        Math.cos(toRadians(lat2)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return Math.round(earthRadius * c);
  };

  const formatDistance = (meters) => {
    if (meters < 1000) {
      return meters + "m away";
    }

    return (meters / 1000).toFixed(1) + "km away";
  };

  const updateSavedPlacesDistance = async (data) => {
    try {
      const location = await getUserLocation();

      if (!location) {
        setSavedPlaces(data);
        setLoading(false);
        return;
      }

      const updatedData = data.map((place) => {
        if (!place.lat || !place.lng) {
          return place;
        }

        const distanceInMeters = getDistanceInMeters(
          location.latitude,
          location.longitude,
          place.lat,
          place.lng,
        );

        return {
          ...place,
          distance: formatDistance(distanceInMeters),
          distanceInMeters: distanceInMeters,
        };
      });

      setSavedPlaces(updatedData);
    } catch (error) {
      Alert.alert("Error", "Could not update saved places distance.");
      setSavedPlaces(data);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Saved places</Text>

      {loading ? (
        <ActivityIndicator size="large" color="#4F46E5" />
      ) : savedPlaces.length === 0 ? (
        <Text style={styles.emptyText}>No saved places yet.</Text>
      ) : (
        <ScrollView contentContainerStyle={styles.list}>
          {savedPlaces.map((place) => (
            <PlaceCard
              key={place.id}
              place={place}
              isSaved={true}
              onPress={() =>
                props.navigation.navigate("PlaceDetails", { place: place })
              }
              onFavoritePress={() => removeSavedPlace(place.id)}
            />
          ))}
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
  title: {
    fontSize: 28,
    fontWeight: "800",
    color: "#111",
    marginBottom: 20,
  },
  list: {
    paddingBottom: 24,
  },
  emptyText: {
    fontSize: 16,
    color: "#666",
  },
});
