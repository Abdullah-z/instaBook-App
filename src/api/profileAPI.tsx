import API from './axios';

export const getProfileUser = async (id: string) => {
  const userRes = await API.get(`/user/${id}`);
  const postsRes = await API.get(`/user_posts/${id}`);

  return {
    user: userRes.data.user,
    posts: postsRes.data.posts,
    result: postsRes.data.result,
  };
};

export const getUserPosts = async (id: string, page: number = 1) => {
  const res = await API.get(`/user_posts/${id}?page=${page}&limit=9`);
  return res.data;
};

export const followUserAPI = async (id: string) => {
  return await API.patch(`/user/${id}/follow`);
};

export const unfollowUserAPI = async (id: string) => {
  return await API.patch(`/user/${id}/unfollow`);
};

export const getSavedPosts = async (page: number = 1) => {
  const res = await API.get(`/getSavePosts?page=${page}&limit=9`);
  return {
    savePosts: res.data.savePosts,
    result: res.data.result,
  };
};
