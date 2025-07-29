import API from './axios';
import { getToken } from '../auth/tokenManager';

export const addCommentAPI = (
  postId: string,
  content: string,
  reply?: string,
  comment_root?: string
) => {
  return API.post('/comment', {
    postId,
    content,
    reply,
    comment_root,
  });
};

export const likeCommentAPI = (commentId: string) => {
  return API.patch(`/comment/${commentId}/like`);
};

export const unlikeCommentAPI = (commentId: string) => {
  return API.patch(`/comment/${commentId}/unlike`);
};

// DELETE comment
export const deleteCommentAPI = (commentId: string) => {
  return API.delete(`/comment/${commentId}`);
};

// EDIT comment
export const updateCommentAPI = (commentId: string, content: string) => {
  return API.patch(`/comment/${commentId}`, { content });
};
