import API from './axios';

export const createEventAPI = async (eventData: any) => {
  const res = await API.post('/events', eventData);
  return res.data;
};

export const getEventsAPI = async () => {
  const res = await API.get('/events');
  return res.data;
};

export const getEventAPI = async (id: string) => {
  const res = await API.get(`/event/${id}`);
  return res.data;
};

export const updateEventAPI = async (id: string, eventData: any) => {
  const res = await API.patch(`/event/${id}`, eventData);
  return res.data;
};

export const deleteEventAPI = async (id: string) => {
  const res = await API.delete(`/event/${id}`);
  return res.data;
};

export const toggleInterestedAPI = async (id: string) => {
  const res = await API.patch(`/event/${id}/interested`);
  return res.data;
};

export const toggleGoingAPI = async (id: string) => {
  const res = await API.patch(`/event/${id}/going`);
  return res.data;
};

export const getUserEventsAPI = async (userId: string) => {
  const res = await API.get(`/user_events/${userId}`);
  return res.data;
};
