import API from './axios';

export const getProfileUser = async (id: string) => {
  const userRes = await API.get(`/user/${id}`);
  const postsRes = await API.get(`/user_posts/${id}`);

  return {
    user: userRes.data.user, // ✅ Fix here
    posts: postsRes.data.posts,
  };
};

export const followUserAPI = async (id: string) => {
  return await API.patch(`/user/${id}/follow`);
};

export const unfollowUserAPI = async (id: string) => {
  return await API.patch(`/user/${id}/unfollow`);
};

export const getSavedPosts = async () => {
  const res = await API.get('/getSavePosts');
  return res.data.savePosts;
};
