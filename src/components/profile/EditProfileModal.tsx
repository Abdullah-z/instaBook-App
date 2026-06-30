import { Image } from 'expo-image';
import React, { useState, useEffect, useContext } from 'react';
import { Modal, View, Text, TextInput, TouchableOpacity, ScrollView, ActivityIndicator, StyleSheet, Alert, Switch, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { AuthContext } from '../../auth/AuthContext';
import { updateUserProfile } from '../../api/userAPI';
import { imageUpload } from '../../utils/imageUpload';
import { Avatar, useTheme } from 'react-native-paper';

interface EditProfileModalProps {
  visible: boolean;
  onClose: () => void;
  onSave: () => void;
  profile: any;
}

const EditProfileModal = ({ visible, onClose, onSave, profile }: EditProfileModalProps) => {
  const theme = useTheme();
  const { user, setUser } = useContext(AuthContext);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    fullname: '',
    mobile: '',
    address: '',
    website: '',
    story: '',
    gender: 'male',
    isPrivate: false,
  });
  const [avatarUri, setAvatarUri] = useState('');
  const [coverUri, setCoverUri] = useState('');
  const [isHD, setIsHD] = useState(false);

  useEffect(() => {
    if (profile) {
      setFormData({
        fullname: profile.fullname || '',
        mobile: profile.mobile || '',
        address: profile.address || '',
        website: profile.website || '',
        story: profile.story || '',
        gender: profile.gender || 'male',
        isPrivate: profile.isPrivate || false,
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
      quality: 1,
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
      let newAvatarUri = avatarUri;
      let newCoverUri = coverUri;
      const mediaToUpload = [];

      // Check if avatar is a local file (needs upload)
      if (avatarUri && !avatarUri.startsWith('http')) {
        mediaToUpload.push({ uri: avatarUri });
      }

      // Check if cover is a local file (needs upload)
      if (coverUri && !coverUri.startsWith('http')) {
        mediaToUpload.push({ uri: coverUri });
      }

      if (mediaToUpload.length > 0) {
        const uploadResult = await imageUpload(mediaToUpload, isHD);

        // Map uploaded URLs back to correct fields
        let uploadIndex = 0;
        if (avatarUri && !avatarUri.startsWith('http')) {
          newAvatarUri = uploadResult[uploadIndex].url;
          uploadIndex++;
        }
        if (coverUri && !coverUri.startsWith('http')) {
          newCoverUri = uploadResult[uploadIndex].url;
        }
      }

      await updateUserProfile({
        ...formData,
        avatar: newAvatarUri,
        cover: newCoverUri,
      });

      // Update local user context
      if (setUser && user) {
        setUser({
          _id: user._id,
          username: user.username,
          ...formData,
          avatar: newAvatarUri,
          cover: newCoverUri,
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
      setIsHD(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent={false}>
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        {/* Header */}
        <View
          style={[
            styles.header,
            {
              backgroundColor: theme.colors.surface,
              borderBottomColor: theme.colors.outlineVariant,
            },
          ]}>
          <TouchableOpacity onPress={onClose} disabled={loading}>
            <Ionicons name="close" size={28} color={theme.colors.onSurface} />
          </TouchableOpacity>
          <View
            style={{
              flex: 1,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
            <Text style={[styles.headerTitle, { color: theme.colors.onSurface }]}>
              Edit Profile
            </Text>
            <View style={styles.hdToggleContainer}>
              <Text style={[styles.hdToggleText, { color: theme.colors.onSurfaceVariant }]}>
                HD
              </Text>
              <Switch
                value={isHD}
                onValueChange={setIsHD}
                trackColor={{ false: theme.colors.onSurfaceVariant, true: theme.colors.primary }}
                thumbColor={theme.colors.surface}
                style={{ transform: [{ scaleX: 0.7 }, { scaleY: 0.7 }] }}
              />
            </View>
          </View>
          <TouchableOpacity onPress={handleSave} disabled={loading}>
            {loading ? (
              <ActivityIndicator color={theme.colors.primary} />
            ) : (
              <Ionicons name="checkmark" size={28} color={theme.colors.primary} />
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
            <TouchableOpacity
              style={[
                styles.changeAvatarBtn,
                { backgroundColor: theme.colors.primary, borderColor: theme.colors.surface },
              ]}
              onPress={() => pickImage('avatar')}>
              <Ionicons name="camera" size={16} color={theme.colors.onPrimary} />
            </TouchableOpacity>
          </View>

          {/* Form Fields */}
          <View style={styles.formContainer}>
            {/* Full Name */}
            <View style={styles.fieldContainer}>
              <Text style={[styles.label, { color: theme.colors.onSurface }]}>Full Name</Text>
              <View style={styles.inputWrapper}>
                <TextInput
                  style={[
                    styles.input,
                    {
                      backgroundColor: theme.colors.surfaceVariant,
                      color: theme.colors.onSurface,
                      borderColor: theme.colors.outlineVariant,
                    },
                  ]}
                  value={formData.fullname}
                  onChangeText={(text) => setFormData({ ...formData, fullname: text })}
                  placeholder="Enter your full name"
                  placeholderTextColor={theme.colors.onSurfaceVariant}
                  maxLength={25}
                />
                <Text style={[styles.charCount, { color: theme.colors.onSurfaceVariant }]}>
                  {formData.fullname.length}/25
                </Text>
              </View>
            </View>

            {/* Mobile */}
            <View style={styles.fieldContainer}>
              <Text style={[styles.label, { color: theme.colors.onSurface }]}>Mobile</Text>
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: theme.colors.surfaceVariant,
                    color: theme.colors.onSurface,
                    borderColor: theme.colors.outlineVariant,
                  },
                ]}
                value={formData.mobile}
                onChangeText={(text) => setFormData({ ...formData, mobile: text })}
                placeholder="Enter your mobile number"
                placeholderTextColor={theme.colors.onSurfaceVariant}
                keyboardType="phone-pad"
              />
            </View>

            {/* Address */}
            <View style={styles.fieldContainer}>
              <Text style={[styles.label, { color: theme.colors.onSurface }]}>Address</Text>
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: theme.colors.surfaceVariant,
                    color: theme.colors.onSurface,
                    borderColor: theme.colors.outlineVariant,
                  },
                ]}
                value={formData.address}
                onChangeText={(text) => setFormData({ ...formData, address: text })}
                placeholder="Enter your address"
                placeholderTextColor={theme.colors.onSurfaceVariant}
              />
            </View>

            {/* Website */}
            <View style={styles.fieldContainer}>
              <Text style={[styles.label, { color: theme.colors.onSurface }]}>Website</Text>
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: theme.colors.surfaceVariant,
                    color: theme.colors.onSurface,
                    borderColor: theme.colors.outlineVariant,
                  },
                ]}
                value={formData.website}
                onChangeText={(text) => setFormData({ ...formData, website: text })}
                placeholder="Enter your website"
                placeholderTextColor={theme.colors.onSurfaceVariant}
                keyboardType="url"
                autoCapitalize="none"
              />
            </View>

            {/* Story/Bio */}
            <View style={styles.fieldContainer}>
              <Text style={[styles.label, { color: theme.colors.onSurface }]}>Bio</Text>
              <View style={styles.inputWrapper}>
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
                  value={formData.story}
                  onChangeText={(text) => setFormData({ ...formData, story: text })}
                  placeholder="Tell us about yourself"
                  placeholderTextColor={theme.colors.onSurfaceVariant}
                  multiline
                  numberOfLines={4}
                  maxLength={200}
                />
                <Text style={[styles.charCount, { color: theme.colors.onSurfaceVariant }]}>
                  {formData.story.length}/200
                </Text>
              </View>
            </View>

            {/* Gender */}
            <View style={styles.fieldContainer}>
              <Text style={[styles.label, { color: theme.colors.onSurface }]}>Gender</Text>
              <View style={styles.genderContainer}>
                <TouchableOpacity
                  style={[
                    styles.genderBtn,
                    {
                      backgroundColor: theme.colors.surfaceVariant,
                      borderColor: theme.colors.outlineVariant,
                    },
                    formData.gender === 'male' && [
                      styles.genderBtnActive,
                      { backgroundColor: theme.colors.primary, borderColor: theme.colors.primary },
                    ],
                  ]}
                  onPress={() => setFormData({ ...formData, gender: 'male' })}>
                  <Text
                    style={[
                      styles.genderText,
                      { color: theme.colors.onSurfaceVariant },
                      formData.gender === 'male' && [
                        styles.genderTextActive,
                        { color: theme.colors.onPrimary },
                      ],
                    ]}>
                    Male
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.genderBtn,
                    {
                      backgroundColor: theme.colors.surfaceVariant,
                      borderColor: theme.colors.outlineVariant,
                    },
                    formData.gender === 'female' && [
                      styles.genderBtnActive,
                      { backgroundColor: theme.colors.primary, borderColor: theme.colors.primary },
                    ],
                  ]}
                  onPress={() => setFormData({ ...formData, gender: 'female' })}>
                  <Text
                    style={[
                      styles.genderText,
                      { color: theme.colors.onSurfaceVariant },
                      formData.gender === 'female' && [
                        styles.genderTextActive,
                        { color: theme.colors.onPrimary },
                      ],
                    ]}>
                    Female
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Private Account Toggle */}
            <View
              style={[
                styles.fieldContainer,
                {
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginTop: 10,
                },
              ]}>
              <View>
                <Text style={[styles.label, { color: theme.colors.onSurface, marginBottom: 2 }]}>
                  Private Account
                </Text>
                <Text style={{ fontSize: 12, color: theme.colors.onSurfaceVariant }}>
                  Only followers can see your posts and stories
                </Text>
              </View>
              <Switch
                value={formData?.isPrivate}
                onValueChange={(val) => setFormData({ ...formData, isPrivate: val })}
                trackColor={{ false: theme.colors.onSurfaceVariant, true: theme.colors.primary }}
                thumbColor={theme.colors.surface}
              />
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
});

export default EditProfileModal;
