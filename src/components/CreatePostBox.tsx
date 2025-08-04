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
} from 'react-native';
import { createPostAPI } from '../api/postAPI';
import { imageUpload } from './ImageUpload';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { getMapPreview } from '../utils/getMapPreview';
import { getReadableAddress } from '../utils/locationHelper';

interface Props {
  onPostCreated: (newPost: any) => void;
}

const CreatePostBox: React.FC<Props> = ({ onPostCreated }) => {
  const [content, setContent] = useState('');
  const [images, setImages] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [locationAdded, setLocationAdded] = useState<'none' | 'text' | 'image' | 'both'>('none');
  const [locationAddress, setLocationAddress] = useState('');
  const [locationCoords, setLocationCoords] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);

  const pickImages = async () => {
    try {
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

  const handleShareLocation = async () => {
    try {
      if (locationAdded !== 'none') {
        Alert.alert('Location already added', 'Do you want to remove it?', [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Remove',
            style: 'destructive',
            onPress: () => {
              setImages((prev) => prev.filter((uri) => !uri.includes('locationiq.com')));
              setLocationAddress('');
              setLocationCoords(null);
              setLocationAdded('none');
            },
          },
        ]);
        return;
      }

      Alert.alert('Share Location As?', '', [
        {
          text: 'Text Only',
          onPress: () => handleAddLocation('text'),
        },
        {
          text: 'Image Only',
          onPress: () => handleAddLocation('image'),
        },
        {
          text: 'Both',
          onPress: () => handleAddLocation('both'),
        },
        { text: 'Cancel', style: 'cancel' },
      ]);
    } catch (err) {
      console.error('📍 Location prompt error:', err);
    }
  };

  const handleAddLocation = async (format: 'text' | 'image' | 'both') => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission denied', 'You must allow location access.');
        return;
      }

      const location = await Location.getCurrentPositionAsync({});
      const { latitude, longitude } = location.coords;
      const address = await getReadableAddress(latitude, longitude);
      const mapImageUrl = getMapPreview(latitude, longitude);

      if (
        (format === 'image' || format === 'both') &&
        images.some((uri) => uri.includes('locationiq.com'))
      ) {
        Alert.alert('Location already added.');
        return;
      }

      if (format === 'image' || format === 'both') {
        setImages((prev) => [...prev, mapImageUrl]);
      }

      if (format === 'text' || format === 'both') {
        setLocationAddress(address);
        setLocationCoords({ latitude, longitude });
      }

      setLocationAdded(format);
    } catch (error) {
      console.error('📍 Location error:', error);
      Alert.alert('Error getting location.');
    }
  };

  const takePhoto = async () => {
    try {
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

  const handlePost = async () => {
    if (!content && images.length === 0 && locationAdded === 'none') {
      Alert.alert('Post must have content or image.');
      return;
    }

    setLoading(true);

    try {
      let media = [];
      if (Array.isArray(images) && images.length > 0) {
        media = await imageUpload(images);
      }

      let finalContent = content.trim();

      if ((locationAdded === 'text' || locationAdded === 'both') && locationAddress) {
        finalContent =
          finalContent.length > 0
            ? `${finalContent}\n\n\n📍 ${locationAddress}`
            : `📍 ${locationAddress}`;
      }

      const res = await createPostAPI({ content: finalContent, images: media });
      onPostCreated(res.newPost);
      setContent('');
      setImages([]);
      setLocationAdded('none');
      setLocationAddress('');
      setLocationCoords(null);
    } catch (err: any) {
      console.error('❌ Error creating post:', err);
      Alert.alert('Failed to post', err?.response?.data?.msg || 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const shouldShowPost = content.trim().length > 0 || images.length > 0 || locationAdded !== 'none';

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

        <TouchableOpacity onPress={handleShareLocation} style={styles.iconInsideInput}>
          <Ionicons
            name="location-outline"
            size={24}
            color={locationAdded !== 'none' ? '#FF5722' : '#aaa'}
          />
        </TouchableOpacity>

        {shouldShowPost && (
          <TouchableOpacity onPress={handlePost} disabled={loading} style={styles.postIcon}>
            <MaterialIcons name="send" size={24} color="#007AFF" />
          </TouchableOpacity>
        )}
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
      </View>
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
});
