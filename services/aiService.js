const API_KEY = "";

export const askAIAboutPlace = async (place, question) => {
  try {
    if (!question.trim()) {
      return null;
    }

    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        input: `
You are a helpful travel assistant for a mobile app.

Place information:
Name: ${place.name}
Category: ${place.category}
Address: ${place.address || "Address not available"}
Distance: ${place.distance || "Distance not available"}
Opening hours: ${place.hours || "Hours not available"}

User question:
${question}

Answer in simple English, maximum 3 sentences.
Do not invent exact facts if they are not provided.
        `,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      return null;
    }

    const answer =
      data.output?.[0]?.content?.[0]?.text ||
      data.output?.[0]?.content?.[0]?.value ||
      null;

    return answer;
  } catch (error) {
    return null;
  }
};
