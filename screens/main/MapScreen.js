import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Animated,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import MapView, { Marker } from "react-native-maps";
import { getUserLocation } from "../../services/locationService";
import { fetchPlacesForMapNearby } from "../../services/placeService";

export default function MapScreen(props) {
  const mapRef = useRef(null);
  const markerScale = useRef(new Animated.Value(1)).current;

  const [region, setRegion] = useState(null);
  const [places, setPlaces] = useState([]);
  const [selectedPlace, setSelectedPlace] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadMapData();
  }, []);

  useEffect(() => {
    if (props.route.params?.selectedPlace) {
      selectPlace(props.route.params.selectedPlace);
    }
  }, [props.route.params]);

  const animateMarker = () => {
    markerScale.setValue(0.8);

    Animated.spring(markerScale, {
      toValue: 1,
      friction: 3,
      useNativeDriver: true,
    }).start();
  };

  const selectPlace = (place) => {
    setSelectedPlace(place);
    animateMarker();

    const newRegion = {
      latitude: place.lat,
      longitude: place.lng,
      latitudeDelta: 0.008,
      longitudeDelta: 0.008,
    };

    setRegion(newRegion);

    if (mapRef.current) {
      mapRef.current.animateToRegion(newRegion, 800);
    }
  };

  const loadMapData = async () => {
    try {
      setLoading(true);

      const location = await getUserLocation();

      if (!location) {
        Alert.alert("Permission denied", "Location is required.");
        return;
      }

      const newRegion = {
        latitude: location.latitude,
        longitude: location.longitude,
        latitudeDelta: 0.02,
        longitudeDelta: 0.02,
      };

      setRegion(newRegion);

      const data = await fetchPlacesForMapNearby(
        location.latitude,
        location.longitude,
        2000,
      );

      setPlaces(data);
    } catch (error) {
      Alert.alert("Error", "Could not load map data.");
    } finally {
      setLoading(false);
    }
  };

  const handleLocateMe = async () => {
    try {
      const location = await getUserLocation();

      if (!location) {
        Alert.alert("Permission denied", "Location is required.");
        return;
      }

      const newRegion = {
        latitude: location.latitude,
        longitude: location.longitude,
        latitudeDelta: 0.02,
        longitudeDelta: 0.02,
      };

      setRegion(newRegion);
      setSelectedPlace(null);

      if (mapRef.current) {
        mapRef.current.animateToRegion(newRegion, 800);
      }
    } catch (error) {
      Alert.alert("Error", "Could not get current location.");
    }
  };

  const getMarkerColor = (category) => {
    if (category === "Restaurant") return "orange";
    if (category === "Study") return "blue";
    if (category === "Café") return "purple";
    return "green";
  };

  if (loading || !region) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color="#4F46E5" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Map</Text>
        <Text style={styles.subtitle}>Discover nearby places</Text>
      </View>

      <View style={styles.mapContainer}>
        <MapView ref={mapRef} style={styles.map} region={region}>
          <Marker
            coordinate={{
              latitude: region.latitude,
              longitude: region.longitude,
            }}
            title="You are here"
          >
            <View style={styles.userMarker}>
              <Ionicons name="person" size={16} color="#fff" />
            </View>
          </Marker>

          {places.map((place) => (
            <Marker
              key={place.id}
              coordinate={{
                latitude: place.lat,
                longitude: place.lng,
              }}
              title={place.name}
              pinColor={getMarkerColor(place.category)}
              onPress={() => selectPlace(place)}
            />
          ))}

          {selectedPlace ? (
            <Marker
              coordinate={{
                latitude: selectedPlace.lat,
                longitude: selectedPlace.lng,
              }}
            >
              <Animated.View
                style={[
                  styles.selectedMarker,
                  { transform: [{ scale: markerScale }] },
                ]}
              >
                <Ionicons name="location" size={34} color="#fff" />
              </Animated.View>
            </Marker>
          ) : null}
        </MapView>

        <TouchableOpacity style={styles.locateButton} onPress={handleLocateMe}>
          <Text style={styles.locateText}>Locate me</Text>
          <Ionicons name="navigate" size={16} color="#fff" />
        </TouchableOpacity>
      </View>

      {selectedPlace && selectedPlace.name ? (
        <View style={styles.infoCard}>
          <Image source={{ uri: selectedPlace.image }} style={styles.image} />

          <View style={styles.info}>
            <Text style={styles.placeName}>{selectedPlace.name}</Text>

            <Text style={styles.placeText}>
              📍{" "}
              {selectedPlace.address && selectedPlace.address.trim() !== ""
                ? selectedPlace.address
                : "Address not available"}
            </Text>

            <Text style={styles.placeText}>{selectedPlace.distance || ""}</Text>

            <Text style={styles.placeText}>
              Category: {selectedPlace.category}
            </Text>

            <Text style={styles.placeText}>
              {selectedPlace.hours
                ? selectedPlace.hours
                : "Hours not available"}
            </Text>

            <TouchableOpacity
              style={styles.detailsButton}
              onPress={() =>
                props.navigation.navigate("PlaceDetails", {
                  place: selectedPlace,
                })
              }
            >
              <Text style={styles.detailsButtonText}>View Details</Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  loaderContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  header: {
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 10,
  },
  title: {
    fontSize: 30,
    fontWeight: "700",
  },
  subtitle: {
    fontSize: 14,
    color: "#666",
    marginTop: 4,
  },
  mapContainer: {
    flex: 1,
  },
  map: {
    width: "100%",
    height: "100%",
  },
  locateButton: {
    position: "absolute",
    top: 20,
    left: 20,
    backgroundColor: "#000",
    borderRadius: 24,
    paddingHorizontal: 14,
    paddingVertical: 10,
    flexDirection: "row",
    alignItems: "center",
  },
  locateText: {
    color: "#fff",
    fontWeight: "600",
    marginRight: 8,
  },
  userMarker: {
    backgroundColor: "#000",
    padding: 8,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: "#fff",
  },
  selectedMarker: {
    backgroundColor: "#4F46E5",
    padding: 12,
    borderRadius: 30,
    borderWidth: 4,
    borderColor: "#fff",
  },
  infoCard: {
    position: "absolute",
    left: 20,
    right: 20,
    bottom: 20,
    backgroundColor: "#ECECEC",
    borderRadius: 24,
    padding: 14,
    flexDirection: "row",
  },
  image: {
    width: 90,
    height: 90,
    borderRadius: 16,
    marginRight: 12,
  },
  info: {
    flex: 1,
  },
  placeName: {
    fontSize: 22,
    fontWeight: "700",
  },
  placeText: {
    fontSize: 14,
    marginTop: 2,
  },
  detailsButton: {
    marginTop: 10,
    backgroundColor: "#D3D3D8",
    borderRadius: 20,
    paddingVertical: 10,
    alignItems: "center",
  },
  detailsButtonText: {
    fontWeight: "600",
  },
});
