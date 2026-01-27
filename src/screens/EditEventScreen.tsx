import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  Image,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import moment from 'moment';
import * as ImagePicker from 'expo-image-picker';
import { imageUpload } from '../utils/imageUpload';
import LocationAutocomplete from '../components/LocationAutocomplete';
import { getEventAPI, updateEventAPI } from '../api/eventAPI';

const EditEventScreen = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { eventId } = route.params;

  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(new Date());
  const [time, setTime] = useState('');
  const [image, setImage] = useState<string | null>(null);
  const [address, setAddress] = useState('');
  const [location, setLocation] = useState<[number, number] | null>(null);

  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);

  useEffect(() => {
    const fetchEvent = async () => {
      try {
        const res = await getEventAPI(eventId);
        const ev = res.event;
        setTitle(ev.title);
        setDescription(ev.description);
        setDate(new Date(ev.date));
        setTime(ev.time);
        setImage(ev.image);
        setAddress(ev.address);
        setLocation(ev.location.coordinates);
      } catch (err) {
        Alert.alert('Error', 'Failed to load event data');
        navigation.goBack();
      } finally {
        setLoading(false);
      }
    };
    fetchEvent();
  }, [eventId]);

  const pickImage = async () => {
    const { granted } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!granted) return Alert.alert('Permission denied');

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [16, 9],
      quality: 1,
    });

    if (!result.canceled) {
      setImage(result.assets[0].uri);
    }
  };

  const handleUpdate = async () => {
    if (!title || !description || !address || !location) {
      return Alert.alert('Error', 'Please fill in all fields.');
    }

    setUpdating(true);
    try {
      let imageUrl = image;
      if (image && image.startsWith('file://')) {
        const media = await imageUpload([image]);
        imageUrl = media[0].url;
      }

      await updateEventAPI(eventId, {
        title,
        description,
        date,
        time,
        image: imageUrl,
        address,
        location: { type: 'Point', coordinates: location },
      });

      Alert.alert('Success', 'Event updated!', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (err: any) {
      Alert.alert('Error', err.response?.data?.msg || 'Failed to update event');
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#1877f2" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.label}>Event Title</Text>
      <TextInput
        style={styles.input}
        placeholder="What's the name of your event?"
        value={title}
        onChangeText={setTitle}
      />

      <Text style={styles.label}>Description</Text>
      <TextInput
        style={[styles.input, styles.textArea]}
        placeholder="Tell people more about it..."
        value={description}
        onChangeText={setDescription}
        multiline
      />

      <View style={styles.row}>
        <View style={{ flex: 1 }}>
          <Text style={styles.label}>Date</Text>
          <TouchableOpacity style={styles.pickerBtn} onPress={() => setShowDatePicker(true)}>
            <Ionicons name="calendar-outline" size={20} color="#1c1e21" />
            <Text style={styles.pickerText}>{moment(date).format('MMM D, YYYY')}</Text>
          </TouchableOpacity>
        </View>

        <View style={{ flex: 1, marginLeft: 10 }}>
          <Text style={styles.label}>Time</Text>
          <TouchableOpacity style={styles.pickerBtn} onPress={() => setShowTimePicker(true)}>
            <Ionicons name="time-outline" size={20} color="#1c1e21" />
            <Text style={styles.pickerText}>{time}</Text>
          </TouchableOpacity>
        </View>
      </View>

      {showDatePicker && (
        <DateTimePicker
          value={date}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={(event, selectedDate) => {
            setShowDatePicker(false);
            if (selectedDate) setDate(selectedDate);
          }}
          minimumDate={new Date()}
        />
      )}

      {showTimePicker && (
        <DateTimePicker
          value={moment(time, 'HH:mm').toDate()}
          mode="time"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={(event, selectedTime) => {
            setShowTimePicker(false);
            if (selectedTime) setTime(moment(selectedTime).format('HH:mm'));
          }}
        />
      )}

      <Text style={styles.label}>Location</Text>
      <LocationAutocomplete
        onLocationSelect={(addr, coords) => {
          setAddress(addr);
          setLocation(coords);
        }}
        initialValue={address}
        placeholder="Search location..."
      />

      <Text style={styles.label}>Event Photo</Text>
      <TouchableOpacity style={styles.imagePicker} onPress={pickImage}>
        {image ? (
          <View style={{ width: '100%', height: '100%' }}>
            <Image
              source={{ uri: image }}
              style={{ width: '100%', height: '100%', borderRadius: 8 }}
            />
          </View>
        ) : (
          <View style={{ alignItems: 'center' }}>
            <Ionicons name="image-outline" size={40} color="#65676B" />
            <Text style={{ color: '#65676B', marginTop: 8 }}>Choose a Photo</Text>
          </View>
        )}
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.createBtn, updating && styles.disabledBtn]}
        onPress={handleUpdate}
        disabled={updating}>
        {updating ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.createBtnText}>Save Changes</Text>
        )}
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  content: {
    padding: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  label: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1c1e21',
    marginBottom: 8,
    marginTop: 15,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#f9f9f9',
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  row: {
    flexDirection: 'row',
  },
  pickerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    backgroundColor: '#f9f9f9',
  },
  pickerText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#1c1e21',
  },
  imagePicker: {
    height: 180,
    borderWidth: 2,
    borderColor: '#eee',
    borderStyle: 'dashed',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f0f2f5',
    overflow: 'hidden',
  },
  createBtn: {
    backgroundColor: '#1877f2',
    paddingVertical: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 30,
    marginBottom: 50,
  },
  disabledBtn: {
    backgroundColor: '#a2c6f5',
  },
  createBtnText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
});

export default EditEventScreen;
