import AsyncStorage from "@react-native-async-storage/async-storage";

const KEY = "last_searches";

export const saveSearch = async (text) => {
  try {
    if (!text.trim()) return;

    const existing = await AsyncStorage.getItem(KEY);
    let searches = existing ? JSON.parse(existing) : [];

    searches = searches.filter((item) => item !== text);

    searches.unshift(text);

    searches = searches.slice(0, 3);

    await AsyncStorage.setItem(KEY, JSON.stringify(searches));
  } catch (error) {}
};

export const getSearches = async () => {
  try {
    const data = await AsyncStorage.getItem(KEY);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    return [];
  }
};
