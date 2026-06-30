import React, { useContext } from 'react';
import { TouchableOpacity, View, StyleSheet } from 'react-native';
import { Avatar, useTheme, Text } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { AuthContext } from '../auth/AuthContext';
import useSocketStore from '../store/useSocketStore';
import { useData } from '../hooks';

const HeaderRightActions = () => {
  const { user } = useContext(AuthContext);
  const { unreadCount } = useSocketStore();
  const { isDark, handleIsDark } = useData();
  const navigation = useNavigation<any>();
  const theme = useTheme();

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.iconBtn}
        onPress={() => navigation.navigate('Search' as never)}>
        <Ionicons name="search-outline" size={24} color={theme.colors.onSurface} />
      </TouchableOpacity>

      <TouchableOpacity style={styles.iconBtn} onPress={() => handleIsDark()}>
        <Ionicons
          name={isDark ? 'sunny-outline' : 'moon-outline'}
          size={24}
          color={theme.colors.onSurface}
        />
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.iconBtn}
        onPress={() => navigation.navigate('Notifications' as never)}>
        <View>
          <Ionicons name="notifications-outline" size={24} color={theme.colors.onSurface} />
          {unreadCount > 0 && (
            <View style={[styles.badge, { backgroundColor: theme.colors.error }]}>
              <Text style={styles.badgeText}>{unreadCount > 9 ? '9+' : unreadCount}</Text>
            </View>
          )}
        </View>
      </TouchableOpacity>

      <TouchableOpacity style={styles.profileBtn} onPress={() => navigation.navigate('Profile')}>
        <View style={[styles.avatarContainer, { borderColor: theme.colors.outlineVariant }]}>
          {user?.avatar ? (
            <Avatar.Image size={32} source={{ uri: user.avatar }} />
          ) : (
            <Avatar.Icon size={32} icon="account" />
          )}
        </View>
      </TouchableOpacity>
    </View>
  );
};

export default HeaderRightActions;

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingRight: 10,
  },
  iconBtn: {
    padding: 8,
    marginRight: 4,
  },
  profileBtn: {
    marginLeft: 4,
    marginRight: 5,
  },
  avatarContainer: {
    borderWidth: 1,
    borderRadius: 20,
    overflow: 'hidden',
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -4,
    borderRadius: 9,
    minWidth: 18,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#fff',
    paddingHorizontal: 2,
  },
  badgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
});
