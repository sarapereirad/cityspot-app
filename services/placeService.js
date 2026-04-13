const categoryImages = {
  cafe: "https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&w=800&q=80",
  restaurant:
    "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=800&q=80",
  library:
    "https://images.unsplash.com/photo-1524758631624-e2822e304c36?auto=format&fit=crop&w=800&q=80",
  outdoor:
    "https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=800&q=80",
  default:
    "https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=800&q=80",
};

const overpassEndpoints = [
  "https://overpass-api.de/api/interpreter",
  "https://overpass.kumi.systems/api/interpreter",
];

const normalizeCategory = (category = "") =>
  category
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();

const toRadians = (degrees) => degrees * (Math.PI / 180);

const getDistanceInMeters = (startLat, startLng, endLat, endLng) => {
  const earthRadius = 6371000;
  const deltaLat = toRadians(endLat - startLat);
  const deltaLng = toRadians(endLng - startLng);
  const lat1 = toRadians(startLat);
  const lat2 = toRadians(endLat);

  const a =
    Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2) +
    Math.cos(lat1) *
      Math.cos(lat2) *
      Math.sin(deltaLng / 2) *
      Math.sin(deltaLng / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(earthRadius * c);
};

const formatDistance = (meters) => {
  if (meters < 1000) return `${meters}m away`;
  return `${(meters / 1000).toFixed(1)}km away`;
};

const formatAddress = (tags = {}) => {
  const houseNumber = tags["addr:housenumber"]?.trim();
  const street = tags["addr:street"]?.trim();

  if (street && houseNumber) return `${street} ${houseNumber}`;
  if (street) return street;
  return "";
};

const getPlaceCategory = (tags = {}) => {
  const amenity = tags.amenity;
  const leisure = tags.leisure;

  if (leisure === "park") return "Outdoor";
  if (["bar", "cafe", "pub"].includes(amenity)) return "Café";
  if (["restaurant", "fast_food", "food_court"].includes(amenity))
    return "Restaurant";
  if (["library", "coworking_space"].includes(amenity)) return "Study";
  return "Outdoor";
};

const getImageForTags = (tags = {}) => {
  const amenity = tags.amenity;
  const leisure = tags.leisure;

  if (leisure === "park") return categoryImages.outdoor;
  if (["bar", "cafe", "pub"].includes(amenity)) return categoryImages.cafe;
  if (["restaurant", "fast_food", "food_court"].includes(amenity))
    return categoryImages.restaurant;
  if (["library", "coworking_space"].includes(amenity))
    return categoryImages.library;
  return categoryImages.default;
};

const getCategoryFilters = (category) => {
  const normalized = normalizeCategory(category);

  if (normalized.includes("restaurant")) {
    return ['["amenity"~"restaurant|fast_food|food_court"]'];
  }

  if (normalized.includes("study")) {
    return ['["amenity"~"library|coworking_space"]'];
  }

  if (normalized.includes("caf")) {
    return ['["amenity"~"bar|cafe|pub"]'];
  }

  return ['["leisure"="park"]'];
};

const fetchOverpass = async (query) => {
  let lastError = null;

  for (const endpoint of overpassEndpoints) {
    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "text/plain",
        },
        body: query,
      });

      if (!response.ok) {
        const message =
          response.status === 504
            ? "Overpass is taking too long to answer. Try again in a moment."
            : `Overpass error: ${response.status}`;
        lastError = new Error(message);
        continue;
      }

      return await response.json();
    } catch (error) {
      lastError = error;
    }
  }

  throw lastError || new Error("Failed to fetch places from Overpass.");
};

const buildQuery = ({ latitude, longitude, radius, filters, limit = 60 }) => `
[out:json][timeout:20];
(
  ${filters
    .flatMap((filter) => [
      `node${filter}(around:${radius},${latitude},${longitude});`,
      `way${filter}(around:${radius},${latitude},${longitude});`,
    ])
    .join("\n  ")}
);
out tags center ${limit};
`;

const mapNearbyPlaces = (elements, latitude, longitude, maxResults = 10) => {
  return elements
    .map((item) => {
      const lat = item.lat || item.center?.lat;
      const lng = item.lon || item.center?.lon;
      const name = item.tags?.name?.trim();
      const address = formatAddress(item.tags);
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
        id: `${item.type}-${item.id}`,
        name,
        address,
        distance: formatDistance(distanceInMeters),
        distanceInMeters,
        category: getPlaceCategory(item.tags),
        hours,
        image: getImageForTags(item.tags),
        lat,
        lng,
      };
    })
    .filter(Boolean)
    .sort((a, b) => a.distanceInMeters - b.distanceInMeters)
    .slice(0, maxResults);
};

const mapCategoryPlaces = (elements, latitude, longitude, maxResults = 50) => {
  return elements
    .map((item) => {
      const lat = item.lat || item.center?.lat;
      const lng = item.lon || item.center?.lon;
      const name = item.tags?.name?.trim();
      const address = formatAddress(item.tags);
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
        id: `${item.type}-${item.id}`,
        name,
        address,
        distance: formatDistance(distanceInMeters),
        distanceInMeters,
        category: getPlaceCategory(item.tags),
        hours,
        image: getImageForTags(item.tags),
        lat,
        lng,
      };
    })
    .filter(Boolean)
    .sort((a, b) => a.distanceInMeters - b.distanceInMeters)
    .slice(0, maxResults);
};

export const fetchNearbyPlaces = async (latitude, longitude, radius = 1000) => {
  const query = buildQuery({
    latitude,
    longitude,
    radius,
    filters: [
      '["amenity"~"bar|cafe|pub|restaurant|fast_food|food_court|library|coworking_space"]',
      '["leisure"="park"]',
    ],
    limit: 50,
  });

  const data = await fetchOverpass(query);
  return mapNearbyPlaces(data.elements || [], latitude, longitude, 10);
};

export const fetchPlacesByCategoryNearby = async ({
  category,
  latitude,
  longitude,
  radius = 5000,
}) => {
  const query = buildQuery({
    latitude,
    longitude,
    radius,
    filters: getCategoryFilters(category),
    limit: 120,
  });

  const data = await fetchOverpass(query);
  return mapCategoryPlaces(data.elements || [], latitude, longitude, 50);
};
