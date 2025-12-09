import React, { useState, useEffect, useContext } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Image,
  ActivityIndicator,
  StyleSheet,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { AuthContext } from '../../auth/AuthContext';
import { updateUserProfile } from '../../api/userAPI';

interface EditProfileModalProps {
  visible: boolean;
  onClose: () => void;
  onSave: () => void;
  profile: any;
}

const EditProfileModal = ({ visible, onClose, onSave, profile }: EditProfileModalProps) => {
  const { user, setUser } = useContext(AuthContext);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    fullname: '',
    mobile: '',
    address: '',
    website: '',
    story: '',
    gender: 'male',
  });
  const [avatarUri, setAvatarUri] = useState('');
  const [coverUri, setCoverUri] = useState('');

  useEffect(() => {
    if (profile) {
      setFormData({
        fullname: profile.fullname || '',
        mobile: profile.mobile || '',
        address: profile.address || '',
        website: profile.website || '',
        story: profile.story || '',
        gender: profile.gender || 'male',
      });
      setAvatarUri(profile.avatar || '');
      setCoverUri(profile.cover || '');
    }
  }, [profile]);

  const pickImage = async (type: 'avatar' | 'cover') => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: type === 'avatar' ? [1, 1] : [16, 9],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      if (type === 'avatar') {
        setAvatarUri(result.assets[0].uri);
      } else {
        setCoverUri(result.assets[0].uri);
      }
    }
  };

  const handleSave = async () => {
    if (!formData.fullname.trim()) {
      Alert.alert('Error', 'Please enter your full name');
      return;
    }

    if (formData.fullname.length > 25) {
      Alert.alert('Error', 'Full name must be 25 characters or less');
      return;
    }

    if (formData.story.length > 200) {
      Alert.alert('Error', 'Story must be 200 characters or less');
      return;
    }

    setLoading(true);
    try {
      await updateUserProfile({
        ...formData,
        avatar: avatarUri,
        cover: coverUri,
      });

      // Update local user context
      if (setUser && user) {
        setUser({
          _id: user._id,
          username: user.username,
          ...formData,
          avatar: avatarUri,
          cover: coverUri,
        });
      }

      Alert.alert('Success', 'Profile updated successfully');
      onSave();
      onClose();
    } catch (err: any) {
      console.error('Failed to update profile:', err);
      Alert.alert('Error', err.response?.data?.msg || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent={false}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} disabled={loading}>
            <Ionicons name="close" size={28} color="#333" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Edit Profile</Text>
          <TouchableOpacity onPress={handleSave} disabled={loading}>
            {loading ? (
              <ActivityIndicator color="#D4F637" />
            ) : (
              <Ionicons name="checkmark" size={28} color="#D4F637" />
            )}
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          {/* Cover Image */}
          <View style={styles.coverContainer}>
            <Image
              source={{ uri: coverUri || 'https://picsum.photos/800/400' }}
              style={styles.coverImage}
            />
            <TouchableOpacity style={styles.changeCoverBtn} onPress={() => pickImage('cover')}>
              <Ionicons name="camera" size={20} color="#fff" />
              <Text style={styles.changeBtnText}>Change Cover</Text>
            </TouchableOpacity>
          </View>

          {/* Avatar */}
          <View style={styles.avatarContainer}>
            <Image source={{ uri: avatarUri }} style={styles.avatar} />
            <TouchableOpacity style={styles.changeAvatarBtn} onPress={() => pickImage('avatar')}>
              <Ionicons name="camera" size={16} color="#fff" />
            </TouchableOpacity>
          </View>

          {/* Form Fields */}
          <View style={styles.formContainer}>
            {/* Full Name */}
            <View style={styles.fieldContainer}>
              <Text style={styles.label}>Full Name</Text>
              <View style={styles.inputWrapper}>
                <TextInput
                  style={styles.input}
                  value={formData.fullname}
                  onChangeText={(text) => setFormData({ ...formData, fullname: text })}
                  placeholder="Enter your full name"
                  maxLength={25}
                />
                <Text style={styles.charCount}>{formData.fullname.length}/25</Text>
              </View>
            </View>

            {/* Mobile */}
            <View style={styles.fieldContainer}>
              <Text style={styles.label}>Mobile</Text>
              <TextInput
                style={styles.input}
                value={formData.mobile}
                onChangeText={(text) => setFormData({ ...formData, mobile: text })}
                placeholder="Enter your mobile number"
                keyboardType="phone-pad"
              />
            </View>

            {/* Address */}
            <View style={styles.fieldContainer}>
              <Text style={styles.label}>Address</Text>
              <TextInput
                style={styles.input}
                value={formData.address}
                onChangeText={(text) => setFormData({ ...formData, address: text })}
                placeholder="Enter your address"
              />
            </View>

            {/* Website */}
            <View style={styles.fieldContainer}>
              <Text style={styles.label}>Website</Text>
              <TextInput
                style={styles.input}
                value={formData.website}
                onChangeText={(text) => setFormData({ ...formData, website: text })}
                placeholder="Enter your website"
                keyboardType="url"
                autoCapitalize="none"
              />
            </View>

            {/* Story/Bio */}
            <View style={styles.fieldContainer}>
              <Text style={styles.label}>Bio</Text>
              <View style={styles.inputWrapper}>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  value={formData.story}
                  onChangeText={(text) => setFormData({ ...formData, story: text })}
                  placeholder="Tell us about yourself"
                  multiline
                  numberOfLines={4}
                  maxLength={200}
                />
                <Text style={styles.charCount}>{formData.story.length}/200</Text>
              </View>
            </View>

            {/* Gender */}
            <View style={styles.fieldContainer}>
              <Text style={styles.label}>Gender</Text>
              <View style={styles.genderContainer}>
                <TouchableOpacity
                  style={[styles.genderBtn, formData.gender === 'male' && styles.genderBtnActive]}
                  onPress={() => setFormData({ ...formData, gender: 'male' })}>
                  <Text
                    style={[
                      styles.genderText,
                      formData.gender === 'male' && styles.genderTextActive,
                    ]}>
                    Male
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.genderBtn, formData.gender === 'female' && styles.genderBtnActive]}
                  onPress={() => setFormData({ ...formData, gender: 'female' })}>
                  <Text
                    style={[
                      styles.genderText,
                      formData.gender === 'female' && styles.genderTextActive,
                    ]}>
                    Female
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    paddingTop: 50,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  scrollView: {
    flex: 1,
  },
  coverContainer: {
    height: 200,
    backgroundColor: '#ccc',
    position: 'relative',
  },
  coverImage: {
    width: '100%',
    height: '100%',
  },
  changeCoverBtn: {
    position: 'absolute',
    bottom: 16,
    right: 16,
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  changeBtnText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  avatarContainer: {
    alignSelf: 'center',
    marginTop: -60,
    marginBottom: 20,
    position: 'relative',
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 4,
    borderColor: '#fff',
  },
  changeAvatarBtn: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#D4F637',
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#fff',
  },
  formContainer: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  fieldContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  inputWrapper: {
    position: 'relative',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: '#333',
    backgroundColor: '#f9f9f9',
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
    paddingTop: 10,
  },
  charCount: {
    position: 'absolute',
    right: 12,
    top: 12,
    fontSize: 11,
    color: '#999',
  },
  genderContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  genderBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    alignItems: 'center',
    backgroundColor: '#f9f9f9',
  },
  genderBtnActive: {
    backgroundColor: '#D4F637',
    borderColor: '#D4F637',
  },
  genderText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '600',
  },
  genderTextActive: {
    color: '#000',
  },
});

export default EditProfileModal;
