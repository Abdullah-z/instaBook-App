import API from './axios';

export const updateUserProfile = async (userData: {
  avatar?: string;
  cover?: string;
  fullname: string;
  mobile?: string;
  address?: string;
  website?: string;
  story?: string;
  gender?: string;
}) => {
  const res = await API.patch('/user', userData);
  return res.data;
};

export const searchUser = async (username: string) => {
  const res = await API.get(`/search?username=${username}`);
  return res.data;
};
