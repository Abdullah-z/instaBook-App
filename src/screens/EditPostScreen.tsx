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
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { updatePostAPI } from '../api/postAPI';
import { imageUpload } from '../components/ImageUpload';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';

const EditPostScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { post, onPostUpdate } = route.params as any;

  const [content, setContent] = useState(post.content);
  const [images, setImages] = useState<any[]>(post.images || []);
  const [loading, setLoading] = useState(false);

  // Separate new images (local URIs) from old images (server URLs)
  // Actually, for simplicity in UI, we treat them all as images to display.
  // But for upload, we need to distinguish.
  // The `imageUpload` function likely takes an array of files/uris.
  // Existing images are objects { url: '...' }, new images are strings 'file://...'

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

  const handleUpdate = async () => {
    if (!content && images.length === 0) {
      Alert.alert('Post must have content or image.');
      return;
    }

    setLoading(true);

    try {
      let media = [];
      const newImages = images.filter((img) => typeof img === 'string');
      const oldImages = images.filter((img) => typeof img !== 'string');

      if (newImages.length > 0) {
        const uploadedMedia = await imageUpload(newImages);
        media = [...oldImages, ...uploadedMedia];
      } else {
        media = oldImages;
      }

      const updatedData = { content, images: media };
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
      </View>

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
});
