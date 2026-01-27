import React, { useState } from 'react';
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
import { useTheme } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import moment from 'moment';
import * as ImagePicker from 'expo-image-picker';
import { imageUpload } from '../utils/imageUpload';
import LocationAutocomplete from '../components/LocationAutocomplete';
import { createEventAPI } from '../api/eventAPI';

const CreateEventScreen = () => {
  const navigation = useNavigation<any>();
  const theme = useTheme();
  const [loading, setLoading] = useState(false);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(new Date());
  const [time, setTime] = useState(moment().format('HH:mm'));
  const [image, setImage] = useState<string | null>(null);
  const [address, setAddress] = useState('');
  const [location, setLocation] = useState<[number, number] | null>(null);

  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);

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

  const handleCreate = async () => {
    if (!title || !description || !address || !location) {
      return Alert.alert('Error', 'Please fill in all fields.');
    }

    setLoading(true);
    try {
      let imageUrl = '';
      if (image) {
        const media = await imageUpload([image]);
        imageUrl = media[0].url;
      }

      await createEventAPI({
        title,
        description,
        date,
        time,
        image: imageUrl,
        address,
        location: { type: 'Point', coordinates: location },
      });

      Alert.alert('Success', 'Event created!', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (err: any) {
      Alert.alert('Error', err.response?.data?.msg || 'Failed to create event');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      contentContainerStyle={styles.content}>
      <Text style={[styles.label, { color: theme.colors.onSurface }]}>Event Title</Text>
      <TextInput
        style={[
          styles.input,
          {
            backgroundColor: theme.colors.surfaceVariant,
            color: theme.colors.onSurface,
            borderColor: theme.colors.outlineVariant,
          },
        ]}
        placeholder="What's the name of your event?"
        placeholderTextColor={theme.colors.onSurfaceVariant}
        value={title}
        onChangeText={setTitle}
      />

      <Text style={[styles.label, { color: theme.colors.onSurface }]}>Description</Text>
      <TextInput
        style={[
          styles.input,
          styles.textArea,
          {
            backgroundColor: theme.colors.surfaceVariant,
            color: theme.colors.onSurface,
            borderColor: theme.colors.outlineVariant,
          },
        ]}
        placeholder="Tell people more about it..."
        placeholderTextColor={theme.colors.onSurfaceVariant}
        value={description}
        onChangeText={setDescription}
        multiline
      />

      <View style={styles.row}>
        <View style={{ flex: 1 }}>
          <Text style={[styles.label, { color: theme.colors.onSurface }]}>Date</Text>
          <TouchableOpacity
            style={[
              styles.pickerBtn,
              {
                backgroundColor: theme.colors.surfaceVariant,
                borderColor: theme.colors.outlineVariant,
              },
            ]}
            onPress={() => setShowDatePicker(true)}>
            <Ionicons name="calendar-outline" size={20} color={theme.colors.onSurface} />
            <Text style={[styles.pickerText, { color: theme.colors.onSurface }]}>
              {moment(date).format('MMM D, YYYY')}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={{ flex: 1, marginLeft: 10 }}>
          <Text style={[styles.label, { color: theme.colors.onSurface }]}>Time</Text>
          <TouchableOpacity
            style={[
              styles.pickerBtn,
              {
                backgroundColor: theme.colors.surfaceVariant,
                borderColor: theme.colors.outlineVariant,
              },
            ]}
            onPress={() => setShowTimePicker(true)}>
            <Ionicons name="time-outline" size={20} color={theme.colors.onSurface} />
            <Text style={[styles.pickerText, { color: theme.colors.onSurface }]}>{time}</Text>
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

      <Text style={[styles.label, { color: theme.colors.onSurface }]}>Location</Text>
      <LocationAutocomplete
        onLocationSelect={(addr, coords) => {
          setAddress(addr);
          setLocation(coords);
        }}
        placeholder="Search location..."
      />

      <Text style={[styles.label, { color: theme.colors.onSurface }]}>Event Photo</Text>
      <TouchableOpacity
        style={[
          styles.imagePicker,
          {
            backgroundColor: theme.colors.surfaceVariant,
            borderColor: theme.colors.outlineVariant,
          },
        ]}
        onPress={pickImage}>
        {image ? (
          <View style={{ width: '100%', height: '100%' }}>
            <Image
              source={{ uri: image }}
              style={{ width: '100%', height: '100%', borderRadius: 8 }}
            />
          </View>
        ) : (
          <View style={{ alignItems: 'center' }}>
            <Ionicons name="image-outline" size={40} color={theme.colors.onSurfaceVariant} />
            <Text style={{ color: theme.colors.onSurfaceVariant, marginTop: 8 }}>
              Choose a Photo
            </Text>
          </View>
        )}
      </TouchableOpacity>

      <TouchableOpacity
        style={[
          styles.createBtn,
          { backgroundColor: theme.colors.primary },
          loading && [styles.disabledBtn, { backgroundColor: theme.colors.surfaceVariant }],
        ]}
        onPress={handleCreate}
        disabled={loading}>
        {loading ? (
          <ActivityIndicator color={theme.colors.onPrimary} />
        ) : (
          <Text style={[styles.createBtnText, { color: theme.colors.onPrimary }]}>
            Create Event
          </Text>
        )}
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 20,
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
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
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
    borderRadius: 8,
    padding: 12,
  },
  pickerText: {
    marginLeft: 8,
    fontSize: 14,
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

export default CreateEventScreen;
