import React, { useContext } from 'react';
import { TouchableOpacity, View } from 'react-native';
import { Avatar } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { AuthContext } from '../auth/AuthContext';

const ProfileHeaderIcon = () => {
  const { user } = useContext(AuthContext);
  const navigation = useNavigation<any>();

  return (
    <TouchableOpacity onPress={() => navigation.navigate('Profile')}>
      <View style={{ marginRight: 15, borderWidth: 1, borderColor: '#ddd', borderRadius: 20 }}>
        {user?.avatar && typeof user.avatar === 'string' && user.avatar.trim() !== '' ? (
          <Avatar.Image size={32} source={{ uri: user.avatar }} />
        ) : (
          <Avatar.Icon size={32} icon="account" />
        )}
      </View>
    </TouchableOpacity>
  );
};

export default ProfileHeaderIcon;
