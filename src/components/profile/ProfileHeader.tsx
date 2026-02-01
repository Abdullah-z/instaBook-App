import React, { useState, useContext } from 'react';
import { View, Text, TouchableOpacity, Linking, Image, Modal } from 'react-native';
import ImageView from 'react-native-image-viewing';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Avatar, useTheme, Switch, Divider } from 'react-native-paper';
import { followUserAPI, unfollowUserAPI } from '../../api/profileAPI';
import { AuthContext } from '../../auth/AuthContext';
import { SocketContext } from '../../auth/SocketContext';
import { createNotification } from '../../api/notificationAPI';
import { Ionicons } from '@expo/vector-icons';
import EditProfileModal from './EditProfileModal';
import ThemeSwitcher from '../ThemeSwitcher';
import { downloadAndSaveImage } from '../../utils/MediaUtils';

const ProfileHeader = ({
  profile,
  isOwner,
  postCount,
  onRefresh,
  onCoverPress,
}: {
  profile: any;
  isOwner: boolean;
  postCount: number;
  onRefresh?: () => void;
  onCoverPress?: () => void;
}) => {
  const { user, logout, isAmbientEnabled, toggleAmbientMode } = useContext(AuthContext);
  const navigation = useNavigation<any>();
  const theme = useTheme();
  console.log(profile);
  const [isFollowing, setIsFollowing] = useState(
    user ? profile.followers?.some((f: any) => f._id === user._id) : false
  );
  const [isRequested, setIsRequested] = useState(
    user ? profile.followRequests?.some((req: any) => req._id === user._id) : false
  );
  const [followerCount, setFollowerCount] = useState(profile.followers?.length || 0);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showThemeModal, setShowThemeModal] = useState(false);
  const [viewerVisible, setViewerVisible] = useState(false);

  const handleFollowToggle = async () => {
    try {
      if (isFollowing) {
        await unfollowUserAPI(profile._id);
        setIsFollowing(false);
        setFollowerCount((prev: number) => prev - 1);
      } else if (isRequested) {
        // Cancel request
        await unfollowUserAPI(profile._id);
        setIsRequested(false);
      } else {
        const res = await followUserAPI(profile._id);
        if (res.data.msg === 'Follow request sent.') {
          setIsRequested(true);
        } else {
          setIsFollowing(true);
          setFollowerCount((prev: number) => prev + 1);
        }
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
    <>
      <TouchableOpacity
        activeOpacity={1}
        onPress={onCoverPress}
        style={{ height: 200, width: '100%' }}
      />
      <View style={{ backgroundColor: theme.colors.surface, paddingBottom: 20 }}>
        {/* Avatar Section */}
        <View style={{ paddingHorizontal: 20, marginTop: -60, alignItems: 'center' }}>
          <View
            style={{
              padding: 4,
              backgroundColor: theme.colors.surface,
              borderRadius: 70,
              elevation: 8,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.3,
              shadowRadius: 10,
            }}>
            <TouchableOpacity onPress={() => setViewerVisible(true)}>
              <Image
                source={{ uri: profile.avatar }}
                style={{
                  width: 120,
                  height: 120,
                  borderRadius: 60,
                  borderWidth: 4,
                  borderColor: '#000',
                }}
              />
            </TouchableOpacity>
          </View>

          <ImageView
            images={[{ uri: profile.avatar }]}
            imageIndex={0}
            visible={viewerVisible}
            onRequestClose={() => setViewerVisible(false)}
            HeaderComponent={() => (
              <View
                style={{
                  flexDirection: 'row',
                  justifyContent: 'flex-end',
                  padding: 20,
                  paddingTop: 50,
                }}>
                <TouchableOpacity
                  onPress={() => downloadAndSaveImage(profile.avatar)}
                  style={{
                    backgroundColor: 'rgba(0,0,0,0.5)',
                    padding: 10,
                    borderRadius: 25,
                  }}>
                  <Ionicons name="download-outline" size={24} color="#fff" />
                </TouchableOpacity>
              </View>
            )}
          />

          <View style={{ marginTop: 16, alignItems: 'center' }}>
            <Text
              style={{
                fontSize: 26,
                fontWeight: 'bold',
                color: theme.colors.onSurface,
                marginTop: 12,
              }}>
              {profile.fullname}
            </Text>
            <Text style={{ color: theme.colors.primary, fontWeight: '600', fontSize: 15 }}>
              {'@' + profile.username}
            </Text>
            <Text
              style={{
                color: theme.colors.onSurface,
                marginTop: 8,
                textAlign: 'center',
                paddingHorizontal: 30,
                fontSize: 14,
                lineHeight: 20,
              }}>
              {profile.story}
            </Text>

            {profile.address && (
              <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 8 }}>
                <Ionicons name="location-outline" size={14} color={theme.colors.onSurfaceVariant} />
                <Text style={{ color: theme.colors.onSurfaceVariant, fontSize: 13, marginLeft: 4 }}>
                  {profile.address}
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* Stats Row */}
        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'space-around',
            width: '100%',
            marginTop: 32,
            paddingHorizontal: 20,
          }}>
          <View style={{ alignItems: 'center' }}>
            <Text style={{ fontSize: 20, fontWeight: 'bold', color: theme.colors.onSurface }}>
              {postCount}
            </Text>
            <Text
              style={{
                fontSize: 10,
                fontWeight: 'bold',
                color: theme.colors.onSurfaceVariant,
                textTransform: 'uppercase',
                letterSpacing: 1.5,
              }}>
              Posts
            </Text>
          </View>
          <View style={{ alignItems: 'center' }}>
            <Text style={{ fontSize: 20, fontWeight: 'bold', color: theme.colors.onSurface }}>
              {followerCount}
            </Text>
            <Text
              style={{
                fontSize: 10,
                fontWeight: 'bold',
                color: theme.colors.onSurfaceVariant,
                textTransform: 'uppercase',
                letterSpacing: 1.5,
              }}>
              Followers
            </Text>
          </View>
          <View style={{ alignItems: 'center' }}>
            <Text style={{ fontSize: 20, fontWeight: 'bold', color: theme.colors.onSurface }}>
              {profile.following?.length || 0}
            </Text>
            <Text
              style={{
                fontSize: 10,
                fontWeight: 'bold',
                color: theme.colors.onSurfaceVariant,
                textTransform: 'uppercase',
                letterSpacing: 1.5,
              }}>
              Following
            </Text>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={{ flexDirection: 'row', marginTop: 32, paddingHorizontal: 20, gap: 10 }}>
          {isOwner ? (
            <>
              <TouchableOpacity
                onPress={() => setShowEditModal(true)}
                style={{
                  flex: 1,
                  backgroundColor: theme.colors.primary,
                  paddingVertical: 12,
                  borderRadius: 30,
                  alignItems: 'center',
                  elevation: 2,
                }}>
                <Text style={{ color: theme.colors.onPrimary, fontWeight: 'bold', fontSize: 14 }}>
                  Edit
                </Text>
              </TouchableOpacity>

              {profile.followRequests && profile.followRequests.length > 0 && (
                <TouchableOpacity
                  onPress={() => navigation.navigate('FollowRequests')}
                  style={{
                    flex: 1,
                    backgroundColor: theme.colors.secondaryContainer,
                    paddingVertical: 12,
                    borderRadius: 30,
                    alignItems: 'center',
                    elevation: 2,
                  }}>
                  <Text
                    style={{
                      color: theme.colors.onSecondaryContainer,
                      fontWeight: 'bold',
                      fontSize: 14,
                    }}>
                    Requests ({profile.followRequests.length})
                  </Text>
                </TouchableOpacity>
              )}

              <TouchableOpacity
                onPress={logout}
                style={{
                  flex: 1,
                  backgroundColor: 'rgba(255, 68, 68, 0.1)',
                  paddingVertical: 12,
                  borderRadius: 30,
                  alignItems: 'center',
                  borderWidth: 1,
                  borderColor: 'rgba(255, 68, 68, 0.2)',
                }}>
                <Text style={{ color: '#ff4444', fontWeight: 'bold', fontSize: 14 }}>Logout</Text>
              </TouchableOpacity>
            </>
          ) : (
            <>
              <TouchableOpacity
                onPress={handleFollowToggle}
                style={{
                  flex: 1,
                  backgroundColor: isFollowing
                    ? theme.colors.surfaceVariant
                    : isRequested
                      ? theme.colors.surfaceVariant
                      : theme.colors.primary,
                  paddingVertical: 12,
                  borderRadius: 30,
                  alignItems: 'center',
                  elevation: 2,
                  borderWidth: isRequested ? 1 : 0,
                  borderColor: theme.colors.outlineVariant,
                }}>
                <Text
                  style={{
                    color:
                      isFollowing || isRequested
                        ? theme.colors.onSurfaceVariant
                        : theme.colors.onPrimary,
                    fontWeight: 'bold',
                    fontSize: 14,
                  }}>
                  {isFollowing ? 'Unfollow' : isRequested ? 'Requested' : 'Follow'}
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
                  padding: 12,
                  backgroundColor: theme.colors.surface,
                  borderWidth: 1,
                  borderColor: theme.colors.outlineVariant,
                  borderRadius: 30,
                  alignItems: 'center',
                }}>
                <Ionicons name="mail-outline" size={22} color={theme.colors.onSurface} />
              </TouchableOpacity>
            </>
          )}

          <TouchableOpacity
            onPress={() =>
              navigation.navigate('UserPostMap', {
                targetUserId: profile._id,
              })
            }
            style={{
              padding: 12,
              backgroundColor: theme.colors.surface,
              borderWidth: 1,
              borderColor: theme.colors.outlineVariant,
              borderRadius: 30,
              alignItems: 'center',
            }}>
            <Ionicons name="location-outline" size={22} color={theme.colors.onSurface} />
          </TouchableOpacity>

          {isOwner && (
            <TouchableOpacity
              onPress={() => setShowThemeModal(true)}
              style={{
                padding: 12,
                backgroundColor: theme.colors.surface,
                borderWidth: 1,
                borderColor: theme.colors.outlineVariant,
                borderRadius: 30,
                alignItems: 'center',
              }}>
              <Ionicons name="color-palette-outline" size={22} color={theme.colors.onSurface} />
            </TouchableOpacity>
          )}
        </View>

        {/* Theme Switching Modal */}
        <Modal
          visible={showThemeModal}
          transparent
          animationType="fade"
          onRequestClose={() => setShowThemeModal(false)}>
          <TouchableOpacity
            style={{
              flex: 1,
              backgroundColor: 'rgba(0,0,0,0.5)',
              justifyContent: 'center',
              alignItems: 'center',
            }}
            activeOpacity={1}
            onPress={() => setShowThemeModal(false)}>
            <TouchableOpacity
              activeOpacity={1}
              style={{
                width: '85%',
                backgroundColor: theme.colors.surface,
                borderRadius: 20,
                padding: 24,
                elevation: 5,
              }}>
              <View
                style={{
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: 20,
                }}>
                <Text style={{ fontSize: 20, fontWeight: 'bold', color: theme.colors.onSurface }}>
                  Appearance
                </Text>
                <TouchableOpacity onPress={() => setShowThemeModal(false)}>
                  <Ionicons name="close" size={24} color={theme.colors.onSurfaceVariant} />
                </TouchableOpacity>
              </View>
              <ThemeSwitcher />

              <Divider style={{ marginVertical: 20, opacity: 0.5 }} />

              <View
                style={{
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}>
                <View style={{ flex: 1, marginRight: 16 }}>
                  <Text
                    style={{
                      fontSize: 16,
                      fontWeight: '600',
                      color: theme.colors.onSurface,
                    }}>
                    Immersive Effects
                  </Text>
                  <Text
                    style={{
                      fontSize: 12,
                      color: theme.colors.onSurfaceVariant,
                      marginTop: 2,
                    }}>
                    Enable ambient lighting and blurs. Disable for better performance.
                  </Text>
                </View>
                <Switch
                  value={isAmbientEnabled}
                  onValueChange={toggleAmbientMode}
                  color={theme.colors.primary}
                />
              </View>
            </TouchableOpacity>
          </TouchableOpacity>
        </Modal>

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
    </>
  );
};

export default ProfileHeader;
