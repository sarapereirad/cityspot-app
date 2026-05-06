// OpenCage Geocoding API documentation:
// https://opencagedata.com/api
const API_KEY = process.env.EXPO_PUBLIC_OPENCAGE_API_KEY;

export const getAddressFromCoordinates = async (lat, lng) => {
  try {
    if (!lat || !lng) {
      return null;
    }

    const response = await fetch(
      `https://api.opencagedata.com/geocode/v1/json?q=${lat}+${lng}&key=${API_KEY}&language=en&limit=1`,
    );

    if (!response.ok) {
      return null;
    }

    const data = await response.json();

    if (!data.results || data.results.length === 0) {
      return null;
    }

    const components = data.results[0].components || {};

    return {
      road: components.road || components.street || "",
      houseNumber: components.house_number || "",
      postcode: components.postcode || "",
      city:
        components.city ||
        components.town ||
        components.village ||
        components.municipality ||
        components.hamlet ||
        components.county ||
        "",
    };
  } catch (error) {
    return null;
  }
};
