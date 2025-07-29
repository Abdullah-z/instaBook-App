import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Linking } from 'react-native';
import { Avatar } from 'react-native-paper';
import { followUserAPI, unfollowUserAPI } from '../../api/profileAPI';
import { useContext } from 'react';
import { AuthContext } from '../../auth/AuthContext';

const ProfileHeader = ({ profile, isOwner }: { profile: any; isOwner: boolean }) => {
  const { user, token } = useContext(AuthContext);
  const [isFollowing, setIsFollowing] = useState(
    profile.followers?.some((f: any) => f._id === user._id)
  );
  const [followerCount, setFollowerCount] = useState(profile.followers?.length || 0);

  const handleFollowToggle = async () => {
    try {
      if (isFollowing) {
        await unfollowUserAPI(profile._id);
        setIsFollowing(false);
        setFollowerCount((prev) => prev - 1);
      } else {
        await followUserAPI(profile._id);
        setIsFollowing(true);
        setFollowerCount((prev) => prev + 1);
      }
    } catch (err) {
      console.error('Follow/Unfollow failed', err);
    }
  };

  return (
    <View style={{ padding: 16, alignItems: 'center' }}>
      <Avatar.Image size={100} source={{ uri: profile.avatar }} />
      <Text style={{ fontSize: 20, fontWeight: 'bold', marginTop: 8 }}>{profile.username}</Text>
      <Text>{profile.fullname}</Text>
      <Text>{profile.email}</Text>
      <Text>{profile.mobile}</Text>
      <Text>{profile.address}</Text>
      <Text numberOfLines={3}>{profile.story}</Text>

      {profile.website && (
        <TouchableOpacity onPress={() => Linking.openURL(profile.website)}>
          <Text style={{ color: 'blue' }}>{profile.website}</Text>
        </TouchableOpacity>
      )}

      {isOwner ? (
        <TouchableOpacity style={{ marginTop: 10 }}>
          <Text style={{ fontWeight: 'bold', color: 'purple' }}>Edit Profile</Text>
        </TouchableOpacity>
      ) : (
        <TouchableOpacity onPress={handleFollowToggle} style={{ marginTop: 10 }}>
          <Text style={{ fontWeight: 'bold', color: isFollowing ? 'gray' : 'blue' }}>
            {isFollowing ? 'Unfollow' : 'Follow'}
          </Text>
        </TouchableOpacity>
      )}

      <View style={{ flexDirection: 'row', marginTop: 12, gap: 20 }}>
        <Text>{followerCount} Followers</Text>
        <Text>{profile?.following?.length ?? 0} Following</Text>
      </View>
    </View>
  );
};

export default ProfileHeader;
