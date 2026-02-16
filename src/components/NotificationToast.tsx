import React, { useEffect, useRef, useContext } from 'react';
import { View, Text, StyleSheet, Animated, TouchableOpacity, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from 'react-native-paper';
import { AuthContext } from '../auth/AuthContext';

interface NotificationToastProps {
  visible: boolean;
  message: any;
  onClose: () => void;
}

const NotificationToast = ({ visible, message, onClose }: NotificationToastProps) => {
  const translateY = useRef(new Animated.Value(-200)).current;
  const navigation = useNavigation<any>();
  const theme = useTheme();

  useEffect(() => {
    if (visible) {
      Animated.spring(translateY, {
        toValue: 0,
        useNativeDriver: true,
        friction: 5,
      }).start();

      const timer = setTimeout(() => {
        handleClose();
      }, 4000);

      return () => clearTimeout(timer);
    } else {
      handleClose();
    }
  }, [visible]);

  const handleClose = () => {
    Animated.timing(translateY, {
      toValue: -200,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      if (visible) onClose();
    });
  };

  const handlePress = () => {
    handleClose();
    if (message?.url) {
      navigation.navigate('Notifications');
    } else {
      navigation.navigate('Notifications');
    }
  };

  if (!message) return null;

  return (
    <Animated.View
      style={[
        styles.container,
        {
          backgroundColor: theme.colors.surface,
          borderColor: theme.colors.outlineVariant,
          transform: [{ translateY }],
        },
      ]}>
      <TouchableOpacity style={styles.content} onPress={handlePress}>
        <View style={styles.avatarContainer}>
          {message.user?.avatar &&
          typeof message.user.avatar === 'string' &&
          message.user.avatar.trim() !== '' ? (
            <Image source={{ uri: message.user.avatar }} style={styles.avatar} />
          ) : (
            <View
              style={[
                styles.placeholderAvatar,
                { backgroundColor: theme.colors.primaryContainer },
              ]}>
              <Ionicons name="notifications" size={24} color={theme.colors.onPrimaryContainer} />
            </View>
          )}
        </View>
        <View style={styles.textContainer}>
          <Text style={[styles.title, { color: theme.colors.onSurface }]}>
            {message.user?.username || 'New Notification'}
          </Text>
          <Text
            style={[styles.message, { color: theme.colors.onSurfaceVariant }]}
            numberOfLines={2}>
            {message.text}
            {message.content && (
              <Text style={[styles.activeText, { color: theme.colors.onSurface }]}>
                {' '}
                {message.content}
              </Text>
            )}
          </Text>
        </View>
        <TouchableOpacity onPress={handleClose} style={styles.closeBtn}>
          <Ionicons name="close" size={20} color={theme.colors.onSurfaceVariant} />
        </TouchableOpacity>
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 50,
    left: 16,
    right: 16,
    zIndex: 9999,
    borderRadius: 24, // Consistent with themes
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 6,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  avatarContainer: {
    marginRight: 12,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
  },
  placeholderAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  textContainer: {
    flex: 1,
  },
  title: {
    fontWeight: 'bold',
    fontSize: 15,
    marginBottom: 2,
  },
  message: {
    fontSize: 14,
    lineHeight: 18,
  },
  activeText: {
    fontWeight: 'bold',
  },
  closeBtn: {
    padding: 4,
    marginLeft: 8,
  },
});

export default NotificationToast;
