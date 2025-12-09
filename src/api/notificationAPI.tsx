import API from './axios';

export const getNotifications = async () => {
  const res = await API.get('/notifies');
  return res.data;
};

export const markAsRead = async (notificationId: string) => {
  const res = await API.patch(`/isReadNotify/${notificationId}`);
  return res.data;
};

export const deleteAllNotifications = async () => {
  const res = await API.delete('/deleteAllNotify');
  return res.data;
};

export const createNotification = async (data: {
  id: string;
  recipients: string[];
  url: string;
  text: string;
  content?: string;
  image?: string;
}) => {
  const res = await API.post('/notify', data);
  return res.data;
};
