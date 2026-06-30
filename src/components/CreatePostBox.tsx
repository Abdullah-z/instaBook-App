// src/components/CreatePostBox.tsx
import { Image } from 'expo-image';
import React, { useState } from 'react';
import { View, TextInput, StyleSheet, Alert, ScrollView, TouchableOpacity, Text, ActivityIndicator, Modal, Keyboard, PermissionsAndroid, Platform, Switch, DeviceEventEmitter } from 'react-native';
import { useTheme } from 'react-native-paper';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Video, ResizeMode } from 'expo-av';
import { createPostAPI } from '../api/postAPI';
import { searchUser as searchUserAPI } from '../api/userAPI';
import { imageUpload } from '../utils/imageUpload';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import * as ExpoLocation from 'expo-location';
import { getMapPreview } from '../utils/getMapPreview';
import { getReadableAddress, getRobustLocation } from '../utils/locationHelper';
import LocationAutocomplete from './LocationAutocomplete';
import { POST_BACKGROUNDS, TEXT_COLORS, FONT_SIZES } from '../constants/postTheme';
import { LinearGradient } from 'expo-linear-gradient';
import { addOpacity } from '../utils/colorUtils';

const SUGGESTION_COLOR_KEYS = ['primary', 'secondary', 'tertiary', 'error'] as const;

interface Props {
  onPostCreated: (newPost: any) => void;
  initialPostType?: 'feed' | 'story' | 'both';
}

