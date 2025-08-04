import * as Location from 'expo-location';

export const getReadableAddress = async (latitude: number, longitude: number): Promise<string> => {
  try {
    const [place] = await Location.reverseGeocodeAsync({ latitude, longitude });
    if (place) {
      const { name, city, region, country } = place;
      return [name, city, region, country].filter(Boolean).join(', ');
    }
    return 'Unknown location';
  } catch (err) {
    console.error('📍 Error getting readable address:', err);
    return 'Unknown location';
  }
};
