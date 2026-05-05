import { getAddressFromCoordinates } from "./addressService";

const categoryImages = {
  cafe: "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=800&auto=format&fit=crop",
  restaurant:
    "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800&auto=format&fit=crop",
  study:
    "https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=800&auto=format&fit=crop",
  shopping:
    "https://images.unsplash.com/photo-1567958451986-2de427a4a0be?w=800&auto=format&fit=crop",
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
  const postcode = tags["addr:postcode"];

  const city =
    tags["addr:city"] ||
    tags["addr:town"] ||
    tags["addr:village"] ||
    tags["addr:municipality"] ||
    tags["addr:place"];

  const name = tags.name;

  let address = "";

  if (street && number) {
    address += street + " " + number;
  } else if (street) {
    address += street;
  }

  if (postcode || city) {
    address += address ? ", " : "";

    if (postcode && city) {
      address += postcode + " " + city;
    } else if (postcode) {
      address += postcode;
    } else {
      address += city;
    }
  }

  return address || "Address not available";
};

const getCategoryName = (tags) => {
  if (!tags) {
    return "Shopping";
  }

  if (tags.amenity === "library" || tags.amenity === "coworking_space") {
    return "Study";
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

  if (tags.shop) {
    return "Shopping";
  }

  return "Shopping";
};

const getCategoryImage = (tags) => {
  const category = getCategoryName(tags || {});

  if (category === "Study") {
    return categoryImages.study;
  }

  if (category === "Café") {
    return categoryImages.cafe;
  }

  if (category === "Restaurant") {
    return categoryImages.restaurant;
  }

  if (category === "Shopping") {
    return categoryImages.shopping;
  }

  return categoryImages.shopping;
};

const getCategoryFilters = (category) => {
  if (category === "Restaurant") {
    return ['["amenity"~"restaurant|fast_food|food_court"]'];
  }

  if (category === "Study") {
    return ['["amenity"~"library|coworking_space"]'];
  }

  if (category === "Café") {
    return ['["amenity"~"bar|cafe|pub"]'];
  }

  if (category === "Shopping") {
    return ['["shop"]'];
  }

  return ['["shop"]'];
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

const mapPlace = async (item, latitude, longitude) => {
  const lat = item.lat || item.center?.lat;
  const lng = item.lon || item.center?.lon;
  const tags = item.tags || {};
  const name = tags.name?.trim();
  const hours = tags.opening_hours?.trim() || "";

  if (!lat || !lng) return null;
  if (!name || name.toLowerCase() === "unnamed") return null;

  let postcode = tags["addr:postcode"] || "";

  let city =
    tags["addr:city"] ||
    tags["addr:town"] ||
    tags["addr:village"] ||
    tags["addr:municipality"] ||
    tags["addr:place"] ||
    "";

  let street = tags["addr:street"] || "";
  let number = tags["addr:housenumber"] || "";

  const isAddressIncomplete =
    (!street && !postcode && !city) || (!postcode && !city);

  if (isAddressIncomplete) {
    const reverseAddress = await getAddressFromCoordinates(lat, lng);

    if (reverseAddress) {
      if (!street) {
        street = reverseAddress.road;
      }

      if (!number) {
        number = reverseAddress.houseNumber;
      }

      if (!postcode) {
        postcode = reverseAddress.postcode;
      }

      if (!city) {
        city = reverseAddress.city;
      }
    }
  }

  const address = formatAddress({
    ...tags,
    "addr:street": street,
    "addr:housenumber": number,
    "addr:postcode": postcode,
    "addr:city": city,
  });

  const distanceInMeters = getDistanceInMeters(latitude, longitude, lat, lng);

  return {
    id: item.id.toString(),
    name: name,
    address: address,
    postcode: postcode,
    city: city,
    distance: formatDistance(distanceInMeters),
    distanceInMeters: distanceInMeters,
    category: getCategoryName(tags),
    hours: hours,
    image: getCategoryImage(tags),
    lat: lat,
    lng: lng,
  };
};

export const fetchNearbyPlaces = async (latitude, longitude, radius = 1000) => {
  const filters = [
    '["amenity"~"bar|cafe|pub|restaurant|fast_food|food_court|library|coworking_space"]',
    '["shop"]',
  ];

  const query = `
    [out:json][timeout:20];
    (
      ${filters
        .map(
          (filter) =>
            `node${filter}(around:${radius},${latitude},${longitude});
      way${filter}(around:${radius},${latitude},${longitude});`,
        )
        .join("\n")}
    );
    out tags center 80;
  `;

  const data = await fetchOverpassData(query);

  const places = await Promise.all(
    data.elements.map((item) => mapPlace(item, latitude, longitude)),
  );

  return places
    .filter((item) => item !== null)
    .sort((a, b) => a.distanceInMeters - b.distanceInMeters)
    .slice(0, 10);
};

export const fetchPlacesByCategoryNearby = async ({
  category,
  latitude,
  longitude,
  radius = 5000,
}) => {
  const filters = getCategoryFilters(category);

  const query = `
    [out:json][timeout:20];
    (
      ${filters
        .map(
          (filter) =>
            `node${filter}(around:${radius},${latitude},${longitude});
      way${filter}(around:${radius},${latitude},${longitude});`,
        )
        .join("\n")}
    );
    out tags center 120;
  `;

  const data = await fetchOverpassData(query);

  const places = await Promise.all(
    data.elements.map((item) => mapPlace(item, latitude, longitude)),
  );

  return places
    .filter((item) => item !== null)
    .filter((item) => item.category === category)
    .sort((a, b) => a.distanceInMeters - b.distanceInMeters);
};

export const fetchPlacesForMapNearby = async (
  latitude,
  longitude,
  radius = 2000,
) => {
  const filters = [
    '["amenity"~"bar|cafe|pub|restaurant|fast_food|food_court|library|coworking_space"]',
    '["shop"]',
  ];

  const query = `
    [out:json][timeout:20];
    (
      ${filters
        .map(
          (filter) =>
            `node${filter}(around:${radius},${latitude},${longitude});
      way${filter}(around:${radius},${latitude},${longitude});`,
        )
        .join("\n")}
    );
    out tags center 120;
  `;

  const data = await fetchOverpassData(query);

  const places = await Promise.all(
    data.elements.map((item) => mapPlace(item, latitude, longitude)),
  );

  return places.filter((item) => item !== null);
};

export const fetchPlacesByTextNearby = async ({
  text,
  latitude,
  longitude,
  radius = 2000,
}) => {
  const filters = [
    '["amenity"~"bar|cafe|pub|restaurant|fast_food|food_court|library|coworking_space"]',
    '["shop"]',
  ];

  const query = `
    [out:json][timeout:20];
    (
      ${filters
        .map(
          (filter) =>
            `node${filter}(around:${radius},${latitude},${longitude});
      way${filter}(around:${radius},${latitude},${longitude});`,
        )
        .join("\n")}
    );
    out tags center 300;
  `;

  const normalizeText = (value) => {
    return value
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/['’`´]/g, "")
      .toLowerCase();
  };

  const data = await fetchOverpassData(query);

  const places = await Promise.all(
    data.elements.map((item) => mapPlace(item, latitude, longitude)),
  );

  const searchValue = normalizeText(text);

  return places
    .filter((item) => item !== null)
    .filter((place) => {
      return (
        normalizeText(place.name).includes(searchValue) ||
        normalizeText(place.address).includes(searchValue) ||
        normalizeText(place.category).includes(searchValue)
      );
    })
    .sort((a, b) => a.distanceInMeters - b.distanceInMeters)
    .slice(0, 100);
};