const CreatePostBox: React.FC<Props> = ({ onPostCreated, initialPostType = 'feed' }) => {
  const theme = useTheme();
  const navigation = useNavigation<any>();
  const [content, setContent] = useState('');
  const [images, setImages] = useState<string[]>([]);
  const [videoUri, setVideoUri] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [locationAddress, setLocationAddress] = useState('');
  const [locationCoords, setLocationCoords] = useState<[number, number] | null>(null);
  const [showLocationSearch, setShowLocationSearch] = useState(false);

  // YouTube Input State
  const [showYoutubeInput, setShowYoutubeInput] = useState(false);
  const [youtubeLink, setYoutubeLink] = useState('');
  const [isHD, setIsHD] = useState(false);
  const [postType, setPostType] = useState<'feed' | 'story' | 'both'>(initialPostType);

  // Background & Text Style State
  const [selectedBgId, setSelectedBgId] = useState('default');
  const [textColor, setTextColor] = useState(theme.colors.onSurface);
  const [fontSize, setFontSize] = useState(16);
  const [showStyleControls, setShowStyleControls] = useState(false);

  // Poll State
  const [showPollCreator, setShowPollCreator] = useState(false);
  const [pollQuestion, setPollQuestion] = useState('');
  const [pollOptions, setPollOptions] = useState(['', '']);

  // Mention State
  const [mentionsUsers, setMentionsUsers] = useState<any[]>([]);
  const [mentionLoading, setMentionLoading] = useState(false);
  const [mentionStartPos, setMentionStartPos] = useState<number | null>(null);
  const [mentionQuery, setMentionQuery] = useState('');
  const [cursorPos, setCursorPos] = useState(0);

  const activeBg = POST_BACKGROUNDS.find((b) => b.id === selectedBgId) || POST_BACKGROUNDS[0];
  const isDefaultBg = selectedBgId === 'default';

  const route = useRoute<any>();

  // Listen for location picked from map via DeviceEventEmitter
  React.useEffect(() => {
    const subscription = DeviceEventEmitter.addListener('onLocationPicked', (locationData: any) => {
      console.log('[CreatePostBox] Location received from event:', locationData.address);
      setLocationAddress(locationData.address);
      setLocationCoords([locationData.longitude, locationData.latitude]);
    });
    return () => subscription.remove();
  }, []);

  // Toggle text color default based on background
  React.useEffect(() => {
    if (selectedBgId !== 'default') {
      setTextColor('#FFFFFF'); // Default to white for colored backgrounds
      setFontSize(30); // Default larger font
    } else {
      // In default mode, we don't want to lock in a specific color string
      // unless the user manually picked one.
      // Setting it to a dummy value or null would be better, but we need
      // the UI to show the current theme color.
      // The logic in handlePost will handle NOT saving it.
      setTextColor(theme.colors.onSurface);
      setFontSize(16);
    }
  }, [selectedBgId, theme.colors.onSurface]);

  const handleAddYoutubeLink = () => {
    if (!youtubeLink.trim()) {
      setShowYoutubeInput(false);
      return;
    }
    // simple check
    if (!youtubeLink.includes('youtube.com') && !youtubeLink.includes('youtu.be')) {
      Alert.alert('Invalid Link', 'Please enter a valid YouTube URL.');
      return;
    }

    const newContent = content ? `${content}\n\n${youtubeLink}` : youtubeLink;
    setContent(newContent);
    setYoutubeLink('');
    setShowYoutubeInput(false);
  };

  const handleContentChange = (text: string) => {
    setContent(text);

    // Mention detection
    const lastChar = text[cursorPos - 1];
    const textBeforeCursor = text.substring(0, cursorPos);
    const lastAtIndex = textBeforeCursor.lastIndexOf('@');

    if (lastAtIndex !== -1) {
      const query = textBeforeCursor.substring(lastAtIndex + 1);
      // Ensure no spaces between @ and cursor
      if (!query.includes(' ')) {
        setMentionStartPos(lastAtIndex);
        setMentionQuery(query);
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

  const pickImages = async () => {
    try {
      if (videoUri) {
        Alert.alert('Limit Reached', 'You cannot add images when a video is selected.');
        return;
      }
      if (selectedBgId !== 'default') {
        Alert.alert(
          'Not Allowed',
          'You cannot add images when a custom background is selected. Please remove the background first.'
        );
        return;
      }
      const { granted } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!granted) {
        Alert.alert('Permission denied', 'You must allow access to media library.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
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
        mediaTypes: ['videos'],
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
        Alert.alert('Error', 'Could not get current location.');
        setLoading(false);
        return;
      }
      const { latitude, longitude } = loc.coords;
      const address = await getReadableAddress(latitude, longitude);

      setLocationAddress(address);
      setLocationCoords([longitude, latitude]);
      setShowLocationSearch(false);
    } catch (error) {
      console.error('📍 Location error:', error);
      Alert.alert('Error getting location.');
    } finally {
      setLoading(false);
    }
  };

  const takePhoto = async () => {
    console.log('📸 Camera button pressed');
    try {
      console.log('Current state - videoUri:', videoUri, 'images.length:', images.length);

      if (videoUri) {
        console.log('Blocked: video selected');
        Alert.alert('Limit Reached', 'You cannot add images when a video is selected.');
        return;
      }
      if (selectedBgId !== 'default') {
        Alert.alert(
          'Not Allowed',
          'You cannot take photos when a custom background is selected. Please remove the background first.'
        );
        return;
      }
      if (images.length >= 8) {
        console.log('Blocked: max images');
        Alert.alert('Limit Reached', 'You can only upload up to 8 images.');
        return;
      }

      let cameraGranted = false;
      let mediaGranted = false;

      if (Platform.OS === 'android') {
        console.log('Step 1: Requesting Android Camera Permission directly...');
        const cameraRes = await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.CAMERA, {
          title: 'Camera Permission',
          message: 'App needs access to your camera to take photos.',
          buttonNeutral: 'Ask Me Later',
          buttonNegative: 'Cancel',
          buttonPositive: 'OK',
        });
        cameraGranted = cameraRes === PermissionsAndroid.RESULTS.GRANTED;
        console.log('Android Camera permission:', cameraRes);

        console.log('Step 2: Checking Media Library (Images)...');
        // For Android 13+, we need READ_MEDIA_IMAGES. Below that READ_EXTERNAL_STORAGE.
        // expo-image-picker usually handles this well, but let's try their requester again now
        // that we know where it hangs.
        const mediaStatus = await ImagePicker.requestMediaLibraryPermissionsAsync();
        mediaGranted = mediaStatus.status === 'granted';
        console.log('Media library permission status:', mediaStatus.status);
      } else {
        const cameraStatus = await ImagePicker.requestCameraPermissionsAsync();
        cameraGranted = cameraStatus.status === 'granted';
        const mediaStatus = await ImagePicker.requestMediaLibraryPermissionsAsync();
        mediaGranted = mediaStatus.status === 'granted';
      }

      if (!cameraGranted || !mediaGranted) {
        console.log('Permissions NOT granted:', { cameraGranted, mediaGranted });
        Alert.alert('Permission denied', 'You must allow access to camera and media library.');
        return;
      }

      console.log('Launching camera...');
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ['images'],
        quality: 1,
      });
      console.log('Camera result:', result);

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const uri = result.assets[0].uri;
        console.log('Adding image:', uri);
        setImages((prev) => [...prev, uri]);
      } else {
        console.log('Camera canceled or no assets');
      }
    } catch (error) {
      console.error('🔥 Camera error:', error);
      Alert.alert('Error', `Camera failed: ${error}`);
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
      setPollOptions(pollOptions.filter((_, i) => i !== index));
    }
  };

  const handlePost = async () => {
    if (!content && images.length === 0 && !locationAddress && !pollQuestion) {
      Alert.alert('Post must have content, image, location, or poll.');
      return;
    }

    if (showPollCreator) {
      if (!pollQuestion.trim()) {
        Alert.alert('Error', 'Please enter a poll question.');
        return;
      }
      const validOptions = pollOptions.filter((opt) => opt.trim().length > 0);
      if (validOptions.length < 2) {
        Alert.alert('Error', 'Please provide at least 2 poll options.');
        return;
      }
    }

    setLoading(true);

    try {
      let media: any[] = [];
      if (videoUri) {
        // Upload Video
        media = await imageUpload([{ uri: videoUri, type: 'video' }], isHD);
      } else if (Array.isArray(images) && images.length > 0) {
        // Upload Images
        media = await imageUpload(images, isHD);
      }

      const res = await createPostAPI({
        content: content.trim(),
        images: media,
        postType,
        address: locationAddress,
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
          ? pollOptions.filter((opt) => opt.trim().length > 0).map((opt) => ({ text: opt.trim() }))
          : undefined,
      });
      onPostCreated(res.newPost);
      setPostType('feed');
      setPollQuestion('');
      setPollOptions(['', '']);
      setShowPollCreator(false);
    } catch (err: any) {
      console.error('❌ Error creating post:', err);
      Alert.alert('Failed to post', err?.response?.data?.msg || 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const shouldShowPost =
    content.trim().length > 0 ||
    images.length > 0 ||
    videoUri ||
    locationAddress ||
    pollQuestion.trim().length > 0;

  return (
    <ScrollView
      contentContainerStyle={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={styles.inputSection}>
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
              {
                fontSize: fontSize,
                color: textColor,
                backgroundColor: theme.colors.surface,
                minHeight: 120,
              },
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
            {mentionsUsers.map((user, index) => (
              <TouchableOpacity
                key={user._id}
                style={[
                  styles.mentionItem,
                  {
                    backgroundColor: addOpacity(
                      theme.colors.secondaryContainer,
                      theme.dark ? 0.15 : 0.05
                    ),
                  },
                ]}
                onPress={() => insertMention(user.username)}>
                <Image source={{ uri: user.avatar }} style={styles.mentionAvatar} />
                <Text
                  style={{
                    color: (theme.colors as any)[
                      SUGGESTION_COLOR_KEYS[index % SUGGESTION_COLOR_KEYS.length]
                    ],
                    fontSize: 13,
                    fontWeight: '600',
                  }}>
                  @{user.username}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}

      <View
        style={[
          styles.toolbar,
          { backgroundColor: theme.colors.surface, borderTopColor: theme.colors.outlineVariant },
        ]}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <TouchableOpacity onPress={pickImages} style={styles.toolbarIcon} disabled={!isDefaultBg}>
            <Ionicons name="image-outline" size={26} color={!isDefaultBg ? '#ccc' : '#4CAF50'} />
          </TouchableOpacity>

          <TouchableOpacity onPress={takePhoto} style={styles.toolbarIcon} disabled={!isDefaultBg}>
            <Ionicons name="camera-outline" size={26} color={!isDefaultBg ? '#ccc' : '#FF9800'} />
          </TouchableOpacity>

          <TouchableOpacity onPress={pickVideo} style={styles.toolbarIcon} disabled={!isDefaultBg}>
            <Ionicons name="videocam-outline" size={26} color={!isDefaultBg ? '#ccc' : '#E91E63'} />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setShowStyleControls(!showStyleControls)}
            style={styles.toolbarIcon}>
            <Ionicons name="color-palette-outline" size={26} color="#9C27B0" />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setShowLocationSearch(!showLocationSearch)}
            style={styles.toolbarIcon}>
            <Ionicons
              name="location-outline"
              size={26}
              color={locationAddress ? '#FF5722' : '#aaa'}
            />
          </TouchableOpacity>

          <TouchableOpacity onPress={() => setShowYoutubeInput(true)} style={styles.toolbarIcon}>
            <Ionicons name="logo-youtube" size={26} color={theme.colors.error} />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setShowPollCreator(!showPollCreator)}
            style={styles.toolbarIcon}>
            <Ionicons name="stats-chart" size={26} color="#FF9800" />
          </TouchableOpacity>

          <View style={styles.toolbarHdToggle}>
            <Text style={[styles.hdToggleText, { color: theme.colors.onSurfaceVariant }]}>HD</Text>
            <Switch
              value={isHD}
              onValueChange={setIsHD}
              trackColor={{ false: theme.colors.onSurfaceVariant, true: theme.colors.primary }}
              thumbColor={theme.colors.surface}
              style={{ transform: [{ scaleX: 0.7 }, { scaleY: 0.7 }] }}
            />
          </View>
        </ScrollView>

        {shouldShowPost &&
          (loading ? (
            <View style={styles.loadingIndicator}>
              <ActivityIndicator size="small" color={theme.colors.primary} />
            </View>
          ) : (
            <TouchableOpacity onPress={handlePost} style={styles.postIcon}>
              <MaterialIcons name="send" size={28} color={theme.colors.primary} />
            </TouchableOpacity>
          ))}
      </View>

      {/* Poll Creator */}
      {showPollCreator && (
        <View style={styles.pollCreatorContainer}>
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
          {pollOptions.map((option, index) => (
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
              setLocationAddress(addr);
              setLocationCoords(coords);
            }}
            initialValue={locationAddress}
            placeholder="Search location..."
          />
          <TouchableOpacity onPress={handleGetCurrentLocation} style={styles.gpsBtn}>
            <Ionicons name="locate" size={20} color={theme.colors.primary} />
            <Text style={[styles.gpsBtnText, { color: theme.colors.primary }]}>Use GPS</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => navigation.navigate('Map', { pickLocation: true })}
            style={[styles.gpsBtn, { marginTop: 8 }]}>
            <Ionicons name="map-outline" size={20} color={theme.colors.primary} />
            <Text style={[styles.gpsBtnText, { color: theme.colors.primary }]}>Pick on Map</Text>
          </TouchableOpacity>
          {locationAddress !== '' && (
            <TouchableOpacity
              onPress={() => {
                setLocationAddress('');
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

      {locationAddress !== '' && !showLocationSearch && (
        <View
          style={[
            styles.taggedLocationBadge,
            { backgroundColor: theme.colors.errorContainer, borderColor: theme.colors.error },
          ]}>
          <Ionicons name="location" size={16} color={theme.colors.error} />
          <Text
            style={[styles.taggedLocationText, { color: theme.colors.onErrorContainer }]}
            numberOfLines={1}>
            {locationAddress}
          </Text>
          <TouchableOpacity
            onPress={() => {
              setLocationAddress('');
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

      <View style={styles.postTypeContainer}>
        <Text style={[styles.postTypeLabel, { color: theme.colors.onSurface }]}>Post to:</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <TouchableOpacity
            style={[
              styles.postTypeBtn,
              {
                backgroundColor: theme.colors.surfaceVariant,
                borderColor: theme.colors.outlineVariant,
              },
              postType === 'feed' && [
                styles.postTypeBtnActive,
                { backgroundColor: theme.colors.primary, borderColor: theme.colors.primary },
              ],
            ]}
            onPress={() => setPostType('feed')}>
            <Text
              style={[
                styles.postTypeTxt,
                { color: theme.colors.onSurfaceVariant },
                postType === 'feed' && [
                  styles.postTypeTxtActive,
                  { color: theme.colors.onPrimary },
                ],
              ]}>
              Feed
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.postTypeBtn,
              {
                backgroundColor: theme.colors.surfaceVariant,
                borderColor: theme.colors.outlineVariant,
              },
              postType === 'story' && [
                styles.postTypeBtnActive,
                { backgroundColor: theme.colors.primary, borderColor: theme.colors.primary },
              ],
            ]}
            onPress={() => setPostType('story')}>
            <Text
              style={[
                styles.postTypeTxt,
                { color: theme.colors.onSurfaceVariant },
                postType === 'story' && [
                  styles.postTypeTxtActive,
                  { color: theme.colors.onPrimary },
                ],
              ]}>
              Story
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.postTypeBtn,
              {
                backgroundColor: theme.colors.surfaceVariant,
                borderColor: theme.colors.outlineVariant,
              },
              postType === 'both' && [
                styles.postTypeBtnActive,
                { backgroundColor: theme.colors.primary, borderColor: theme.colors.primary },
              ],
            ]}
            onPress={() => setPostType('both')}>
            <Text
              style={[
                styles.postTypeTxt,
                { color: theme.colors.onSurfaceVariant },
                postType === 'both' && [
                  styles.postTypeTxtActive,
                  { color: theme.colors.onPrimary },
                ],
              ]}>
              Both
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </View>

      <View style={styles.imageGrid}>
        {images.map((uri, index) => (
          <View key={index} style={styles.imageWrapper}>
            <Image source={{ uri }} style={styles.preview} />
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
              useNativeControls={false} // Just a thumbnail preview
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

      {/* YouTube Link Modal/Input */}
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

export default CreatePostBox;

const styles = StyleSheet.create({
  container: {
    padding: 10,
  },
  inputSection: {
    padding: 15,
  },
  input: {
    width: '100%',
    padding: 10,
    fontSize: 16,
    borderRadius: 12,
  },
  toolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingVertical: 12,
    borderTopWidth: 1,
  },
  toolbarIcon: {
    marginRight: 20,
    padding: 4,
  },
  toolbarHdToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 10,
  },
  postIcon: {
    marginLeft: 10,
    padding: 4,
  },
  imageGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 10,
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
  removeBtn: {
    position: 'absolute',
    top: 2,
    right: 2,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 12,
    paddingHorizontal: 4,
    paddingVertical: 2,
    zIndex: 1,
  },
  removeText: {
    color: '#fff',
    fontSize: 12,
  },
  loadingIndicator: {
    paddingLeft: 10,
    justifyContent: 'center',
    alignItems: 'center',
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
    fontWeight: 'bold',
  },
  hdToggleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 10,
  },
  hdToggleText: {
    fontSize: 12,
    fontWeight: 'bold',
    marginRight: 2,
  },
  postTypeContainer: {
    marginTop: 10,
    marginBottom: 5,
  },
  postTypeLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  postTypeBtn: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
    marginRight: 10,
    borderWidth: 1,
  },
  postTypeBtnActive: {},
  postTypeTxt: {
    fontSize: 14,
  },
  postTypeTxtActive: {
    fontWeight: 'bold',
  },
  locationSearchContainer: {
    marginTop: 10,
    padding: 10,
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
    fontWeight: '600',
  },
  clearLocBtn: {
    marginTop: 10,
    alignSelf: 'flex-end',
  },
  clearLocText: {
    fontSize: 12,
  },
  taggedLocationBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    marginTop: 10,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 15,
    borderWidth: 1,
  },
  taggedLocationText: {
    fontSize: 13,
    marginLeft: 4,
    maxWidth: 250,
  },
  pollCreatorContainer: {
    marginTop: 10,
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
  },
  pollQuestionInput: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
    borderBottomWidth: 1,
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
    fontWeight: '600',
    fontSize: 14,
  },
  styleControlsContainer: {
    marginTop: 10,
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
  },
  styleLabel: {
    fontSize: 13,
    fontWeight: 'bold',
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
  styleOptionActive: {},
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
  fontSizeBtnActive: {},
  mentionsContainer: {
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    paddingHorizontal: 10,
  },
  mentionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 10,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
  },
  mentionAvatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
    marginRight: 6,
  },
});
