import API from './axios';

export const getConversations = async (page: number = 1) => {
  const res = await API.get(`/conversations?page=${page}&limit=20`);
  return res.data;
};

export const getMessages = async (userId: string, page: number = 1) => {
  const res = await API.get(`/message/${userId}?page=${page}&limit=20`);
  return res.data;
};

export const sendMessage = async (data: { recipient: string; text: string; media: any[] }) => {
  const res = await API.post('/message', data);
  return res.data;
};

export const deleteConversation = async (userId: string) => {
  const res = await API.delete(`/conversation/${userId}`);
  return res.data;
};
