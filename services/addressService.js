const API_KEY = "18d38fbc2d6448a2b1c5c8621743799d";

export const getAddressFromCoordinates = async (lat, lng) => {
  try {
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
