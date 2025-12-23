import React, { useState, useContext } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { TextInput, Button, Text, HelperText } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import { useNavigation, useRoute } from '@react-navigation/native';
import { createListingAPI, updateListingAPI } from '../api/listingAPI';
import { AuthContext } from '../auth/AuthContext';
import { imageUpload } from '../utils/imageUpload';
import LocationAutocomplete from '../components/LocationAutocomplete';

const CreateListingScreen = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const editListing = route.params?.editListing;
  const { token } = useContext(AuthContext);

  const [listing, setListing] = useState({
    name: editListing?.name || '',
    description: editListing?.description || '',
    price: editListing?.price?.toString() || '',
    category: editListing?.category || 'Other',
    address: editListing?.address || '',
    phone: editListing?.phone || '',
    location: editListing?.location || {
      type: 'Point',
      coordinates: [0, 0],
    },
  });

  const [images, setImages] = useState<any[]>(
    editListing?.images?.map((url: string) => ({ uri: url })) || []
  );
  const [loading, setLoading] = useState(false);
  const [uploadingImages, setUploadingImages] = useState(false);

  const pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsMultipleSelection: true,
      selectionLimit: 5,
      quality: 0.7,
    });

    if (!result.canceled) {
      setImages([...images, ...result.assets]);
    }
  };

  const removeImage = (index: number) => {
    setImages(images.filter((_, i) => i !== index));
  };

  const getCurrentLocation = async () => {
    let { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Denied', 'Permission to access location was denied');
      return;
    }

    let loc = await Location.getCurrentPositionAsync({});
    setListing({
      ...listing,
      location: {
        type: 'Point',
        coordinates: [loc.coords.longitude, loc.coords.latitude],
      },
    });

    let reverse = await Location.reverseGeocodeAsync({
      latitude: loc.coords.latitude,
      longitude: loc.coords.longitude,
    });

    if (reverse.length > 0) {
      const addr = reverse[0];
      setListing((prev) => ({
        ...prev,
        address: `${addr.name || ''}, ${addr.street || ''}, ${addr.city || ''}, ${addr.region || ''}`,
        location: {
          type: 'Point',
          coordinates: [loc.coords.longitude, loc.coords.latitude],
        },
      }));
    }
  };

  const uploadImagesToCloudinary = async () => {
    setUploadingImages(true);
    try {
      // Filter out already uploaded images (those that start with http)
      const newImages = images.filter((img) => !img.uri.startsWith('http'));

      if (newImages.length === 0) {
        setUploadingImages(false);
        return [];
      }

      // Use the existing imageUpload utility
      const result = await imageUpload(newImages);
      setUploadingImages(false);

      // Return just the URLs
      return result.map((img) => img.url);
    } catch (err) {
      console.error('Cloudinary Upload Error:', err);
      setUploadingImages(false);
      return [];
    }
  };

  const handleSubmit = async () => {
    if (
      !listing.name ||
      !listing.description ||
      !listing.price ||
      !listing.address ||
      images.length === 0
    ) {
      Alert.alert('Error', 'Please fill all fields and add at least one image.');
      return;
    }

    setLoading(true);
    try {
      const imageUrls = await uploadImagesToCloudinary();

      if (imageUrls.length === 0 && images.length === 0) {
        Alert.alert('Error', 'Failed to upload images.');
        setLoading(false);
        return;
      }

      const existingUrls = images.filter((img) => img.uri.startsWith('http')).map((img) => img.uri);
      const allUrls = [...existingUrls, ...imageUrls];

      const finalData = {
        ...listing,
        price: parseFloat(listing.price),
        images: allUrls,
      };

      if (editListing) {
        await updateListingAPI(editListing._id, finalData);
        Alert.alert('Success', 'Listing updated successfully!', [
          { text: 'OK', onPress: () => navigation.goBack() },
        ]);
      } else {
        await createListingAPI(finalData);
        Alert.alert('Success', 'Listing created successfully!', [
          { text: 'OK', onPress: () => navigation.goBack() },
        ]);
      }
    } catch (err: any) {
      Alert.alert('Error', err.response?.data?.msg || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={{ flex: 1 }}>
      <ScrollView style={styles.container}>
        <Text style={styles.title}>What are you selling?</Text>

        <View style={styles.imageSection}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <TouchableOpacity style={styles.addImageBtn} onPress={pickImage}>
              <Ionicons name="camera-outline" size={32} color="#888" />
              <Text style={styles.addImageText}>Add Photos</Text>
            </TouchableOpacity>
            {images.map((img, index) => (
              <View key={index} style={styles.imageWrapper}>
                <Image source={{ uri: img.uri }} style={styles.previewImage} />
                <TouchableOpacity style={styles.removeBtn} onPress={() => removeImage(index)}>
                  <Ionicons name="close-circle" size={24} color="red" />
                </TouchableOpacity>
              </View>
            ))}
          </ScrollView>
          <HelperText type="info">Select up to 5 photos. First photo is your cover.</HelperText>
        </View>

        <TextInput
          label="Item Name"
          value={listing.name}
          onChangeText={(text) => setListing({ ...listing, name: text })}
          style={styles.input}
          mode="outlined"
        />

        <TextInput
          label="Description"
          value={listing.description}
          onChangeText={(text) => setListing({ ...listing, description: text })}
          style={styles.input}
          multiline
          numberOfLines={4}
          mode="outlined"
        />

        <TextInput
          label="Price ($)"
          value={listing.price}
          onChangeText={(text) => setListing({ ...listing, price: text.replace(/[^0-9.]/g, '') })}
          style={styles.input}
          keyboardType="numeric"
          mode="outlined"
        />

        <LocationAutocomplete
          initialValue={listing.address}
          onLocationSelect={(address, coords) => {
            setListing({
              ...listing,
              address: address,
              location: {
                type: 'Point',
                coordinates: coords,
              },
            });
          }}
        />

        <Button
          mode="text"
          onPress={getCurrentLocation}
          style={{ alignSelf: 'flex-start' }}
          icon="target">
          Use My Current Location
        </Button>

        <TextInput
          label="Phone Number"
          value={listing.phone}
          onChangeText={(text) => setListing({ ...listing, phone: text })}
          style={styles.input}
          keyboardType="phone-pad"
          mode="outlined"
        />

        <Button
          mode="contained"
          onPress={handleSubmit}
          loading={loading || uploadingImages}
          disabled={loading || uploadingImages}
          style={styles.submitBtn}
          buttonColor="#D4F637"
          textColor="#000">
          Post Listing
        </Button>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  imageSection: {
    marginBottom: 20,
  },
  addImageBtn: {
    width: 100,
    height: 100,
    borderWidth: 1,
    borderColor: '#ddd',
    borderStyle: 'dashed',
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  addImageText: {
    fontSize: 12,
    color: '#888',
    marginTop: 5,
  },
  imageWrapper: {
    position: 'relative',
    marginRight: 10,
  },
  previewImage: {
    width: 100,
    height: 100,
    borderRadius: 10,
  },
  removeBtn: {
    position: 'absolute',
    top: -10,
    right: -10,
    backgroundColor: '#fff',
    borderRadius: 12,
  },
  input: {
    marginBottom: 15,
    backgroundColor: '#fff',
  },
  submitBtn: {
    marginTop: 10,
    marginBottom: 40,
    paddingVertical: 5,
    borderRadius: 25,
  },
});

export default CreateListingScreen;
