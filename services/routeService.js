const API_KEY =
  "eyJvcmciOiI1YjNjZTM1OTc4NTExMTAwMDFjZjYyNDgiLCJpZCI6IjE2YTg3NDU3ZWQ4NDRmOGU4YjQ4YzhjNjVjOTNiNzQ0IiwiaCI6Im11cm11cjY0In0=";

const formatDistance = (meters) => {
  if (meters < 1000) {
    return Math.round(meters) + " m";
  }

  return (meters / 1000).toFixed(1) + " km";
};

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
