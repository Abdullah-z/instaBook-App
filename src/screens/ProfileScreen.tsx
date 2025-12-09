import React, { useContext, useEffect, useState } from 'react';
import { View, Text, ActivityIndicator, TouchableOpacity } from 'react-native';
import { useRoute } from '@react-navigation/native';
import { AuthContext } from '../auth/AuthContext';
import { getProfileUser, getSavedPosts, getUserPosts } from '../api/profileAPI';
import PostGrid from '../components/profile/PostGrid';
import ProfileHeader from '../components/profile/ProfileHeader';

const ProfileScreen = ({ userId }: { userId?: string }) => {
  const route = useRoute<any>();
  const { user } = useContext(AuthContext);
  const id = userId || route.params?.id;

  const [profileUser, setProfileUser] = useState<any>(null);
  const [posts, setPosts] = useState<any[]>([]);
  const [savedPosts, setSavedPosts] = useState<any[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [showSaved, setShowSaved] = useState(false);
  const [page, setPage] = useState(1);
  const [result, setResult] = useState(0);
  const [loadingMore, setLoadingMore] = useState(false);
  const [savedPage, setSavedPage] = useState(1);
  const [savedResult, setSavedResult] = useState(0);

  const loadProfile = async () => {
    try {
      setLoading(true);
      const res = await getProfileUser(id);
      setProfileUser(res.user);
      setPosts(res.posts);
      setResult(res.result);
      setPage(1);
    } catch (err) {
      console.error('Failed to fetch profile:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadSavedPosts = async () => {
    try {
      setLoading(true);
      const res = await getSavedPosts(1);
      setSavedPosts(res.savePosts);
      setSavedResult(res.result);
      setSavedPage(1);
    } catch (err) {
      console.error('Failed to fetch saved posts:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleLoadMore = async () => {
    if (loadingMore) return;
    setLoadingMore(true);
    try {
      const nextPage = page + 1;
      const res = await getUserPosts(id, nextPage);
      setPosts((prev) => [...prev, ...res.posts]);
      setResult(res.result);
      setPage(nextPage);
    } catch (err) {
      console.error('Failed to load more posts:', err);
    } finally {
      setLoadingMore(false);
    }
  };

  const handleLoadMoreSaved = async () => {
    if (loadingMore) return;
    setLoadingMore(true);
    try {
      const nextPage = savedPage + 1;
      const res = await getSavedPosts(nextPage);
      setSavedPosts((prev) => [...(prev || []), ...res.savePosts]);
      setSavedResult(res.result);
      setSavedPage(nextPage);
    } catch (err) {
      console.error('Failed to load more saved posts:', err);
    } finally {
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    loadProfile();
  }, [id]);

  useEffect(() => {
    if (showSaved && user && id === user._id && !savedPosts) {
      loadSavedPosts();
    }
  }, [showSaved, id, user, savedPosts]);

  if (loading) return <ActivityIndicator style={{ marginTop: 40 }} />;

  const showLoadMoreButton = showSaved ? savedResult === 9 : result === 9;

  return (
    <View style={{ flex: 1 }}>
      {profileUser && user && (
        <ProfileHeader
          profile={profileUser}
          isOwner={id === user._id}
          postCount={posts.length}
          onRefresh={loadProfile}
        />
      )}

      {user && id === user._id && (
        <View style={{ flexDirection: 'row', justifyContent: 'center', marginVertical: 12 }}>
          <TouchableOpacity onPress={() => setShowSaved(false)}>
            <Text style={{ fontWeight: showSaved ? 'normal' : 'bold', marginHorizontal: 12 }}>
              Posts
            </Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setShowSaved(true)}>
            <Text style={{ fontWeight: showSaved ? 'bold' : 'normal', marginHorizontal: 12 }}>
              Saved
            </Text>
          </TouchableOpacity>
        </View>
      )}

      <PostGrid
        posts={showSaved ? savedPosts || [] : posts}
        onLoadMore={showSaved ? handleLoadMoreSaved : handleLoadMore}
        isLoadingMore={loadingMore}
        loadMoreVisible={showLoadMoreButton}
      />
    </View>
  );
};

export default ProfileScreen;
