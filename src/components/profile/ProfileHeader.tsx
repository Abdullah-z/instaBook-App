import React, { useState, useContext } from 'react';
import { View, Text, TouchableOpacity, Linking, Modal } from 'react-native';
import { Image } from 'expo-image';
import ImageView from 'react-native-image-viewing';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Avatar, useTheme, Switch, Divider } from 'react-native-paper';
import { followUserAPI, unfollowUserAPI } from '../../api/profileAPI';
import { AuthContext } from '../../auth/AuthContext';
import useSocketStore from '../../store/useSocketStore';
import { createNotification } from '../../api/notificationAPI';
import { Ionicons } from '@expo/vector-icons';
import EditProfileModal from './EditProfileModal';
import ThemeSwitcher from '../ThemeSwitcher';
import { downloadAndSaveImage } from '../../utils/MediaUtils';
import moment from 'moment';
import { addOpacity } from '../../utils/colorUtils';
import Animated, {
  FadeIn,
  FadeInDown,
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withSequence,
} from 'react-native-reanimated';

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
  const { user, logout, isAmbientEnabled, toggleAmbientMode, isGridViewEnabled, toggleGridView } =
    useContext(AuthContext);
  const navigation = useNavigation<any>();
  const theme = useTheme();

  const scale = useSharedValue(1);

  const buttonAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const animatePress = () => {
    scale.value = withSequence(withSpring(0.92), withSpring(1));
  };

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
    animatePress();
    try {
      if (isFollowing) {
        await unfollowUserAPI(profile._id);
        setIsFollowing(false);
        setFollowerCount((prev: number) => prev - 1);
      } else if (isRequested) {
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
          <Animated.View
            entering={FadeInDown.duration(600).springify()}
            style={{
              padding: 4,
              backgroundColor: theme.colors.surface,
              borderRadius: 65,
              elevation: 4,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.15,
              shadowRadius: 12,
            }}>
            <TouchableOpacity onPress={() => setViewerVisible(true)} activeOpacity={0.9}>
              <Image
                source={{ uri: profile.avatar }}
                style={{
                  width: 120,
                  height: 120,
                  borderRadius: 60,
                  borderWidth: 2,
                  borderColor: theme.colors.outlineVariant,
                }}
                contentFit="cover"
                cachePolicy="memory-disk"
              />
            </TouchableOpacity>
          </Animated.View>

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

          <Animated.Text
            entering={FadeIn.delay(200)}
            style={{
              fontSize: 28,
              fontWeight: '900',
              color: theme.colors.onSurface,
              textAlign: 'center',
              letterSpacing: -0.5,
            }}>
            {profile.fullname}
          </Animated.Text>
          <Animated.Text
            entering={FadeIn.delay(300)}
            style={{
              color: theme.colors.primary,
              fontWeight: '800',
              fontSize: 14,
              marginTop: 0,
              opacity: 0.9,
            }}>
            {'@' + profile.username}
          </Animated.Text>
          {profile.story ? (
            <Animated.Text
              entering={FadeIn.delay(400)}
              style={{
                color: theme.colors.onSurface,
                marginTop: 12,
                textAlign: 'center',
                paddingHorizontal: 20,
                fontSize: 14,
                lineHeight: 20,
              }}>
              {profile.story}
            </Animated.Text>
          ) : null}

          {/* Metadata Row */}
          <Animated.View
            entering={FadeInDown.delay(500)}
            style={{
              flexDirection: 'row',
              flexWrap: 'wrap',
              justifyContent: 'center',
              alignItems: 'center',
              marginTop: 18,
              gap: 8,
            }}>
            {profile.address && (
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  backgroundColor: addOpacity(theme.colors.onSurfaceVariant, 0.05),
                  paddingHorizontal: 10,
                  paddingVertical: 4,
                  borderRadius: 20,
                }}>
                <Ionicons name="location" size={14} color={theme.colors.primary} />
                <Text
                  style={{
                    color: theme.colors.onSurface,
                    fontSize: 12,
                    marginLeft: 4,
                    fontWeight: '700',
                  }}>
                  {profile.address}
                </Text>
              </View>
            )}

            {profile.website && (
              <TouchableOpacity
                onPress={() => Linking.openURL(profile.website)}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  backgroundColor: addOpacity(theme.colors.primary, 0.1),
                  paddingHorizontal: 10,
                  paddingVertical: 4,
                  borderRadius: 20,
                }}>
                <Ionicons name="link" size={14} color={theme.colors.primary} />
                <Text
                  style={{
                    color: theme.colors.primary,
                    fontSize: 12,
                    marginLeft: 4,
                    fontWeight: '800',
                  }}>
                  {profile.website.replace(/^https?:\/\//, '')}
                </Text>
              </TouchableOpacity>
            )}

            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                backgroundColor: addOpacity(theme.colors.onSurfaceVariant, 0.05),
                paddingHorizontal: 10,
                paddingVertical: 4,
                borderRadius: 20,
              }}>
              <Ionicons name="calendar" size={14} color={theme.colors.onSurfaceVariant} />
              <Text
                style={{
                  color: theme.colors.onSurfaceVariant,
                  fontSize: 12,
                  marginLeft: 4,
                  fontWeight: '600',
                }}>
                Joined {moment(profile.createdAt).format('MMM YYYY')}
              </Text>
            </View>
          </Animated.View>
        </View>

        {/* Stats Row */}
        <Animated.View
          entering={FadeInDown.delay(600).springify()}
          style={{
            flexDirection: 'row',
            justifyContent: 'center',
            width: '100%',
            marginTop: 24,
            paddingHorizontal: 20,
            gap: 12,
          }}>
          <View
            style={{
              flex: 1,
              alignItems: 'center',
              backgroundColor: theme.colors.surfaceVariant,
              paddingVertical: 12,
              borderRadius: 20,
            }}>
            <Text style={{ fontSize: 22, fontWeight: '900', color: theme.colors.onSurface }}>
              {postCount}
            </Text>
            <Text
              style={{
                fontSize: 10,
                fontWeight: '800',
                color: theme.colors.onSurfaceVariant,
                textTransform: 'uppercase',
                letterSpacing: 1,
                marginTop: 2,
              }}>
              Posts
            </Text>
          </View>
          <View
            style={{
              flex: 1,
              alignItems: 'center',
              backgroundColor: theme.colors.surfaceVariant,
              paddingVertical: 12,
              borderRadius: 20,
            }}>
            <Text style={{ fontSize: 22, fontWeight: '900', color: theme.colors.onSurface }}>
              {followerCount}
            </Text>
            <Text
              style={{
                fontSize: 10,
                fontWeight: '800',
                color: theme.colors.onSurfaceVariant,
                textTransform: 'uppercase',
                letterSpacing: 1,
                marginTop: 2,
              }}>
              Followers
            </Text>
          </View>
          <View
            style={{
              flex: 1,
              alignItems: 'center',
              backgroundColor: theme.colors.surfaceVariant,
              paddingVertical: 12,
              borderRadius: 20,
            }}>
            <Text style={{ fontSize: 22, fontWeight: '900', color: theme.colors.onSurface }}>
              {profile.following?.length || 0}
            </Text>
            <Text
              style={{
                fontSize: 10,
                fontWeight: '800',
                color: theme.colors.onSurfaceVariant,
                textTransform: 'uppercase',
                letterSpacing: 1,
                marginTop: 2,
              }}>
              Following
            </Text>
          </View>
        </Animated.View>

        {/* Action Buttons */}
        <View style={{ flexDirection: 'row', marginTop: 24, paddingHorizontal: 20, gap: 10 }}>
          {isOwner ? (
            <>
              <TouchableOpacity
                onPress={() => setShowEditModal(true)}
                style={{
                  flex: 1,
                  backgroundColor: theme.colors.primary,
                  paddingVertical: 14,
                  borderRadius: 20,
                  alignItems: 'center',
                  elevation: 2,
                  flexDirection: 'row',
                  justifyContent: 'center',
                }}>
                <Ionicons
                  name="create"
                  size={18}
                  color={theme.colors.onPrimary}
                  style={{ marginRight: 6 }}
                />
                <Text style={{ color: theme.colors.onPrimary, fontWeight: '900', fontSize: 14 }}>
                  Edit
                </Text>
              </TouchableOpacity>

              {profile.followRequests && profile.followRequests.length > 0 && (
                <TouchableOpacity
                  onPress={() => navigation.navigate('FollowRequests')}
                  style={{
                    flex: 1,
                    backgroundColor: theme.colors.secondaryContainer,
                    paddingVertical: 14,
                    borderRadius: 20,
                    alignItems: 'center',
                    elevation: 2,
                  }}>
                  <Text
                    style={{
                      color: theme.colors.onSecondaryContainer,
                      fontWeight: '900',
                      fontSize: 14,
                    }}>
                    Requests ({profile.followRequests.length})
                  </Text>
                </TouchableOpacity>
              )}

              <TouchableOpacity
                onPress={logout}
                style={{
                  padding: 14,
                  backgroundColor: addOpacity(theme.colors.error, 0.1),
                  borderRadius: 20,
                  alignItems: 'center',
                  borderWidth: 1,
                  borderColor: addOpacity(theme.colors.error, 0.2),
                }}>
                <Ionicons name="log-out-outline" size={22} color={theme.colors.error} />
              </TouchableOpacity>
            </>
          ) : (
            <>
              <Animated.View style={[{ flex: 1 }, buttonAnimatedStyle]}>
                <TouchableOpacity
                  onPress={handleFollowToggle}
                  style={{
                    flex: 1,
                    backgroundColor: isFollowing
                      ? theme.colors.surfaceVariant
                      : isRequested
                        ? theme.colors.surfaceVariant
                        : theme.colors.primary,
                    paddingVertical: 14,
                    borderRadius: 20,
                    alignItems: 'center',
                    elevation: 2,
                    borderWidth: isRequested ? 1 : 0,
                    borderColor: theme.colors.outlineVariant,
                    flexDirection: 'row',
                    justifyContent: 'center',
                  }}>
                  <Ionicons
                    name={isFollowing ? 'person-remove' : isRequested ? 'time' : 'person-add'}
                    size={18}
                    color={
                      isFollowing || isRequested
                        ? theme.colors.onSurfaceVariant
                        : theme.colors.onPrimary
                    }
                    style={{ marginRight: 8 }}
                  />
                  <Text
                    style={{
                      color:
                        isFollowing || isRequested
                          ? theme.colors.onSurfaceVariant
                          : theme.colors.onPrimary,
                      fontWeight: '900',
                      fontSize: 14,
                    }}>
                    {isFollowing ? 'Unfollow' : isRequested ? 'Requested' : 'Follow'}
                  </Text>
                </TouchableOpacity>
              </Animated.View>

              <TouchableOpacity
                onPress={() =>
                  navigation.navigate('Chat', {
                    userId: profile._id,
                    username: profile.username,
                  })
                }
                style={{
                  padding: 14,
                  backgroundColor: theme.colors.surface,
                  borderWidth: 1,
                  borderColor: theme.colors.outlineVariant,
                  borderRadius: 20,
                  alignItems: 'center',
                }}>
                <Ionicons name="chatbubble-ellipses" size={22} color={theme.colors.primary} />
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
              padding: 14,
              backgroundColor: theme.colors.surface,
              borderWidth: 1,
              borderColor: theme.colors.outlineVariant,
              borderRadius: 20,
              alignItems: 'center',
            }}>
            <Ionicons name="map" size={22} color={theme.colors.onSurface} />
          </TouchableOpacity>

          {isOwner && (
            <TouchableOpacity
              onPress={() => setShowThemeModal(true)}
              style={{
                padding: 14,
                backgroundColor: theme.colors.surface,
                borderWidth: 1,
                borderColor: theme.colors.outlineVariant,
                borderRadius: 20,
                alignItems: 'center',
              }}>
              <Ionicons name="color-palette" size={22} color={theme.colors.onSurface} />
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
                    Post Grid Layout
                  </Text>
                  <Text
                    style={{
                      fontSize: 12,
                      color: theme.colors.onSurfaceVariant,
                      marginTop: 2,
                    }}>
                    Use Facebook-style grid for multiple images. Disable for carousel.
                  </Text>
                </View>
                <Switch
                  value={isGridViewEnabled}
                  onValueChange={toggleGridView}
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
