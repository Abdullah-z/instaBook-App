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
  Switch,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { updatePostAPI } from '../api/postAPI';
import { imageUpload } from '../utils/imageUpload';
import { Video, ResizeMode } from 'expo-av';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import * as ExpoLocation from 'expo-location';
import { getReadableAddress, getRobustLocation } from '../utils/locationHelper';
import LocationAutocomplete from '../components/LocationAutocomplete';

const EditPostScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { post, onPostUpdate } = route.params as any;

  const [content, setContent] = useState(post.content);
  const [images, setImages] = useState<any[]>(post.images || []);
  const [videoUri, setVideoUri] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [isHD, setIsHD] = useState(false);
  const [address, setAddress] = useState(post.address || '');
  const [locationCoords, setLocationCoords] = useState<[number, number] | null>(
    post.location?.coordinates || null
  );
  const [showLocationSearch, setShowLocationSearch] = useState(false);

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
        if (images.length >= 4) {
          Alert.alert('You can only upload up to 4 images.');
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
    if (!content && images.length === 0 && !videoUri && !address) {
      Alert.alert('Post must have content, image, video or location.');
      return;
    }

    setLoading(true);

    try {
      let media: any[] = [];
      const newImages = images.filter((img) => typeof img === 'string');
      const oldImages = images.filter((img) => typeof img !== 'string');

      if (videoUri) {
        // Upload Video
        // Check if it's a new video (uri string) or existing (object) - simplistic check for now
        // EditPost primarily deals with existing posts.
        // If user picked a NEW video, videoUri is a file URI string.
        // Existing video support not explicitly requested to survive edits but we should consider it.
        // For now, assuming user replaces content.
        if (videoUri.startsWith('file://')) {
          media = await imageUpload([{ uri: videoUri, type: 'video' }], isHD);
        } else {
          // It's an existing video URL? Not handling existing video *state* initialization yet.
          // Assuming user adds NEW video.
          media = [{ url: videoUri, resource_type: 'video' }];
        }
      } else if (newImages.length > 0) {
        const uploadedMedia = await imageUpload(newImages, isHD);
        media = [...oldImages, ...uploadedMedia];
      } else {
        media = oldImages;
      }

      const updatedData = {
        content,
        images: media,
        address,
        location: locationCoords ? { type: 'Point', coordinates: locationCoords } : undefined,
      };
      const res = await updatePostAPI(post._id, updatedData);

      if (onPostUpdate) {
        onPostUpdate(res.newPost);
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
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.inputRow}>
        <TextInput
          style={styles.input}
          placeholder="What's on your mind?"
          value={content}
          onChangeText={setContent}
          multiline
        />
      </View>

      <View style={styles.actionsRow}>
        <TouchableOpacity onPress={pickImages} style={styles.iconButton}>
          <Ionicons name="image-outline" size={24} color="#4CAF50" />
          <Text style={styles.iconText}>Photo</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={takePhoto} style={styles.iconButton}>
          <Ionicons name="camera-outline" size={24} color="#FF9800" />
          <Text style={styles.iconText}>Camera</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={pickVideo} style={styles.iconButton}>
          <Ionicons name="videocam-outline" size={24} color="#E91E63" />
          <Text style={styles.iconText}>Video</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => setShowYoutubeInput(true)} style={styles.iconButton}>
          <Ionicons name="logo-youtube" size={24} color="#F44336" />
          <Text style={styles.iconText}>YouTube</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => setShowLocationSearch(!showLocationSearch)}
          style={styles.iconButton}>
          <Ionicons
            name="location-outline"
            size={24}
            color={address ? '#FF5722' : '#FF9800'} // Reusing Orange for loc icon
          />
          <Text style={styles.iconText}>Location</Text>
        </TouchableOpacity>

        <View style={styles.hdToggleContainer}>
          <Text style={styles.hdToggleText}>HD</Text>
          <Switch
            value={isHD}
            onValueChange={setIsHD}
            trackColor={{ false: '#767577', true: '#4CAF50' }}
            thumbColor={isHD ? '#fff' : '#f4f3f4'}
          />
        </View>
      </View>

      {showLocationSearch && (
        <View style={styles.locationSearchContainer}>
          <LocationAutocomplete
            onLocationSelect={(addr, coords) => {
              setAddress(addr);
              setLocationCoords(coords);
            }}
            initialValue={address}
            placeholder="Search location..."
          />
          <TouchableOpacity onPress={handleGetCurrentLocation} style={styles.gpsBtn}>
            <Ionicons name="locate" size={20} color="#007AFF" />
            <Text style={styles.gpsBtnText}>Use GPS</Text>
          </TouchableOpacity>
          {address !== '' && (
            <TouchableOpacity
              onPress={() => {
                setAddress('');
                setLocationCoords(null);
              }}
              style={styles.clearLocBtn}>
              <Text style={styles.clearLocText}>Clear Location</Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      {address !== '' && !showLocationSearch && (
        <View style={styles.taggedLocationBadge}>
          <Ionicons name="location" size={16} color="#FF5722" />
          <Text style={styles.taggedLocationText} numberOfLines={1}>
            {address}
          </Text>
          <TouchableOpacity
            onPress={() => {
              setAddress('');
              setLocationCoords(null);
            }}>
            <Ionicons name="close-circle" size={18} color="#999" style={{ marginLeft: 5 }} />
          </TouchableOpacity>
        </View>
      )}

      <View style={styles.imageGrid}>
        {images.map((img, index) => (
          <View key={index} style={styles.imageWrapper}>
            <Image
              source={{ uri: typeof img === 'string' ? img : img.url }}
              style={styles.preview}
            />
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
        style={[styles.updateButton, loading && styles.disabledButton]}
        disabled={loading}>
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.updateButtonText}>Update Post</Text>
        )}
      </TouchableOpacity>

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

export default EditPostScreen;

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: '#fff',
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
    borderColor: '#eee',
    paddingVertical: 10,
  },
  iconButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 20,
  },
  iconText: {
    marginLeft: 5,
    fontSize: 16,
    color: '#555',
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
  updateButton: {
    backgroundColor: '#007AFF',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  disabledButton: {
    backgroundColor: '#ccc',
  },
  updateButtonText: {
    color: '#fff',
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
    marginBottom: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#FFD7D0',
  },
  taggedLocationText: {
    fontSize: 14,
    color: '#FF5722',
    marginLeft: 4,
    maxWidth: 250,
  },
});
