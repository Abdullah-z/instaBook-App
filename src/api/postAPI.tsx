// src/api/postAPI.ts
import API from './axios';

export const getPostsAPI = async (page = 1, limit = 4) => {
  const res = await API.get(`/posts?limit=${limit}&page=${page}`);
  return res.data; // should include { posts, result }
};

export const getDiscoverPostsAPI = async (token: string, page = 1) => {
  const res = await API.get(`/post_discover?num=${page * 9}`);
  return res.data;
};

export const getReelsAPI = async (page = 1, limit = 3) => {
  const res = await API.get(`/reels?page=${page}&limit=${limit}`);
  return res.data;
};

export const likePostAPI = (postId: string) => {
  return API.patch(`/post/${postId}/like`);
};

export const unlikePostAPI = (postId: string) => {
  return API.patch(`/post/${postId}/unlike`);
};

export const savePost = async (postId: string) => {
  const res = await API.patch(`/savePost/${postId}`);
  return res.data;
};

export const unsavePost = async (postId: string) => {
  const res = await API.patch(`/unSavePost/${postId}`);
  return res.data;
};

export const getSuggestionsAPI = async () => {
  const res = await API.get(`/suggestionsUser`);
  return res.data; // should include { users }
};

export const getStoriesAPI = async () => {
  const res = await API.get('/stories');
  return res.data;
};

export const createPostAPI = async (post: {
  content: string;
  images: any[];
  postType?: 'feed' | 'story' | 'both';
  address?: string;
  location?: { type: string; coordinates: number[] };
  background?: string;
  textStyle?: { fontSize: number; color: string; fontWeight: string };
  poll_question?: string;
  poll_options?: { text: string }[];
}) => {
  const res = await API.post('/posts', post); // endpoint must be `/posts`
  return res.data;
};

export const deletePostAPI = async (postId: string) => {
  const res = await API.delete(`/post/${postId}`);
  return res.data;
};

export const updatePostAPI = async (
  postId: string,
  updatedData: {
    content: string;
    images: any[];
    address?: string;
    location?: { type: string; coordinates: number[] };
    background?: string;
    textStyle?: { fontSize: number; color: string; fontWeight: string };
    poll_question?: string;
    poll_options?: { text: string }[];
  }
) => {
  const res = await API.patch(`/post/${postId}`, updatedData);
  return res.data;
};
export const getPostAPI = async (postId: string) => {
  const res = await API.get(`/post/${postId}`);
  return res.data;
};

export const votePollAPI = async (postId: string, optionIndex: number) => {
  const res = await API.patch(`/post/${postId}/vote`, { optionIndex });
  return res.data;
};

export const searchPostAPI = async (query: string) => {
  const res = await API.get(`/search_post?content=${encodeURIComponent(query)}`);
  return res.data;
};
