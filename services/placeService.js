const categoryImages = {
  cafe: "https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&w=800&q=80",
  restaurant:
    "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=800&q=80",
  library:
    "https://images.unsplash.com/photo-1524758631624-e2822e304c36?auto=format&fit=crop&w=800&q=80",
  default:
    "https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=800&q=80",
};

const formatCategory = (tags = {}) => {
  const amenity = tags.amenity;
  const leisure = tags.leisure;

  if (leisure === "park") return "Outdoor";
  if (["bar", "cafe", "pub"].includes(amenity)) return "Cafe";
  if (amenity === "restaurant") return "Restaurant";
  if (["coworking_space", "library"].includes(amenity)) return "Study";
  return "Outdoor";
};

const getImageKeyForPlace = (tags = {}) => {
  const category = formatCategory(tags);

  if (category === "Cafe") return "cafe";
  if (category === "Restaurant") return "restaurant";
  if (category === "Study") return "library";
  return "default";
};

const getImageForAmenity = (amenity) => {
  return categoryImages[amenity] || categoryImages.default;
};

const requiredPlaceTags = '["name"]';

const formatAddress = (tags = {}) => {
  const street = tags["addr:street"];
  const houseNumber = tags["addr:housenumber"];

  if (street && houseNumber) return `${street} ${houseNumber}`;
  return street || "";
};

const normalizeCategory = (category) =>
  category
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();

const getCategoryConfig = (category) => {
  const normalizedCategory = normalizeCategory(category);

  if (normalizedCategory.includes("restaurant")) {
    return {
      label: "Restaurant",
      filters: ['["amenity"~"restaurant|fast_food|food_court"]'],
      imageKey: "restaurant",
    };
  }

  if (normalizedCategory.includes("study")) {
    return {
      label: "Study",
      filters: ['["amenity"~"library|coworking_space"]'],
      imageKey: "library",
    };
  }

  if (normalizedCategory.includes("caf")) {
    return {
      label: "Cafe",
      filters: ['["amenity"~"bar|cafe|pub"]'],
      imageKey: "cafe",
    };
  }

  return {
    label: "Outdoor",
    filters: ['["leisure"="park"]'],
    imageKey: "default",
  };
};

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

const overpassEndpoints = [
  "https://overpass-api.de/api/interpreter",
  "https://overpass.kumi.systems/api/interpreter",
];

const fetchOverpass = async (query) => {
  for (const endpoint of overpassEndpoints) {
    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "text/plain",
        },
        body: query,
      });

      if (response.ok) {
        return response.json();
      }
    } catch {
      // Try the next public Overpass endpoint.
    }
  }

  return { elements: [] };
};

const mapOverpassElements = (
  elements,
  latitude,
  longitude,
  categoryConfig = null,
  limit = 10,
) => {
  return elements
    .map((item) => {
      const lat = item.lat || item.center?.lat;
      const lng = item.lon || item.center?.lon;
      const name = item.tags?.name?.trim();
      const address = formatAddress(item.tags);
      const hours = item.tags?.opening_hours?.trim() || "";

      if (!lat || !lng || !name) return null;

      const distanceInMeters = getDistanceInMeters(latitude, longitude, lat, lng);
      const category = categoryConfig?.label || formatCategory(item.tags);
      const image = getImageForAmenity(
        categoryConfig?.imageKey || getImageKeyForPlace(item.tags),
      );

      return {
        id: `${item.type}-${item.id}`,
        name,
        address,
        distance: formatDistance(distanceInMeters),
        distanceInMeters,
        category,
        hours,
        image,
        lat,
        lng,
      };
    })
    .filter(Boolean)
    .sort(
      (firstPlace, secondPlace) =>
        firstPlace.distanceInMeters - secondPlace.distanceInMeters,
    )
    .slice(0, limit);
};

const buildAroundQuery = (
  latitude,
  longitude,
  radius,
  filters,
  limit = 50,
  requiredTags = requiredPlaceTags,
) => `
  [out:json][timeout:12];
  (
    ${filters
      .flatMap((filter) => [
        `node${filter}${requiredTags}(around:${radius},${latitude},${longitude});`,
        `way${filter}${requiredTags}(around:${radius},${latitude},${longitude});`,
      ])
      .join("\n    ")}
  );
  out tags center ${limit};
`;

export const fetchNearbyPlaces = async (latitude, longitude, radius = 5000) => {
  const radiuses = radius > 2000 ? [radius, 2000, 500] : [radius];
  let data = { elements: [] };

  for (const currentRadius of radiuses) {
    try {
      const query = buildAroundQuery(
        latitude,
        longitude,
        currentRadius,
        [
          '["amenity"~"bar|cafe|coworking_space|library|pub|restaurant"]',
          '["leisure"="park"]',
        ],
        80,
      );
      data = await fetchOverpass(query);
      break;
    } catch (error) {
      if (currentRadius === radiuses[radiuses.length - 1]) {
        throw error;
      }
    }
  }

  return mapOverpassElements(data.elements || [], latitude, longitude, null, 10);
};

export const fetchPlacesByCategoryNearby = async ({
  category,
  latitude,
  longitude,
  radius = 1500,
}) => {
  const categoryConfig = getCategoryConfig(category);
  const query = buildAroundQuery(
    latitude,
    longitude,
    radius,
    categoryConfig.filters,
    50,
  );
  const data = await fetchOverpass(query);

  return mapOverpassElements(
    data.elements || [],
    latitude,
    longitude,
    categoryConfig,
    50,
  );
};
