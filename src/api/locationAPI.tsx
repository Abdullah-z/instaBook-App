import axios from './axios';

export const shareLocationAPI = async (
  latitude: number,
  longitude: number,
  visibility: string,
  type: string = 'live',
  duration: number = 24
) => {
  const res = await axios.post('/location/share', {
    latitude,
    longitude,
    visibility,
    type,
    duration,
  });
  return res.data;
};

export const getSharedLocationsAPI = async (
  lat?: number,
  lon?: number,
  radius?: number,
  targetUserId?: string,
  timePeriod?: string,
  typeFilter?: string,
  audienceFilter?: string
) => {
  const res = await axios.get('/location/shared', {
    params: { lat, lon, radius, targetUserId, timePeriod, typeFilter, audienceFilter },
  });
  return res.data;
};

export const stopSharingAPI = async () => {
  const res = await axios.delete('/location/stop');
  return res.data;
};

export const createShoutoutAPI = async (
  content: string,
  latitude: number,
  longitude: number,
  visibility: string = 'public'
) => {
  const res = await axios.post('/location/shoutout', {
    content,
    latitude,
    longitude,
    visibility,
  });
  return res.data;
};
