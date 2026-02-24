import React, { useState, useEffect } from 'react';
import {
  View,
  TextInput,
  Image,
  StyleSheet,
  Alert,
  ScrollView,
  TouchableOpacity,
  Text,
  ActivityIndicator,
  Modal,
  Platform,
  Switch,
  DeviceEventEmitter,
} from 'react-native';
import { useTheme } from 'react-native-paper';
import { useNavigation, useRoute } from '@react-navigation/native';
import { updatePostAPI } from '../api/postAPI';
import { searchUser as searchUserAPI } from '../api/userAPI';
import { imageUpload } from '../utils/imageUpload';
import { Video, ResizeMode } from 'expo-av';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import * as ExpoLocation from 'expo-location';
import { getReadableAddress, getRobustLocation } from '../utils/locationHelper';
import LocationAutocomplete from '../components/LocationAutocomplete';
import { POST_BACKGROUNDS, TEXT_COLORS, FONT_SIZES } from '../constants/postTheme';
import { LinearGradient } from 'expo-linear-gradient';
import DateTimePicker from '@react-native-community/datetimepicker';
import moment from 'moment';

const EditPostScreen = () => {
  const navigation = useNavigation();
  const theme = useTheme();
  const route = useRoute();
  const params = route.params as any;

  // Persist post and callback in state so they survive re-navigation/param-merging
  // post will be null/undefined on future renders IF params are lost, but useState stays
  const [initialPost] = useState(params?.post);
  const [persistedOnPostUpdate] = useState(() => params?.onPostUpdate);

  // Safety check: if we're in edit mode but post is missing, we must go back
  useEffect(() => {
    if (!initialPost) {
      console.warn('[EditPostScreen] Initial post is missing! Navigation params likely lost.');
      Alert.alert('Error', 'Post data lost. Please try again.');
      navigation.goBack();
    }
  }, [initialPost]);

  console.log('[EditPostScreen] Render params:', {
    hasPostParam: !!params?.post,
    hasInitialPost: !!initialPost,
    hasPickedLocation: !!params?.pickedLocation,
  });

  const [content, setContent] = useState(initialPost?.content || '');
  const [images, setImages] = useState<any[]>(initialPost?.images || []);
  const [videoUri, setVideoUri] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [isHD, setIsHD] = useState(false);
  const [address, setAddress] = useState(initialPost?.address || '');
  const [locationCoords, setLocationCoords] = useState<any>(
    initialPost?.location?.coordinates || null
  );
  const [showLocationSearch, setShowLocationSearch] = useState(false);

  // Background & Text Style State
  const [selectedBgId, setSelectedBgId] = useState(initialPost?.background || 'default');
  const [textColor, setTextColor] = useState(
    initialPost?.textStyle?.color || theme.colors.onSurface
  );
  const [fontSize, setFontSize] = useState(initialPost?.textStyle?.fontSize || 24);
  const [showStyleControls, setShowStyleControls] = useState(false);

  // Poll State
  const [showPollCreator, setShowPollCreator] = useState(!!initialPost?.poll_question);
  const [pollQuestion, setPollQuestion] = useState(initialPost?.poll_question || '');
  const [pollOptions, setPollOptions] = useState(
    initialPost?.poll_options?.map((opt: any) => opt.text) || ['', '']
  );

  // Mention State
  const [mentionsUsers, setMentionsUsers] = useState<any[]>([]);
  const [mentionLoading, setMentionLoading] = useState(false);
  const [mentionStartPos, setMentionStartPos] = useState<number | null>(null);
  const [cursorPos, setCursorPos] = useState(0);

  const handleContentChange = (text: string) => {
    setContent(text);

    const textBeforeCursor = text.substring(0, cursorPos);
    const lastAtIndex = textBeforeCursor.lastIndexOf('@');

    if (lastAtIndex !== -1) {
      const query = textBeforeCursor.substring(lastAtIndex + 1);
      if (!query.includes(' ')) {
        setMentionStartPos(lastAtIndex);
        handleSearchUsers(query);
      } else {
        setMentionsUsers([]);
        setMentionStartPos(null);
      }
    } else {
      setMentionsUsers([]);
      setMentionStartPos(null);
    }
  };

  const handleSearchUsers = async (query: string) => {
    try {
      setMentionLoading(true);
      const res = await searchUserAPI(query);
      setMentionsUsers(res.users || []);
    } catch (err) {
      console.error('Mention search error:', err);
    } finally {
      setMentionLoading(false);
    }
  };

  const insertMention = (username: string) => {
    if (mentionStartPos === null) return;

    const textBeforeMention = content.substring(0, mentionStartPos);
    const textAfterMention = content.substring(cursorPos);
    const newContent = `${textBeforeMention}@${username} ${textAfterMention}`;

    setContent(newContent);
    setMentionsUsers([]);
    setMentionStartPos(null);
  };

  const [postDate, setPostDate] = useState(new Date(initialPost?.createdAt || Date.now()));
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [datePickerMode, setDatePickerMode] = useState<'date' | 'time'>('date');

  const onDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(Platform.OS === 'ios');
    if (selectedDate) {
      setPostDate(selectedDate);
    }
  };

  const showMode = (currentMode: 'date' | 'time') => {
    setShowDatePicker(true);
    setDatePickerMode(currentMode);
  };

  const activeBg = POST_BACKGROUNDS.find((b) => b.id === selectedBgId) || POST_BACKGROUNDS[0];
  const isDefaultBg = selectedBgId === 'default';

  // Toggle text color default based on background (only if changing BG, not initial load - slightly diff from Create)
  // Actually, let's keep it simple: manual override is fine, but maybe auto-switch if user picks a BG.
  // We can replicate the CreatePost effect safely.
  useEffect(() => {
    if (showStyleControls) {
      // Only auto-switch if user is interacting
      if (selectedBgId !== 'default') {
        if (textColor === '#000000' || textColor === theme.colors.onSurface)
          setTextColor('#FFFFFF');
      } else {
        if (textColor === '#FFFFFF') setTextColor(theme.colors.onSurface);
      }
    }
  }, [selectedBgId]);

  // Listen for location picked from map via DeviceEventEmitter
  useEffect(() => {
    const subscription = DeviceEventEmitter.addListener('onLocationPicked', (locationData: any) => {
      console.log('[EditPostScreen] Location received from event:', locationData.address);
      setAddress(locationData.address);
      setLocationCoords([locationData.longitude, locationData.latitude]);
    });
    return () => subscription.remove();
  }, []);

  // YouTube Input State
  const [showYoutubeInput, setShowYoutubeInput] = useState(false);
  const [youtubeLink, setYoutubeLink] = useState('');

  const handleAddYoutubeLink = () => {
    if (!youtubeLink.trim()) {
      setShowYoutubeInput(false);
      return;
    }
    if (!youtubeLink.includes('youtube.com') && !youtubeLink.includes('youtu.be')) {
      Alert.alert('Invalid Link', 'Please enter a valid YouTube URL.');
      return;
    }

    const newContent = content ? `${content}\n\n${youtubeLink}` : youtubeLink;
    setContent(newContent);
    setYoutubeLink('');
    setShowYoutubeInput(false);
  };

  // Separate new images (local URIs) from old images (server URLs)
  // Actually, for simplicity in UI, we treat them all as images to display.
  // But for upload, we need to distinguish.
  // The `imageUpload` function likely takes an array of files/uris.
  // Existing images are objects { url: '...' }, new images are strings 'file://...'

  const pickImages = async () => {
    try {
      if (videoUri) {
        Alert.alert('Limit Reached', 'You cannot add images when a video is selected.');
        return;
      }
      const { granted } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!granted) {
        Alert.alert('Permission denied', 'You must allow access to media library.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsMultipleSelection: true,
        selectionLimit: 8 - images.length,
        quality: 1,
      });

      if (!result.canceled) {
        if (images.length + result.assets.length > 8) {
          Alert.alert('You can only upload up to 8 images.');
          return;
        }

        const uris = result.assets.map((asset) => asset.uri);
        setImages((prev) => [...prev, ...uris]);
      }
    } catch (error) {
      console.error('🔥 Image picker error:', error);
      Alert.alert('Error', 'Something went wrong while picking images.');
    }
  };

  const pickVideo = async () => {
    try {
      if (images.length > 0) {
        Alert.alert('Limit Reached', 'You cannot add a video when images are selected.');
        return;
      }
      if (selectedBgId !== 'default') {
        Alert.alert(
          'Not Allowed',
          'You cannot add a video when a custom background is selected. Please remove the background first.'
        );
        return;
      }
      if (videoUri) {
        Alert.alert('Limit Reached', 'You can only upload one video at a time.');
        return;
      }

      const { granted } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!granted) {
        Alert.alert('Permission denied', 'You must allow access to media library.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Videos,
        allowsEditing: true,
        quality: 1,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setVideoUri(result.assets[0].uri);
      }
    } catch (error) {
      console.error('🔥 Video picker error:', error);
      Alert.alert('Error', 'Something went wrong while picking video.');
    }
  };

  const takePhoto = async () => {
    try {
      if (videoUri) {
        Alert.alert('Limit Reached', 'You cannot add images when a video is selected.');
        return;
      }
      const { granted } = await ImagePicker.requestCameraPermissionsAsync();
      if (!granted) {
        Alert.alert('Permission denied', 'You must allow access to camera.');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 1,
      });

      if (!result.canceled && result.assets.length > 0) {
        if (images.length >= 8) {
          Alert.alert('You can only upload up to 8 images.');
          return;
        }
        const uri = result.assets[0].uri;
        setImages((prev) => [...prev, uri]);
      }
    } catch (error) {
      console.error('🔥 Camera error:', error);
      Alert.alert('Error', 'Something went wrong while using the camera.');
    }
  };

  const removeImage = (indexToRemove: number) => {
    setImages((prev) => prev.filter((_, i) => i !== indexToRemove));
  };

  const moveImage = (index: number, direction: 'left' | 'right') => {
    const newImages = [...images];
    const targetIndex = direction === 'left' ? index - 1 : index + 1;

    if (targetIndex < 0 || targetIndex >= newImages.length) return;

    const temp = newImages[index];
    newImages[index] = newImages[targetIndex];
    newImages[targetIndex] = temp;

    setImages(newImages);
  };

  const addPollOption = () => {
    if (pollOptions.length < 5) {
      setPollOptions([...pollOptions, '']);
    }
  };

  const updatePollOption = (text: string, index: number) => {
    const newOptions = [...pollOptions];
    newOptions[index] = text;
    setPollOptions(newOptions);
  };

  const removePollOption = (index: number) => {
    if (pollOptions.length > 2) {
      setPollOptions(pollOptions.filter((_: string, i: number) => i !== index));
    }
  };

  const handleGetCurrentLocation = async () => {
    try {
      let { status } = await ExpoLocation.getForegroundPermissionsAsync();
      if (status !== 'granted') {
        const result = await ExpoLocation.requestForegroundPermissionsAsync();
        status = result.status;
      }

      if (status !== 'granted') {
        Alert.alert('Permission denied', 'You must allow location access.');
        return;
      }

      setLoading(true);
      const loc = await getRobustLocation();
      if (!loc) {
        Alert.alert('Error', 'Could not get location.');
        setLoading(false);
        return;
      }
      const { latitude, longitude } = loc.coords;
      const addr = await getReadableAddress(latitude, longitude);

      setAddress(addr);
      setLocationCoords([longitude, latitude]);
      setShowLocationSearch(false);
    } catch (error) {
      console.error('📍 Location error:', error);
      Alert.alert('Error getting location.');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async () => {
    if (!content && images.length === 0 && !videoUri && !address && !pollQuestion) {
      Alert.alert('Post must have content, image, video, location, or poll.');
      return;
    }

    if (showPollCreator) {
      if (!pollQuestion.trim()) {
        Alert.alert('Error', 'Please enter a poll question.');
        return;
      }
      const validOptions = pollOptions.filter((opt: string) => opt.trim().length > 0);
      if (validOptions.length < 2) {
        Alert.alert('Error', 'Please provide at least 2 poll options.');
        return;
      }
    }

    setLoading(true);

    try {
      let media: any[] = [];
      const newImages = images.filter((img) => typeof img === 'string');
      const oldImages = images.filter((img) => typeof img !== 'string');

      if (videoUri) {
        if (videoUri.startsWith('file://')) {
          media = await imageUpload([{ uri: videoUri, type: 'video' }], isHD);
        } else {
          media = [{ url: videoUri, resource_type: 'video' }];
        }
      } else if (images.length > 0) {
        // We must preserve ORDER.
        // Identify new images, upload them, then rebuild the array in order.
        const newImageItems = images
          .map((img, idx) => ({ img, idx }))
          .filter((item) => typeof item.img === 'string');

        if (newImageItems.length > 0) {
          const uploaded = await imageUpload(
            newImageItems.map((item) => item.img),
            isHD
          );
          // Map back to original order
          media = images.map((img) => {
            if (typeof img === 'string') {
              const uploadedIdx = newImageItems.findIndex((item) => item.img === img);
              return uploaded[uploadedIdx];
            }
            return img;
          });
        } else {
          media = images;
        }
      }

      const updatedData = {
        content,
        images: media,
        address,
        location: locationCoords ? { type: 'Point', coordinates: locationCoords } : undefined,
        background: selectedBgId !== 'default' ? selectedBgId : undefined,
        textStyle: {
          fontSize,
          color: (isDefaultBg && textColor === theme.colors.onSurface
            ? undefined
            : textColor) as any,
          fontWeight: 'bold',
        },
        poll_question: showPollCreator ? pollQuestion.trim() : undefined,
        poll_options: showPollCreator
          ? pollOptions
              .filter((opt: string) => opt.trim().length > 0)
              .map((opt: string) => ({ text: opt.trim() }))
          : undefined,
        createdAt: postDate.toISOString(),
      };
      const res = await updatePostAPI(initialPost?._id, updatedData);

      if (persistedOnPostUpdate) {
        persistedOnPostUpdate(res.newPost);
      }

      Alert.alert('Success', 'Post updated successfully', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (err: any) {
      console.error('❌ Error updating post:', err);
      Alert.alert('Failed to update', err?.response?.data?.msg || 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView
      contentContainerStyle={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View
        style={[
          styles.inputRow,
          {
            borderColor: theme.colors.outlineVariant,
            borderWidth: 1,
            borderRadius: 8,
            paddingHorizontal: 10,
            paddingVertical: 6,
          },
        ]}>
        {!isDefaultBg ? (
          <LinearGradient
            colors={activeBg.colors as any}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[
              styles.input,
              { justifyContent: 'center', alignItems: 'center', minHeight: 200 },
            ]}>
            <TextInput
              style={{
                fontSize: fontSize,
                color: textColor,
                fontWeight: 'bold',
                textAlign: 'center',
                width: '100%',
              }}
              placeholder="What's on your mind?"
              placeholderTextColor="rgba(255,255,255,0.7)"
              value={content}
              onChangeText={handleContentChange}
              onSelectionChange={(e) => setCursorPos(e.nativeEvent.selection.start)}
              multiline
            />
          </LinearGradient>
        ) : (
          <TextInput
            style={[
              styles.input,
              { fontSize: fontSize, color: textColor, backgroundColor: theme.colors.surface },
            ]}
            placeholder="What's on your mind?"
            placeholderTextColor={theme.colors.onSurfaceVariant}
            value={content}
            onChangeText={handleContentChange}
            onSelectionChange={(e) => setCursorPos(e.nativeEvent.selection.start)}
            multiline
          />
        )}
      </View>

      {/* Mention Suggestions */}
      {mentionsUsers.length > 0 && (
        <View style={[styles.mentionsContainer, { backgroundColor: theme.colors.surface }]}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {mentionsUsers.map((user) => (
              <TouchableOpacity
                key={user._id}
                style={styles.mentionItem}
                onPress={() => insertMention(user.username)}>
                <Image source={{ uri: user.avatar }} style={styles.mentionAvatar} />
                <Text style={{ color: theme.colors.onSurface, fontSize: 13 }}>
                  @{user.username}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}

      {/* Date & Time Picker Buttons */}
      <View style={styles.datePickerContainer}>
        <Text style={[styles.dateLabel, { color: theme.colors.onSurfaceVariant }]}>
          Post Date: {moment(postDate).format('llll')}
        </Text>
        <View style={styles.dateButtons}>
          <TouchableOpacity onPress={() => showMode('date')} style={styles.datePickerButton}>
            <Ionicons name="calendar-outline" size={20} color={theme.colors.primary} />
            <Text style={[styles.datePickerButtonText, { color: theme.colors.primary }]}>
              Change Date
            </Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => showMode('time')} style={styles.datePickerButton}>
            <Ionicons name="time-outline" size={20} color={theme.colors.primary} />
            <Text style={[styles.datePickerButtonText, { color: theme.colors.primary }]}>
              Change Time
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {showDatePicker && (
        <DateTimePicker
          testID="dateTimePicker"
          value={postDate}
          mode={datePickerMode}
          is24Hour={true}
          display="default"
          onChange={onDateChange}
        />
      )}

      <View
        style={[
          styles.actionsRow,
          {
            borderTopColor: theme.colors.outlineVariant,
            borderBottomColor: theme.colors.outlineVariant,
          },
        ]}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ alignItems: 'center', paddingRight: 20 }}>
          <TouchableOpacity onPress={pickImages} style={styles.iconButton}>
            <Ionicons name="image-outline" size={24} color="#4CAF50" />
            <Text style={[styles.iconText, { color: theme.colors.onSurfaceVariant }]}>Photo</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={takePhoto} style={styles.iconButton}>
            <Ionicons name="camera-outline" size={24} color="#FF9800" />
            <Text style={[styles.iconText, { color: theme.colors.onSurfaceVariant }]}>Camera</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={pickVideo} style={styles.iconButton}>
            <Ionicons name="videocam-outline" size={24} color="#E91E63" />
            <Text style={[styles.iconText, { color: theme.colors.onSurfaceVariant }]}>Video</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => setShowYoutubeInput(true)} style={styles.iconButton}>
            <Ionicons name="logo-youtube" size={24} color={theme.colors.error} />
            <Text style={[styles.iconText, { color: theme.colors.onSurfaceVariant }]}>YouTube</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setShowLocationSearch(!showLocationSearch)}
            style={styles.iconButton}>
            <Ionicons
              name="location-outline"
              size={24}
              color={address ? theme.colors.primary : theme.colors.onSurfaceVariant}
            />
            <Text style={[styles.iconText, { color: theme.colors.onSurfaceVariant }]}>
              Location
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setShowStyleControls(!showStyleControls)}
            style={styles.iconButton}>
            <Ionicons name="color-palette-outline" size={24} color="#9C27B0" />
            <Text style={[styles.iconText, { color: theme.colors.onSurfaceVariant }]}>Style</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setShowPollCreator(!showPollCreator)}
            style={styles.iconButton}>
            <Ionicons name="stats-chart" size={24} color="#FF9800" />
            <Text style={[styles.iconText, { color: theme.colors.onSurfaceVariant }]}>Poll</Text>
          </TouchableOpacity>

          <View style={styles.hdToggleContainer}>
            <Text style={[styles.hdToggleText, { color: theme.colors.onSurfaceVariant }]}>HD</Text>
            <Switch
              value={isHD}
              onValueChange={setIsHD}
              trackColor={{ false: theme.colors.onSurfaceVariant, true: theme.colors.primary }}
              thumbColor={theme.colors.surface}
            />
          </View>
        </ScrollView>
      </View>

      {/* Style Controls */}
      {showStyleControls && (
        <View
          style={[
            styles.styleControlsContainer,
            { backgroundColor: theme.colors.surface, borderColor: theme.colors.outlineVariant },
          ]}>
          <Text style={[styles.styleLabel, { color: theme.colors.onSurfaceVariant }]}>
            Background
          </Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.styleScroll}>
            {POST_BACKGROUNDS.map((bg) => (
              <TouchableOpacity
                key={bg.id}
                onPress={() => {
                  if (bg.id !== 'default' && (images.length > 0 || videoUri)) {
                    Alert.alert(
                      'Not Allowed',
                      'Special backgrounds are only for text-only posts. Please remove media first.'
                    );
                    return;
                  }
                  setSelectedBgId(bg.id);
                }}
                style={[
                  styles.styleOption,
                  selectedBgId === bg.id && [
                    styles.styleOptionActive,
                    { borderColor: theme.colors.primary },
                  ],
                ]}>
                {bg.colors.length > 1 ? (
                  <LinearGradient colors={bg.colors as any} style={styles.colorCircle} />
                ) : (
                  <View
                    style={[
                      styles.colorCircle,
                      {
                        backgroundColor: bg.colors[0],
                        borderWidth: 1,
                        borderColor: theme.colors.outlineVariant,
                      },
                    ]}
                  />
                )}
              </TouchableOpacity>
            ))}
          </ScrollView>

          <Text style={[styles.styleLabel, { color: theme.colors.onSurfaceVariant }]}>
            Text Color
          </Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.styleScroll}>
            {TEXT_COLORS.map((color) => (
              <TouchableOpacity
                key={color}
                onPress={() => {
                  if (color === 'default') {
                    setTextColor(theme.colors.onSurface);
                  } else {
                    setTextColor(color);
                  }
                }}
                style={[
                  styles.styleOption,
                  (textColor === color ||
                    (color === 'default' && textColor === theme.colors.onSurface)) && [
                    styles.styleOptionActive,
                    { borderColor: theme.colors.primary },
                  ],
                ]}>
                <View
                  style={[
                    styles.colorCircle,
                    {
                      backgroundColor: color === 'default' ? theme.colors.onSurface : color,
                      borderWidth: 1,
                      borderColor: theme.colors.outlineVariant,
                    },
                  ]}>
                  {color === 'default' && (
                    <Ionicons
                      name="refresh"
                      size={16}
                      color={theme.colors.surface}
                      style={{ alignSelf: 'center', marginTop: 6 }}
                    />
                  )}
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>

          <Text style={[styles.styleLabel, { color: theme.colors.onSurfaceVariant }]}>
            Font Size
          </Text>
          <View style={styles.fontSizeContainer}>
            {FONT_SIZES.map((size) => (
              <TouchableOpacity
                key={size}
                onPress={() => setFontSize(size)}
                style={[
                  styles.fontSizeBtn,
                  { backgroundColor: theme.colors.surfaceVariant },
                  fontSize === size && [
                    styles.fontSizeBtnActive,
                    { backgroundColor: theme.colors.primary },
                  ],
                ]}>
                <Text
                  style={{
                    fontSize: 14 + (size - 16) / 2,
                    fontWeight: 'bold',
                    color: fontSize === size ? theme.colors.onPrimary : theme.colors.onSurface,
                  }}>
                  A
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}

      {showLocationSearch && (
        <View
          style={[
            styles.locationSearchContainer,
            {
              backgroundColor: theme.colors.surfaceVariant,
              borderColor: theme.colors.outlineVariant,
            },
          ]}>
          <LocationAutocomplete
            onLocationSelect={(addr, coords) => {
              setAddress(addr);
              setLocationCoords(coords as any);
            }}
            initialValue={address}
            placeholder="Search location..."
          />
          <TouchableOpacity onPress={handleGetCurrentLocation} style={styles.gpsBtn}>
            <Ionicons name="locate" size={20} color={theme.colors.primary} />
            <Text style={[styles.gpsBtnText, { color: theme.colors.primary }]}>Use GPS</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => navigation.navigate('Map' as any, { pickLocation: true } as any)}
            style={[styles.gpsBtn, { marginTop: 8 }]}>
            <Ionicons name="map-outline" size={20} color={theme.colors.primary} />
            <Text style={[styles.gpsBtnText, { color: theme.colors.primary }]}>Pick on Map</Text>
          </TouchableOpacity>
          {address !== '' && (
            <TouchableOpacity
              onPress={() => {
                setAddress('');
                setLocationCoords(null);
              }}
              style={styles.clearLocBtn}>
              <Text style={[styles.clearLocText, { color: theme.colors.error }]}>
                Clear Location
              </Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      {address !== '' && !showLocationSearch && (
        <View
          style={[
            styles.taggedLocationBadge,
            { backgroundColor: theme.colors.errorContainer, borderColor: theme.colors.error },
          ]}>
          <Ionicons name="location" size={16} color={theme.colors.error} />
          <Text
            style={[styles.taggedLocationText, { color: theme.colors.onErrorContainer }]}
            numberOfLines={1}>
            {address}
          </Text>
          <TouchableOpacity
            onPress={() => {
              setAddress('');
              setLocationCoords(null);
            }}>
            <Ionicons
              name="close-circle"
              size={18}
              color={theme.colors.onSurfaceVariant}
              style={{ marginLeft: 5 }}
            />
          </TouchableOpacity>
        </View>
      )}

      {/* Poll Creator */}
      {showPollCreator && (
        <View
          style={[
            styles.pollCreatorContainer,
            {
              backgroundColor: theme.colors.surfaceVariant,
              borderColor: theme.colors.outlineVariant,
            },
          ]}>
          <TextInput
            style={[
              styles.pollQuestionInput,
              { color: theme.colors.onSurface, borderBottomColor: theme.colors.outlineVariant },
            ]}
            placeholder="Ask a question..."
            placeholderTextColor={theme.colors.onSurfaceVariant}
            value={pollQuestion}
            onChangeText={setPollQuestion}
            multiline
          />
          {pollOptions.map((option: string, index: number) => (
            <View
              key={index}
              style={[
                styles.pollOptionInputRow,
                { backgroundColor: theme.colors.surface, borderColor: theme.colors.outlineVariant },
              ]}>
              <Ionicons name="radio-button-off" size={20} color={theme.colors.onSurfaceVariant} />
              <TextInput
                style={[styles.pollOptionInput, { color: theme.colors.onSurface }]}
                placeholder={`Option ${index + 1}`}
                placeholderTextColor={theme.colors.onSurfaceVariant}
                value={option}
                onChangeText={(text) => updatePollOption(text, index)}
              />
              {pollOptions.length > 2 && (
                <TouchableOpacity onPress={() => removePollOption(index)}>
                  <Ionicons name="close-circle" size={20} color="#FF3B30" />
                </TouchableOpacity>
              )}
            </View>
          ))}
          {pollOptions.length < 5 && (
            <TouchableOpacity onPress={addPollOption} style={styles.addOptionBtn}>
              <Ionicons name="add-circle-outline" size={20} color={theme.colors.primary} />
              <Text style={[styles.addOptionTxt, { color: theme.colors.primary }]}>Add Option</Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      <View style={styles.imageGrid}>
        {images.map((img: any, index: number) => (
          <View key={index} style={styles.imageWrapper}>
            <Image
              source={{ uri: typeof img === 'string' ? img : img.url }}
              style={styles.preview}
            />
            <TouchableOpacity onPress={() => removeImage(index)} style={styles.removeBtn}>
              <Text style={styles.removeText}>✖</Text>
            </TouchableOpacity>

            <View style={styles.reorderBtns}>
              {index > 0 && (
                <TouchableOpacity
                  onPress={() => moveImage(index, 'left')}
                  style={styles.reorderBtn}>
                  <Ionicons name="chevron-back" size={16} color="#fff" />
                </TouchableOpacity>
              )}
              {index < images.length - 1 && (
                <TouchableOpacity
                  onPress={() => moveImage(index, 'right')}
                  style={styles.reorderBtn}>
                  <Ionicons name="chevron-forward" size={16} color="#fff" />
                </TouchableOpacity>
              )}
            </View>
          </View>
        ))}

        {videoUri && (
          <View style={[styles.imageWrapper, { width: 120, height: 120 }]}>
            <Video
              source={{ uri: videoUri }}
              style={{ width: '100%', height: '100%', borderRadius: 6, backgroundColor: '#000' }}
              resizeMode={ResizeMode.COVER}
              isLooping={false}
              useNativeControls={false}
              shouldPlay={false}
            />
            <View
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                justifyContent: 'center',
                alignItems: 'center',
              }}>
              <Ionicons name="play-circle" size={30} color="#fff" />
            </View>
            <TouchableOpacity onPress={() => setVideoUri(null)} style={styles.removeBtn}>
              <Text style={styles.removeText}>✖</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      <TouchableOpacity
        onPress={handleUpdate}
        style={[
          styles.updateButton,
          { backgroundColor: theme.colors.primary },
          loading && [styles.disabledButton, { backgroundColor: theme.colors.surfaceVariant }],
        ]}
        disabled={loading}>
        {loading ? (
          <ActivityIndicator color={theme.colors.onPrimary} />
        ) : (
          <Text style={[styles.updateButtonText, { color: theme.colors.onPrimary }]}>
            Update Post
          </Text>
        )}
      </TouchableOpacity>

      <Modal
        visible={showYoutubeInput}
        transparent
        animationType="fade"
        onRequestClose={() => setShowYoutubeInput(false)}>
        <View style={styles.modalBg}>
          <View style={[styles.modalContainer, { backgroundColor: theme.colors.surface }]}>
            <Text style={[styles.modalTitle, { color: theme.colors.onSurface }]}>
              Add YouTube Link
            </Text>
            <TextInput
              style={[
                styles.modalInput,
                {
                  backgroundColor: theme.colors.surfaceVariant,
                  borderColor: theme.colors.outlineVariant,
                  color: theme.colors.onSurface,
                },
              ]}
              placeholder="Paste YouTube URL here..."
              placeholderTextColor={theme.colors.onSurfaceVariant}
              value={youtubeLink}
              onChangeText={setYoutubeLink}
              autoCapitalize="none"
            />
            <View style={styles.modalActions}>
              <TouchableOpacity
                onPress={() => setShowYoutubeInput(false)}
                style={styles.modalBtnCancel}>
                <Text style={[styles.modalBtnTextCancel, { color: theme.colors.onSurfaceVariant }]}>
                  Cancel
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleAddYoutubeLink}
                style={[styles.modalBtnAdd, { backgroundColor: theme.colors.primary }]}>
                <Text style={[styles.modalBtnTextAdd, { color: theme.colors.onPrimary }]}>Add</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
};

export default EditPostScreen;

const styles = StyleSheet.create({
  container: {
    padding: 16,
    flexGrow: 1,
  },
  inputRow: {
    marginBottom: 20,
  },
  input: {
    fontSize: 18,
    minHeight: 100,
    textAlignVertical: 'top',
  },
  actionsRow: {
    flexDirection: 'row',
    marginBottom: 20,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    paddingVertical: 10,
  },
  iconButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 20,
  },
  iconText: {
    marginLeft: 5,
    fontSize: 14,
  },
  imageGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 20,
  },
  imageWrapper: {
    position: 'relative',
    marginRight: 10,
    marginBottom: 10,
  },
  preview: {
    width: 100,
    height: 100,
    borderRadius: 8,
  },
  removeBtn: {
    position: 'absolute',
    top: 5,
    right: 5,
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: 12,
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  removeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  reorderBtns: {
    position: 'absolute',
    bottom: 2,
    left: 2,
    right: 2,
    flexDirection: 'row',
    justifyContent: 'space-between',
    zIndex: 1,
  },
  reorderBtn: {
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 12,
    padding: 2,
  },
  updateButton: {
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  disabledButton: {},
  updateButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  modalBg: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    width: '80%',
    borderRadius: 12,
    padding: 20,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
    textAlign: 'center',
  },
  modalInput: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 10,
    marginBottom: 20,
    fontSize: 16,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  modalBtnCancel: {
    marginRight: 15,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  modalBtnTextCancel: {
    fontWeight: '600',
  },
  modalBtnAdd: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 6,
  },
  modalBtnTextAdd: {
    color: '#fff',
    fontWeight: 'bold',
  },
  hdToggleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 'auto',
  },
  hdToggleText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#666',
    marginRight: 4,
  },
  locationSearchContainer: {
    marginBottom: 20,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
  },
  gpsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    paddingVertical: 5,
  },
  gpsBtnText: {
    marginLeft: 5,
    color: '#007AFF',
    fontWeight: '600',
  },
  clearLocBtn: {
    marginTop: 10,
    alignSelf: 'flex-end',
  },
  clearLocText: {
    color: '#FF3B30',
    fontSize: 12,
  },
  taggedLocationBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    marginBottom: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
  },
  taggedLocationText: {
    fontSize: 14,
    color: '#FF5722',
    marginLeft: 4,
    maxWidth: 250,
  },
  styleControlsContainer: {
    marginBottom: 20,
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
  },
  styleLabel: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#666',
    marginBottom: 8,
    marginTop: 4,
  },
  styleScroll: {
    marginBottom: 12,
    flexDirection: 'row',
  },
  styleOption: {
    marginRight: 10,
    padding: 2,
    borderRadius: 15,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  styleOptionActive: {
    borderColor: '#007AFF',
  },
  colorCircle: {
    width: 30,
    height: 30,
    borderRadius: 15,
  },
  fontSizeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  fontSizeBtn: {
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 18,
  },
  fontSizeBtnActive: {
    backgroundColor: '#007AFF',
  },
  pollCreatorContainer: {
    marginTop: 10,
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 20,
  },
  pollQuestionInput: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    paddingVertical: 5,
  },
  pollOptionInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderWidth: 1,
  },
  pollOptionInput: {
    flex: 1,
    marginLeft: 10,
    fontSize: 14,
  },
  addOptionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 5,
    paddingVertical: 5,
  },
  addOptionTxt: {
    marginLeft: 5,
    color: '#007AFF',
    fontWeight: '600',
    fontSize: 14,
  },
  datePickerContainer: {
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    marginBottom: 10,
  },
  dateLabel: {
    fontSize: 14,
    marginBottom: 10,
    fontWeight: '500',
  },
  dateButtons: {
    flexDirection: 'row',
    gap: 10,
  },
  datePickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f2f5',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  datePickerButtonText: {
    marginLeft: 6,
    fontSize: 14,
    fontWeight: '600',
  },
  mentionsContainer: {
    maxHeight: 120,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    paddingVertical: 5,
  },
  mentionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    marginRight: 10,
    borderRadius: 8,
  },
  mentionAvatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
    marginRight: 6,
  },
});
