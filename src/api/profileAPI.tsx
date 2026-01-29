import API from './axios';

export const getProfileUser = async (id: string) => {
  const userRes = await API.get(`/user/${id}`);

  let postsRes = { data: { posts: [], result: 0, totalPosts: 0 } };
  try {
    postsRes = await API.get(`/user_posts/${id}?media_type=media`);
  } catch (err: any) {
    // If 403, it's a private account, just return empty posts
    if (err.response && err.response.status === 403) {
      console.log('Private account, posts hidden');
    } else {
      // Other errors might be relevant, but for profile load we likely want to show user info anyway
      console.error('Failed to load user posts', err);
    }
  }

  return {
    user: userRes.data.user,
    posts: postsRes.data.posts,
    result: postsRes.data.result,
    totalPosts: postsRes.data.totalPosts,
  };
};

export const getProfileByUsername = async (username: string) => {
  const userRes = await API.get(`/user_username/${username}`);
  const id = userRes.data.user._id;

  let postsRes = { data: { posts: [], result: 0, totalPosts: 0 } };
  try {
    postsRes = await API.get(`/user_posts/${id}?media_type=media`);
  } catch (err: any) {
    if (err.response && err.response.status === 403) {
      console.log('Private account, posts hidden');
    } else {
      console.error('Failed to load user posts', err);
    }
  }

  return {
    user: userRes.data.user,
    posts: postsRes.data.posts,
    result: postsRes.data.result,
    totalPosts: postsRes.data.totalPosts,
  };
};

export const getUserPosts = async (id: string, page: number = 1, mediaType?: 'text' | 'media') => {
  let url = `/user_posts/${id}?page=${page}&limit=9`;
  if (mediaType) url += `&media_type=${mediaType}`;
  const res = await API.get(url);
  return res.data;
};

export const followUserAPI = async (id: string) => {
  return await API.patch(`/user/${id}/follow`);
};

export const unfollowUserAPI = async (id: string) => {
  return await API.patch(`/user/${id}/unfollow`);
};

export const acceptFollowRequestAPI = async (id: string) => {
  return await API.patch(`/user/${id}/accept_request`);
};

export const rejectFollowRequestAPI = async (id: string) => {
  return await API.patch(`/user/${id}/reject_request`);
};

export const getSavedPosts = async (page: number = 1) => {
  const res = await API.get(`/getSavePosts?page=${page}&limit=9`);
  return {
    savePosts: res.data.savePosts,
    result: res.data.result,
  };
};
