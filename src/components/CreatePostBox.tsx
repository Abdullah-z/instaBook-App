// src/components/CreatePostBox.tsx
import React, { useState } from 'react';
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
  Keyboard,
  PermissionsAndroid,
  Platform,
  Switch,
} from 'react-native';
import { Video, ResizeMode } from 'expo-av';
import { createPostAPI } from '../api/postAPI';
import { imageUpload } from '../utils/imageUpload';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import * as ExpoLocation from 'expo-location';
import { getMapPreview } from '../utils/getMapPreview';
import { getReadableAddress, getRobustLocation } from '../utils/locationHelper';
import LocationAutocomplete from './LocationAutocomplete';

interface Props {
  onPostCreated: (newPost: any) => void;
  initialPostType?: 'feed' | 'story' | 'both';
}

const CreatePostBox: React.FC<Props> = ({ onPostCreated, initialPostType = 'feed' }) => {
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
        mediaTypes: ['images'],
        allowsMultipleSelection: true,
        selectionLimit: 4 - images.length,
        quality: 1,
      });

      if (!result.canceled) {
        if (images.length + result.assets.length > 4) {
          Alert.alert('You can only upload up to 4 images.');
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
      if (images.length >= 4) {
        console.log('Blocked: max images');
        Alert.alert('Limit Reached', 'You can only upload up to 4 images.');
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

  const handlePost = async () => {
    if (!content && images.length === 0 && !locationAddress) {
      Alert.alert('Post must have content, image or location.');
      return;
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
      });
      onPostCreated(res.newPost);
      setContent('');
      setImages([]);
      setVideoUri(null);
      setLocationAddress('');
      setLocationCoords(null);
      setIsHD(false);
      setPostType('feed');
    } catch (err: any) {
      console.error('❌ Error creating post:', err);
      Alert.alert('Failed to post', err?.response?.data?.msg || 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const shouldShowPost =
    content.trim().length > 0 || images.length > 0 || videoUri || locationAddress;

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.inputRow}>
        <TextInput
          style={styles.input}
          placeholder="What's on your mind?"
          value={content}
          onChangeText={setContent}
          multiline
        />

        <TouchableOpacity onPress={pickImages} style={styles.iconInsideInput}>
          <Ionicons name="image-outline" size={24} color="#4CAF50" />
        </TouchableOpacity>

        <TouchableOpacity onPress={takePhoto} style={styles.iconInsideInput}>
          <Ionicons name="camera-outline" size={24} color="#FF9800" />
        </TouchableOpacity>

        <TouchableOpacity onPress={pickVideo} style={styles.iconInsideInput}>
          <Ionicons name="videocam-outline" size={24} color="#E91E63" />
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => setShowLocationSearch(!showLocationSearch)}
          style={styles.iconInsideInput}>
          <Ionicons
            name="location-outline"
            size={24}
            color={locationAddress ? '#FF5722' : '#aaa'}
          />
        </TouchableOpacity>

        <TouchableOpacity onPress={() => setShowYoutubeInput(true)} style={styles.iconInsideInput}>
          <Ionicons name="logo-youtube" size={24} color="#F44336" />
        </TouchableOpacity>

        <View style={styles.hdToggleContainer}>
          <Text style={styles.hdToggleText}>HD</Text>
          <Switch
            value={isHD}
            onValueChange={setIsHD}
            trackColor={{ false: '#767577', true: '#4CAF50' }}
            thumbColor={isHD ? '#fff' : '#f4f3f4'}
            style={{ transform: [{ scaleX: 0.8 }, { scaleY: 0.8 }] }}
          />
        </View>

        {shouldShowPost &&
          (loading ? (
            <View style={styles.loadingIndicator}>
              <ActivityIndicator size="small" color="#007AFF" />
            </View>
          ) : (
            <TouchableOpacity onPress={handlePost} style={styles.postIcon}>
              <MaterialIcons name="send" size={24} color="#007AFF" />
            </TouchableOpacity>
          ))}
      </View>

      {showLocationSearch && (
        <View style={styles.locationSearchContainer}>
          <LocationAutocomplete
            onLocationSelect={(addr, coords) => {
              setLocationAddress(addr);
              setLocationCoords(coords);
            }}
            initialValue={locationAddress}
            placeholder="Search location..."
          />
          <TouchableOpacity onPress={handleGetCurrentLocation} style={styles.gpsBtn}>
            <Ionicons name="locate" size={20} color="#007AFF" />
            <Text style={styles.gpsBtnText}>Use GPS</Text>
          </TouchableOpacity>
          {locationAddress !== '' && (
            <TouchableOpacity
              onPress={() => {
                setLocationAddress('');
                setLocationCoords(null);
              }}
              style={styles.clearLocBtn}>
              <Text style={styles.clearLocText}>Clear Location</Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      {locationAddress !== '' && !showLocationSearch && (
        <View style={styles.taggedLocationBadge}>
          <Ionicons name="location" size={16} color="#FF5722" />
          <Text style={styles.taggedLocationText} numberOfLines={1}>
            {locationAddress}
          </Text>
          <TouchableOpacity
            onPress={() => {
              setLocationAddress('');
              setLocationCoords(null);
            }}>
            <Ionicons name="close-circle" size={18} color="#999" style={{ marginLeft: 5 }} />
          </TouchableOpacity>
        </View>
      )}

      <View style={styles.postTypeContainer}>
        <Text style={styles.postTypeLabel}>Post to:</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <TouchableOpacity
            style={[styles.postTypeBtn, postType === 'feed' && styles.postTypeBtnActive]}
            onPress={() => setPostType('feed')}>
            <Text style={[styles.postTypeTxt, postType === 'feed' && styles.postTypeTxtActive]}>
              Feed
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.postTypeBtn, postType === 'story' && styles.postTypeBtnActive]}
            onPress={() => setPostType('story')}>
            <Text style={[styles.postTypeTxt, postType === 'story' && styles.postTypeTxtActive]}>
              Story
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.postTypeBtn, postType === 'both' && styles.postTypeBtnActive]}
            onPress={() => setPostType('both')}>
            <Text style={[styles.postTypeTxt, postType === 'both' && styles.postTypeTxtActive]}>
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
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>Add YouTube Link</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="Paste YouTube URL here..."
              value={youtubeLink}
              onChangeText={setYoutubeLink}
              autoCapitalize="none"
            />
            <View style={styles.modalActions}>
              <TouchableOpacity
                onPress={() => setShowYoutubeInput(false)}
                style={styles.modalBtnCancel}>
                <Text style={styles.modalBtnTextCancel}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleAddYoutubeLink} style={styles.modalBtnAdd}>
                <Text style={styles.modalBtnTextAdd}>Add</Text>
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
    backgroundColor: '#fff',
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  input: {
    flex: 1,
    minHeight: 40,
    maxHeight: 120,
    fontSize: 16,
  },
  iconInsideInput: {
    paddingLeft: 10,
  },
  postIcon: {
    paddingLeft: 10,
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
    width: 80,
    height: 80,
    borderRadius: 6,
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
    backgroundColor: '#fff',
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
    borderColor: '#ddd',
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
    color: '#555',
    fontWeight: '600',
  },
  modalBtnAdd: {
    backgroundColor: '#4CAF50',
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
    marginLeft: 10,
  },
  hdToggleText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#666',
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
    color: '#555',
  },
  postTypeBtn: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
    marginRight: 10,
    borderWidth: 1,
    borderColor: '#eee',
  },
  postTypeBtnActive: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  postTypeTxt: {
    fontSize: 14,
    color: '#555',
  },
  postTypeTxtActive: {
    color: '#fff',
    fontWeight: 'bold',
  },
  locationSearchContainer: {
    marginTop: 10,
    padding: 10,
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#eee',
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
    backgroundColor: '#FFF0ED',
    alignSelf: 'flex-start',
    marginTop: 10,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: '#FFD7D0',
  },
  taggedLocationText: {
    fontSize: 13,
    color: '#FF5722',
    marginLeft: 4,
    maxWidth: 250,
  },
});
