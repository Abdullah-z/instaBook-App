import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, TouchableOpacity, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

interface NotificationToastProps {
  visible: boolean;
  message: any;
  onClose: () => void;
}

const NotificationToast = ({ visible, message, onClose }: NotificationToastProps) => {
  const translateY = useRef(new Animated.Value(-200)).current;
  const navigation = useNavigation<any>();

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
      // In a real app we would parse the URL and navigate
      // For now, let's just navigate to Notifications or specific screen
      navigation.navigate('Notifications');
    } else {
      navigation.navigate('Notifications');
    }
  };

  if (!message) return null;

  return (
    <Animated.View style={[styles.container, { transform: [{ translateY }] }]}>
      <TouchableOpacity style={styles.content} onPress={handlePress}>
        <View style={styles.avatarContainer}>
          {message.user?.avatar ? (
            <Image source={{ uri: message.user.avatar }} style={styles.avatar} />
          ) : (
            <View style={styles.placeholderAvatar}>
              <Ionicons name="notifications" size={24} color="#FFF" />
            </View>
          )}
        </View>
        <View style={styles.textContainer}>
          <Text style={styles.title}>{message.user?.username || 'New Notification'}</Text>
          <Text style={styles.message} numberOfLines={2}>
            {message.text}
            {message.content && <Text style={styles.activeText}> {message.content}</Text>}
          </Text>
        </View>
        <TouchableOpacity onPress={handleClose} style={styles.closeBtn}>
          <Ionicons name="close" size={20} color="#666" />
        </TouchableOpacity>
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 50, // Below status bar
    left: 16,
    right: 16,
    zIndex: 9999,
    backgroundColor: '#fff',
    borderRadius: 12,
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
    padding: 12,
  },
  avatarContainer: {
    marginRight: 12,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  placeholderAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#D4F637',
    justifyContent: 'center',
    alignItems: 'center',
  },
  textContainer: {
    flex: 1,
  },
  title: {
    fontWeight: 'bold',
    fontSize: 14,
    color: '#333',
    marginBottom: 2,
  },
  message: {
    fontSize: 13,
    color: '#666',
    lineHeight: 18,
  },
  activeText: {
    color: '#333',
    fontWeight: '500',
  },
  closeBtn: {
    padding: 4,
  },
});

export default NotificationToast;
