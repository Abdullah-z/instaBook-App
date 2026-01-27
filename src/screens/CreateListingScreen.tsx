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
  Modal,
} from 'react-native';
import {
  TextInput,
  Button,
  Text,
  HelperText,
  SegmentedButtons,
  useTheme,
} from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as ImagePicker from 'expo-image-picker';
import * as ExpoLocation from 'expo-location';
import { useNavigation, useRoute } from '@react-navigation/native';
import { createListingAPI, updateListingAPI } from '../api/listingAPI';
import { AuthContext } from '../auth/AuthContext';
import { imageUpload } from '../utils/imageUpload';
import LocationAutocomplete from '../components/LocationAutocomplete';
import { getRobustLocation } from '../utils/locationHelper';

const CreateListingScreen = () => {
  const navigation = useNavigation<any>();
  const theme = useTheme();
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
    listingType: editListing?.listingType || 'Sell',
    bidEndTime: editListing?.bidEndTime || new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
  });

  const [showDatePicker, setShowDatePicker] = useState(false);
  const [datePickerMode, setDatePickerMode] = useState<'date' | 'time'>('date');

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
    let { status } = await ExpoLocation.getForegroundPermissionsAsync();
    if (status !== 'granted') {
      const result = await ExpoLocation.requestForegroundPermissionsAsync();
      status = result.status;
    }

    if (status !== 'granted') {
      Alert.alert('Permission Denied', 'Permission to access location was denied');
      return;
    }

    let loc = await getRobustLocation();
    if (!loc) {
      Alert.alert('Error', 'Could not get location.');
      return;
    }
    setListing({
      ...listing,
      location: {
        type: 'Point',
        coordinates: [loc.coords.longitude, loc.coords.latitude],
      },
    });

    let reverse = await ExpoLocation.reverseGeocodeAsync({
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
      style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <ScrollView style={styles.container}>
        <Text style={[styles.title, { color: theme.colors.onSurface }]}>What are you selling?</Text>

        <View style={styles.imageSection}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <TouchableOpacity
              style={[styles.addImageBtn, { borderColor: theme.colors.outlineVariant }]}
              onPress={pickImage}>
              <Ionicons name="camera-outline" size={32} color={theme.colors.onSurfaceVariant} />
              <Text style={[styles.addImageText, { color: theme.colors.onSurfaceVariant }]}>
                Add Photos
              </Text>
            </TouchableOpacity>
            {images.map((img, index) => (
              <View key={index} style={styles.imageWrapper}>
                <Image source={{ uri: img.uri }} style={styles.previewImage} />
                <TouchableOpacity
                  style={[styles.removeBtn, { backgroundColor: theme.colors.surface }]}
                  onPress={() => removeImage(index)}>
                  <Ionicons name="close-circle" size={24} color={theme.colors.error} />
                </TouchableOpacity>
              </View>
            ))}
          </ScrollView>
          <HelperText type="info" style={{ color: theme.colors.onSurfaceVariant }}>
            Select up to 5 photos. First photo is your cover.
          </HelperText>
        </View>

        <TextInput
          label="Item Name"
          value={listing.name}
          onChangeText={(text) => setListing({ ...listing, name: text })}
          style={[styles.input, { backgroundColor: theme.colors.surface }]}
          mode="outlined"
          outlineColor={theme.colors.outline}
          activeOutlineColor={theme.colors.primary}
          textColor={theme.colors.onSurface}
        />

        <TextInput
          label="Description"
          value={listing.description}
          onChangeText={(text) => setListing({ ...listing, description: text })}
          style={[styles.input, { backgroundColor: theme.colors.surface }]}
          multiline
          numberOfLines={4}
          mode="outlined"
          outlineColor={theme.colors.outline}
          activeOutlineColor={theme.colors.primary}
          textColor={theme.colors.onSurface}
        />

        <TextInput
          label="Price ($)"
          value={listing.price}
          onChangeText={(text) => setListing({ ...listing, price: text.replace(/[^0-9.]/g, '') })}
          style={[styles.input, { backgroundColor: theme.colors.surface }]}
          keyboardType="numeric"
          mode="outlined"
          outlineColor={theme.colors.outline}
          activeOutlineColor={theme.colors.primary}
          textColor={theme.colors.onSurface}
        />

        <Text style={[styles.sectionTitle, { marginTop: 10, color: theme.colors.onSurface }]}>
          Listing Type
        </Text>
        <SegmentedButtons
          value={listing.listingType}
          onValueChange={(value) => setListing({ ...listing, listingType: value })}
          buttons={[
            { value: 'Sell', label: 'Sell' },
            { value: 'Bid', label: 'Bid' },
            { value: 'Both', label: 'Both' },
          ]}
          style={styles.input}
        />

        {(listing.listingType === 'Bid' || listing.listingType === 'Both') && (
          <View style={styles.input}>
            <Text style={[styles.sectionTitle, { color: theme.colors.onSurface }]}>
              Auction End Time
            </Text>
            <Button
              mode="outlined"
              onPress={() => {
                setDatePickerMode('date');
                setShowDatePicker(true);
              }}
              icon="calendar"
              style={{ marginBottom: 10, borderColor: theme.colors.outline }}
              textColor={theme.colors.onSurface}>
              {new Date(listing.bidEndTime).toLocaleString()}
            </Button>

            {/* Android - sequential date then time picker */}
            {showDatePicker && Platform.OS === 'android' && (
              <DateTimePicker
                value={listing.bidEndTime ? new Date(listing.bidEndTime) : new Date()}
                mode={datePickerMode}
                display="default"
                onChange={(event: any, selectedDate?: Date) => {
                  if (event.type === 'dismissed') {
                    setShowDatePicker(false);
                    return;
                  }

                  if (event.type === 'set' && selectedDate) {
                    if (datePickerMode === 'date') {
                      // After selecting date, show time picker
                      const currentTime = listing.bidEndTime
                        ? new Date(listing.bidEndTime)
                        : new Date();
                      const newDateTime = new Date(selectedDate);
                      newDateTime.setHours(currentTime.getHours());
                      newDateTime.setMinutes(currentTime.getMinutes());
                      setListing({ ...listing, bidEndTime: newDateTime.toISOString() });
                      setDatePickerMode('time');
                    } else {
                      // After selecting time, close picker
                      const currentDate = listing.bidEndTime
                        ? new Date(listing.bidEndTime)
                        : new Date();
                      const newDateTime = new Date(currentDate);
                      newDateTime.setHours(selectedDate.getHours());
                      newDateTime.setMinutes(selectedDate.getMinutes());
                      setListing({ ...listing, bidEndTime: newDateTime.toISOString() });
                      setShowDatePicker(false);
                    }
                  }
                }}
              />
            )}

            {/* iOS - modal picker */}
            {showDatePicker && Platform.OS === 'ios' && (
              <Modal
                transparent={true}
                animationType="slide"
                visible={showDatePicker}
                onRequestClose={() => setShowDatePicker(false)}>
                <View style={styles.modalOverlay}>
                  <View style={[styles.modalContent, { backgroundColor: theme.colors.surface }]}>
                    <View
                      style={[
                        styles.modalHeader,
                        { borderBottomColor: theme.colors.outlineVariant },
                      ]}>
                      <TouchableOpacity onPress={() => setShowDatePicker(false)}>
                        <Text style={[styles.doneButton, { color: theme.colors.primary }]}>
                          Done
                        </Text>
                      </TouchableOpacity>
                    </View>
                    <DateTimePicker
                      value={listing.bidEndTime ? new Date(listing.bidEndTime) : new Date()}
                      mode="datetime"
                      display="spinner"
                      onChange={(event: any, selectedDate?: Date) => {
                        if (selectedDate) {
                          setListing({ ...listing, bidEndTime: selectedDate.toISOString() });
                        }
                      }}
                    />
                  </View>
                </View>
              </Modal>
            )}
          </View>
        )}

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
          style={[styles.input, { backgroundColor: theme.colors.surface }]}
          keyboardType="phone-pad"
          mode="outlined"
          outlineColor={theme.colors.outline}
          activeOutlineColor={theme.colors.primary}
          textColor={theme.colors.onSurface}
        />

        <Button
          mode="contained"
          onPress={handleSubmit}
          loading={loading || uploadingImages}
          disabled={loading || uploadingImages}
          style={styles.submitBtn}
          buttonColor={theme.colors.primary}
          textColor={theme.colors.onPrimary}>
          Post Listing
        </Button>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
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
  },
  submitBtn: {
    marginTop: 10,
    marginBottom: 40,
    paddingVertical: 5,
    borderRadius: 25,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    padding: 15,
    borderBottomWidth: 1,
  },
  doneButton: {
    fontSize: 17,
    fontWeight: '600',
    color: '#007AFF',
  },
});

export default CreateListingScreen;
