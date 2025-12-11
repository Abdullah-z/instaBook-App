import React, { useState, useContext } from 'react';
import { View, Text, TouchableOpacity, Linking, Image } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Avatar } from 'react-native-paper';
import { followUserAPI, unfollowUserAPI } from '../../api/profileAPI';
import { AuthContext } from '../../auth/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import EditProfileModal from './EditProfileModal';

const ProfileHeader = ({
  profile,
  isOwner,
  postCount,
  onRefresh,
}: {
  profile: any;
  isOwner: boolean;
  postCount: number;
  onRefresh?: () => void;
}) => {
  const { user, logout } = useContext(AuthContext);
  const navigation = useNavigation<any>();
  console.log(profile);
  const [isFollowing, setIsFollowing] = useState(
    user ? profile.followers?.some((f: any) => f._id === user._id) : false
  );
  const [followerCount, setFollowerCount] = useState(profile.followers?.length || 0);
  const [showEditModal, setShowEditModal] = useState(false);

  const handleFollowToggle = async () => {
    try {
      if (isFollowing) {
        await unfollowUserAPI(profile._id);
        setIsFollowing(false);
        setFollowerCount((prev: number) => prev - 1);
      } else {
        await followUserAPI(profile._id);
        setIsFollowing(true);
        setFollowerCount((prev: number) => prev + 1);
      }
    } catch (err) {
      console.error('Follow/Unfollow failed', err);
    }
  };

  const handleEditSave = () => {
    if (onRefresh) {
      onRefresh();
    }
  };

  return (
    <View style={{ backgroundColor: '#fff', paddingBottom: 20 }}>
      {/* Profile Info Container */}
      <View style={{ alignItems: 'center', marginTop: -50 }}>
        {/* Avatar with Border */}
        <View
          style={{
            padding: 4,
            backgroundColor: '#fff',
            borderRadius: 75,
            elevation: 5,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.2,
            shadowRadius: 4,
          }}>
          <Avatar.Image size={120} source={{ uri: profile.avatar }} />
        </View>

        {/* Name and Bio */}
        <Text style={{ fontSize: 24, fontWeight: 'bold', marginTop: 10, color: '#333' }}>
          {profile.fullname}
        </Text>
        <Text style={{ color: '#666', marginTop: 4, textAlign: 'center', paddingHorizontal: 20 }}>
          {'@' + profile.username + ' \n' + profile.story}
        </Text>
        {profile.address && (
          <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4 }}>
            <Ionicons name="location-outline" size={14} color="#888" />
            <Text style={{ color: '#888', fontSize: 12, marginLeft: 4 }}>{profile.address}</Text>
          </View>
        )}

        {/* Stats Row */}
        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'space-around',
            width: '100%',
            marginTop: 20,
            paddingHorizontal: 20,
          }}>
          <View style={{ alignItems: 'center' }}>
            <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#333' }}>{postCount}</Text>
            <Text style={{ fontSize: 12, color: '#888', textTransform: 'uppercase' }}>Posts</Text>
          </View>
          <View style={{ alignItems: 'center' }}>
            <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#333' }}>{followerCount}</Text>
            <Text style={{ fontSize: 12, color: '#888', textTransform: 'uppercase' }}>
              Followers
            </Text>
          </View>
          <View style={{ alignItems: 'center' }}>
            <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#333' }}>
              {profile.following?.length || 0}
            </Text>
            <Text style={{ fontSize: 12, color: '#888', textTransform: 'uppercase' }}>
              Following
            </Text>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={{ flexDirection: 'row', marginTop: 20, gap: 15 }}>
          {isOwner ? (
            <>
              <TouchableOpacity
                onPress={() => setShowEditModal(true)}
                style={{
                  backgroundColor: '#D4F637',
                  paddingVertical: 10,
                  paddingHorizontal: 30,
                  borderRadius: 25,
                  elevation: 2,
                }}>
                <Text style={{ color: '#000', fontWeight: 'bold' }}>Edit Profile</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={logout}
                style={{
                  backgroundColor: '#ff4444',
                  paddingVertical: 10,
                  paddingHorizontal: 30,
                  borderRadius: 25,
                  elevation: 2,
                }}>
                <Text style={{ color: '#fff', fontWeight: 'bold' }}>Logout</Text>
              </TouchableOpacity>
            </>
          ) : (
            <>
              <TouchableOpacity
                onPress={handleFollowToggle}
                style={{
                  backgroundColor: isFollowing ? '#ccc' : '#D4F637',
                  paddingVertical: 10,
                  paddingHorizontal: 30,
                  borderRadius: 25,
                  elevation: 2,
                  minWidth: 120,
                  alignItems: 'center',
                }}>
                <Text style={{ color: isFollowing ? '#fff' : '#000', fontWeight: 'bold' }}>
                  {isFollowing ? 'Unfollow' : 'Follow'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() =>
                  navigation.navigate('Chat', {
                    userId: profile._id,
                    username: profile.username,
                  })
                }
                style={{
                  backgroundColor: '#fff',
                  borderWidth: 1,
                  borderColor: '#ccc',
                  paddingVertical: 10,
                  paddingHorizontal: 15,
                  borderRadius: 25,
                  elevation: 0,
                  alignItems: 'center',
                }}>
                <Ionicons name="mail-outline" size={20} color="black" />
              </TouchableOpacity>
            </>
          )}
        </View>
      </View>

      {/* Edit Profile Modal */}
      {isOwner && (
        <EditProfileModal
          visible={showEditModal}
          onClose={() => setShowEditModal(false)}
          onSave={handleEditSave}
          profile={profile}
        />
      )}
    </View>
  );
};

export default ProfileHeader;
