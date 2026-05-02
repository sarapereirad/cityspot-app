import { Image, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";

export default function PlaceCard(props) {
  return (
    <TouchableOpacity style={styles.card} onPress={props.onPress}>
      <Image source={{ uri: props.place.image }} style={styles.image} />

      <View style={styles.info}>
        <Text style={styles.name} numberOfLines={1}>
          {props.place.name}
        </Text>

        {props.place.address ? (
          <Text style={styles.text}>{props.place.address}</Text>
        ) : null}

        {props.place.distance ? (
          <Text style={styles.text}>{props.place.distance}</Text>
        ) : null}

        {props.place.category ? (
          <Text style={styles.text}>Category: {props.place.category}</Text>
        ) : null}

        <Text style={styles.smallText}>
          {props.place.hours ? props.place.hours : "Hours not available"}
        </Text>
      </View>

      <TouchableOpacity
        style={[
          styles.favoriteBtn,
          props.isSaved ? styles.favoriteBtnSaved : null,
        ]}
        onPress={props.onFavoritePress}
      >
        <Ionicons name="heart" size={20} color="#fff" />
      </TouchableOpacity>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    backgroundColor: "#D9D9D9",
    borderRadius: 22,
    padding: 12,
    marginBottom: 14,
    alignItems: "center",
    position: "relative",
  },
  image: {
    width: 90,
    height: 90,
    borderRadius: 14,
    marginRight: 12,
  },
  info: {
    flex: 1,
    paddingRight: 40,
  },
  name: {
    fontSize: 18,
    fontWeight: "700",
    color: "#111",
    marginBottom: 4,
  },
  text: {
    fontSize: 13,
    color: "#333",
    marginBottom: 2,
  },
  smallText: {
    fontSize: 12,
    color: "#555",
    marginTop: 2,
  },
  favoriteBtn: {
    position: "absolute",
    right: 12,
    bottom: 12,
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "#4F46E5",
    justifyContent: "center",
    alignItems: "center",
  },
  favoriteBtnSaved: {
    backgroundColor: "#111",
  },
});
