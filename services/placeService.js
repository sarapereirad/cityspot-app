const categoryImages = {
  cafe: "https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&w=800&q=80",
  restaurant:
    "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=800&q=80",
  study:
    "https://images.unsplash.com/photo-1524758631624-e2822e304c36?auto=format&fit=crop&w=800&q=80",
  outdoor:
    "https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=800&q=80",
  default:
    "https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=800&q=80",
};

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

const formatAddress = (tags) => {
  const street = tags["addr:street"];
  const number = tags["addr:housenumber"];

  if (street && number) {
    return street + " " + number;
  }

  if (street) {
    return street;
  }

  return "";
};

const getCategoryName = (tags) => {
  if (tags.leisure === "park") {
    return "Outdoor";
  }

  if (
    tags.amenity === "cafe" ||
    tags.amenity === "bar" ||
    tags.amenity === "pub"
  ) {
    return "Café";
  }

  if (
    tags.amenity === "restaurant" ||
    tags.amenity === "fast_food" ||
    tags.amenity === "food_court"
  ) {
    return "Restaurant";
  }

  if (tags.amenity === "library" || tags.amenity === "coworking_space") {
    return "Study";
  }

  return "Outdoor";
};

const getCategoryImage = (tags) => {
  if (tags.leisure === "park") {
    return categoryImages.outdoor;
  }

  if (
    tags.amenity === "cafe" ||
    tags.amenity === "bar" ||
    tags.amenity === "pub"
  ) {
    return categoryImages.cafe;
  }

  if (
    tags.amenity === "restaurant" ||
    tags.amenity === "fast_food" ||
    tags.amenity === "food_court"
  ) {
    return categoryImages.restaurant;
  }

  if (tags.amenity === "library" || tags.amenity === "coworking_space") {
    return categoryImages.study;
  }

  return categoryImages.default;
};

const getCategoryFilter = (category) => {
  if (category === "Restaurant") {
    return '["amenity"~"restaurant|fast_food|food_court"]';
  }

  if (category === "Study") {
    return '["amenity"~"library|coworking_space"]';
  }

  if (category === "Café") {
    return '["amenity"~"bar|cafe|pub"]';
  }

  return '["leisure"="park"]';
};

const fetchOverpassData = async (query) => {
  const response = await fetch("https://overpass-api.de/api/interpreter", {
    method: "POST",
    headers: {
      "Content-Type": "text/plain",
    },
    body: query,
  });

  if (!response.ok) {
    throw new Error("Error in fetch");
  }

  return await response.json();
};

export const fetchNearbyPlaces = async (latitude, longitude, radius = 1000) => {
  const query = `
    [out:json][timeout:20];
    (
      node["amenity"~"bar|cafe|pub|restaurant|fast_food|food_court|library|coworking_space"](around:${radius},${latitude},${longitude});
      way["amenity"~"bar|cafe|pub|restaurant|fast_food|food_court|library|coworking_space"](around:${radius},${latitude},${longitude});
      node["leisure"="park"](around:${radius},${latitude},${longitude});
      way["leisure"="park"](around:${radius},${latitude},${longitude});
    );
    out tags center 50;
  `;

  const data = await fetchOverpassData(query);

  const places = data.elements
    .map((item) => {
      const lat = item.lat || item.center?.lat;
      const lng = item.lon || item.center?.lon;
      const name = item.tags?.name?.trim();
      const address = formatAddress(item.tags || {});
      const hours = item.tags?.opening_hours?.trim() || "";

      if (!lat || !lng) return null;
      if (!name || name.toLowerCase() === "unnamed") return null;
      if (!address) return null;

      const distanceInMeters = getDistanceInMeters(
        latitude,
        longitude,
        lat,
        lng,
      );

      return {
        id: item.id.toString(),
        name: name,
        address: address,
        distance: formatDistance(distanceInMeters),
        distanceInMeters: distanceInMeters,
        category: getCategoryName(item.tags || {}),
        hours: hours,
        image: getCategoryImage(item.tags || {}),
        lat: lat,
        lng: lng,
      };
    })
    .filter((item) => item !== null)
    .sort((a, b) => a.distanceInMeters - b.distanceInMeters)
    .slice(0, 10);

  return places;
};

export const fetchPlacesByCategoryNearby = async ({
  category,
  latitude,
  longitude,
  radius = 5000,
}) => {
  const filter = getCategoryFilter(category);

  const query = `
    [out:json][timeout:20];
    (
      node${filter}(around:${radius},${latitude},${longitude});
      way${filter}(around:${radius},${latitude},${longitude});
    );
    out tags center 120;
  `;

  const data = await fetchOverpassData(query);

  const places = data.elements
    .map((item) => {
      const lat = item.lat || item.center?.lat;
      const lng = item.lon || item.center?.lon;
      const name = item.tags?.name?.trim();
      const address = formatAddress(item.tags || {});
      const hours = item.tags?.opening_hours?.trim() || "";

      if (!lat || !lng) return null;
      if (!name || name.toLowerCase() === "unnamed") return null;
      if (!address) return null;

      const distanceInMeters = getDistanceInMeters(
        latitude,
        longitude,
        lat,
        lng,
      );

      return {
        id: item.id.toString(),
        name: name,
        address: address,
        distance: formatDistance(distanceInMeters),
        distanceInMeters: distanceInMeters,
        category: getCategoryName(item.tags || {}),
        hours: hours,
        image: getCategoryImage(item.tags || {}),
        lat: lat,
        lng: lng,
      };
    })
    .filter((item) => item !== null)
    .sort((a, b) => a.distanceInMeters - b.distanceInMeters);

  return places;
};
