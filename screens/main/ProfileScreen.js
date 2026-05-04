import { useCallback, useEffect, useState } from "react";
import {
  Alert,
  Image,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import * as ImagePicker from "expo-image-picker";
import { useFocusEffect } from "@react-navigation/native";

import { auth } from "../../firebaseConfig";
import {
  getUserProfile,
  logoutUser,
  updateUserProfile,
} from "../../services/authService";
import { listenSavedPlaces } from "../../services/savedService";
import { getSearches } from "../../services/searchService";

export default function ProfileScreen() {
  const [profile, setProfile] = useState(null);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [photoUri, setPhotoUri] = useState("");
  const [editing, setEditing] = useState(false);
  const [savedPlaces, setSavedPlaces] = useState([]);
  const [lastSearches, setLastSearches] = useState([]);

  useEffect(() => {
    loadProfile();

    const unsubscribe = listenSavedPlaces(setSavedPlaces);
    return unsubscribe;
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadLastSearches();
    }, []),
  );

  const loadProfile = async () => {
    try {
      if (!auth.currentUser) return;

      const userData = await getUserProfile(auth.currentUser.uid);
      setProfile(userData);

      if (userData) {
        setFirstName(userData.firstName || "");
        setLastName(userData.lastName || "");
        setPhotoUri(userData.photoUri || "");
      }
    } catch (error) {
      Alert.alert("Error", "Could not load profile.");
    }
  };

  const loadLastSearches = async () => {
    const data = await getSearches();
    setLastSearches(data);
  };

  const pickImage = async () => {
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
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets.length > 0) {
      setPhotoUri(result.assets[0].uri);
    }
  };

  const handleSave = async () => {
    try {
      if (!auth.currentUser) return;

      await updateUserProfile(auth.currentUser.uid, {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        photoUri,
      });

      setEditing(false);
      await loadProfile();
      Alert.alert("Success", "Profile updated.");
    } catch (error) {
      Alert.alert("Error", "Could not save profile.");
    }
  };

  const handleLogout = async () => {
    try {
      await logoutUser();
    } catch (error) {
      Alert.alert("Error", "Could not log out.");
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Profile</Text>

      <View style={styles.card}>
        <TouchableOpacity
          style={styles.editIcon}
          onPress={() => setEditing(!editing)}
        >
          <Ionicons name="create" size={22} color="#4F46E5" />
        </TouchableOpacity>

        <View style={styles.avatarWrapper}>
          {photoUri ? (
            <Image source={{ uri: photoUri }} style={styles.avatarImage} />
          ) : (
            <Ionicons name="person-circle" size={100} color="#CFCFD6" />
          )}

          {editing && (
            <TouchableOpacity style={styles.photoButton} onPress={pickImage}>
              <Text style={styles.photoButtonText}>Choose photo</Text>
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.fieldRow}>
          <Text style={styles.label}>Name :</Text>

          {editing ? (
            <TextInput
              style={styles.input}
              placeholder="Name to enter"
              value={firstName}
              onChangeText={setFirstName}
            />
          ) : (
            <Text style={styles.value}>
              {firstName ? firstName : "Name to enter"}
            </Text>
          )}
        </View>

        <View style={styles.fieldRow}>
          <Text style={styles.label}>Surname :</Text>

          {editing ? (
            <TextInput
              style={styles.input}
              placeholder="Surname to enter"
              value={lastName}
              onChangeText={setLastName}
            />
          ) : (
            <Text style={styles.value}>
              {lastName ? lastName : "Surname to enter"}
            </Text>
          )}
        </View>

        <View style={styles.fieldRow}>
          <Text style={styles.label}>Email :</Text>
          <Text style={styles.value}>{auth.currentUser?.email}</Text>
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.infoTitle}>
          Saved Places : {savedPlaces.length}
        </Text>

        <Text style={[styles.infoTitle, { marginTop: 20 }]}>
          Last searches :
        </Text>

        {lastSearches.length === 0 ? (
          <Text style={styles.listText}>No recent searches.</Text>
        ) : (
          lastSearches.slice(0, 3).map((item, index) => (
            <Text key={index} style={styles.listText}>
              - {item}
            </Text>
          ))
        )}
      </View>

      {editing ? (
        <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
          <Text style={styles.buttonText}>Save</Text>
        </TouchableOpacity>
      ) : (
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Text style={styles.buttonText}>Log out</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    paddingHorizontal: 20,
    paddingTop: 60,
  },
  title: {
    fontSize: 34,
    fontWeight: "800",
    color: "#111",
    marginBottom: 18,
  },
  card: {
    backgroundColor: "#ECECEC",
    borderRadius: 24,
    padding: 18,
    marginBottom: 18,
    position: "relative",
  },
  editIcon: {
    position: "absolute",
    right: 18,
    top: 18,
    zIndex: 10,
  },
  avatarWrapper: {
    alignItems: "center",
    marginBottom: 16,
    marginTop: 6,
  },
  avatarImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  photoButton: {
    marginTop: 10,
    backgroundColor: "#D7D7DD",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
  },
  photoButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#111",
  },
  fieldRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 18,
    flexWrap: "wrap",
  },
  label: {
    fontSize: 18,
    fontWeight: "700",
    color: "#111",
    marginRight: 6,
  },
  value: {
    fontSize: 18,
    color: "#111",
  },
  input: {
    flex: 1,
    minWidth: 180,
    backgroundColor: "#fff",
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: "#D3D3D3",
    fontSize: 16,
  },
  infoTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#111",
  },
  listText: {
    fontSize: 18,
    color: "#111",
    marginTop: 6,
  },
  logoutButton: {
    alignSelf: "center",
    width: 180,
    height: 52,
    borderRadius: 26,
    backgroundColor: "#D7D7DD",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 6,
  },
  saveButton: {
    alignSelf: "center",
    width: 180,
    height: 52,
    borderRadius: 26,
    backgroundColor: "#4F46E5",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 6,
  },
  buttonText: {
    color: "#111",
    fontSize: 18,
    fontWeight: "600",
  },
});
