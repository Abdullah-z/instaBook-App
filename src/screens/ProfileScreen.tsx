import React, { useContext, useEffect, useState } from 'react';
import { View, Text, ActivityIndicator, TouchableOpacity } from 'react-native';
import { useRoute } from '@react-navigation/native';
import { AuthContext } from '../auth/AuthContext';
import { getProfileUser, getSavedPosts } from '../api/profileAPI';
import PostGrid from '../components/profile/PostGrid';
import ProfileHeader from '../components/profile/ProfileHeader';

const ProfileScreen = () => {
  const route = useRoute<any>();
  const { id } = route.params;
  const { user } = useContext(AuthContext);

  const [profileUser, setProfileUser] = useState<any>(null);
  const [posts, setPosts] = useState([]);
  const [savedPosts, setSavedPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showSaved, setShowSaved] = useState(false);

  const loadProfile = async () => {
    try {
      setLoading(true);
      const res = await getProfileUser(id);
      setProfileUser(res.user);
      setPosts(res.posts);
    } catch (err) {
      console.error('Failed to fetch profile:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadSavedPosts = async () => {
    try {
      setLoading(true);
      const saved = await getSavedPosts();
      setSavedPosts(saved);
    } catch (err) {
      console.error('Failed to fetch saved posts:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (showSaved && id === user._id) {
      loadSavedPosts();
    } else {
      loadProfile();
    }
  }, [id, showSaved]);

  if (loading) return <ActivityIndicator style={{ marginTop: 40 }} />;

  return (
    <View style={{ flex: 1 }}>
      {profileUser && <ProfileHeader profile={profileUser} isOwner={id === user._id} />}

      {id === user._id && (
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

      <PostGrid posts={showSaved ? savedPosts : posts} />
    </View>
  );
};

export default ProfileScreen;
