import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from 'react-native-paper';
import { addOpacity } from '../utils/colorUtils';

interface UserCardProps {
  user: {
    _id: string;
    username: string;
    fullname: string;
    avatar: string;
  };
  onPress?: () => void;
  index?: number;
  color?: string;
}

const UserCard = ({ user, onPress, color }: UserCardProps) => {
  const navigation = useNavigation<any>();
  const theme = useTheme();

  const handlePress = () => {
    if (onPress) {
      onPress();
    } else {
      navigation.navigate('Profile', { id: user._id });
    }
  };

  const dynamicBg = addOpacity(theme.colors.secondaryContainer, theme.dark ? 0.15 : 0.05);

  const dynamicBorder = color ? addOpacity(color, 0.2) : theme.colors.outlineVariant;
  const textColor = color || theme.colors.onSurface;

  return (
    <TouchableOpacity
      style={[
        styles.container,
        {
          backgroundColor: dynamicBg,
          borderColor: dynamicBorder,
          borderRadius: 16,
          marginBottom: 10,
          borderWidth: 1,
        },
      ]}
      onPress={handlePress}>
      <Image
        source={{
          uri:
            user.avatar ||
            'https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460__340.png',
        }}
        style={styles.avatar}
      />
      <View style={styles.info}>
        <Text style={[styles.username, { color: textColor }]}>{user.username}</Text>
        <Text style={[styles.fullname, { color: theme.colors.onSurfaceVariant }]}>
          {user.fullname}
        </Text>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 15,
  },
  info: {
    flex: 1,
  },
  username: {
    fontWeight: 'bold',
    fontSize: 16,
    color: '#000',
  },
  fullname: {
    fontSize: 14,
    color: '#666',
  },
});

export default UserCard;
