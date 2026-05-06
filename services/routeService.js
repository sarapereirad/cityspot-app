// OpenRouteService Directions API documentation:
// https://openrouteservice.org/dev/#/api-docs/v2/directions
const API_KEY = process.env.EXPO_PUBLIC_OPENROUTESERVICE_API_KEY;

const formatDuration = (seconds) => {
  const minutes = Math.round(seconds / 60);

  if (minutes <= 1) {
    return "1 min";
  }

  return minutes + " min";
};

export const getRouteInfo = async ({
  userLat,
  userLng,
  placeLat,
  placeLng,
  mode,
}) => {
  try {
    if (!userLat || !userLng || !placeLat || !placeLng || !mode || !API_KEY) {
      return null;
    }
    const response = await fetch(
      `https://api.openrouteservice.org/v2/directions/${mode}`,
      {
        method: "POST",
        headers: {
          Authorization: API_KEY,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          coordinates: [
            [userLng, userLat],
            [placeLng, placeLat],
          ],
        }),
      },
    );

    if (!response.ok) {
      return null;
    }

    const data = await response.json();
    const summary = data.routes[0].summary;

    return {
      duration: formatDuration(summary.duration),
    };
  } catch (error) {
    return null;
  }
};
