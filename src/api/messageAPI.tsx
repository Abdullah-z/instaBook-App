import API from './axios';

export const getConversations = async (page: number = 1) => {
  const res = await API.get(`/conversations?page=${page}&limit=20`);
  return res.data;
};

export const getMessages = async (userId: string, page: number = 1) => {
  const res = await API.get(`/message/${userId}?page=${page}&limit=20`);
  return res.data;
};

export const sendMessage = async (data: {
  recipient?: string;
  conversationId?: string;
  text?: string;
  media?: any[];
  call?: any;
  location?: { lat: number; lon: number; address: string };
  clientTime?: string;
}) => {
  const res = await API.post('/message', data);
  return res.data;
};

export const deleteConversation = async (userId: string) => {
  const res = await API.delete(`/conversation/${userId}`);
  return res.data;
};

export const createGroupAPI = async (data: { groupName: string; recipients: string[] }) => {
  const res = await API.post('/group', data);
  return res.data;
};

export const updateGroupAPI = async (id: string, data: any) => {
  const res = await API.patch(`/group/${id}`, data);
  return res.data;
};

export const leaveGroupAPI = async (id: string, newAdminId?: string) => {
  const res = await API.post(`/group/${id}/leave`, { newAdminId });
  return res.data;
};

export const markMessagesAsSeen = async (id: string) => {
  const res = await API.patch(`/message/${id}/seen`);
  return res.data;
};
