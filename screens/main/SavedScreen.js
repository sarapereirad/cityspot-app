import { useEffect, useState } from "react";
import {
  ActivityIndicator,
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

export default function SavedScreen(props) {
  const [savedPlaces, setSavedPlaces] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = listenSavedPlaces((data) => {
      setSavedPlaces(data);
      setLoading(false);
    });

    return unsubscribe;
  }, []);

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
