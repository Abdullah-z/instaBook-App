import { Image } from 'expo-image';
import React, { useState, useEffect, useContext } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useTheme } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { getProfileUser, acceptFollowRequestAPI, rejectFollowRequestAPI } from '../api/profileAPI';
import { AuthContext } from '../auth/AuthContext';
import { Ionicons } from '@expo/vector-icons';

const FollowRequestsScreen = () => {
  const { user, token } = useContext(AuthContext);
  const theme = useTheme();
  const navigation = useNavigation();
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchRequests = async () => {
    try {
      if (user) {
        const res = await getProfileUser(user._id);
        // res.user.followRequests should be populated
        setRequests(res.user.followRequests || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, [user]);

  const handleAccept = async (requesterId: string) => {
    try {
      await acceptFollowRequestAPI(requesterId);
      setRequests((prev) => prev.filter((r) => r._id !== requesterId));
    } catch (err) {
      console.error('Accept failed', err);
    }
  };

  const handleReject = async (requesterId: string) => {
    try {
      await rejectFollowRequestAPI(requesterId);
      setRequests((prev) => prev.filter((r) => r._id !== requesterId));
    } catch (err) {
      console.error('Reject failed', err);
    }
  };

  const renderItem = ({ item }: { item: any }) => (
    <View style={[styles.item, { backgroundColor: theme.colors.surface }]}>
      <TouchableOpacity
        style={styles.userInfo}
        onPress={() => navigation.navigate('Profile', { userId: item._id })}>
        <Image source={{ uri: item.avatar }} style={styles.avatar} />
        <View style={styles.textContainer}>
          <Text style={[styles.username, { color: theme.colors.onSurface }]}>{item.username}</Text>
          <Text style={[styles.fullname, { color: theme.colors.onSurfaceVariant }]}>
            {item.fullname}
          </Text>
        </View>
      </TouchableOpacity>

      <View style={styles.actions}>
        <TouchableOpacity
          style={[styles.btn, { backgroundColor: theme.colors.primary }]}
          onPress={() => handleAccept(item._id)}>
          <Text style={{ color: theme.colors.onPrimary, fontWeight: 'bold', fontSize: 12 }}>
            Accept
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.btn, { backgroundColor: theme.colors.errorContainer, marginLeft: 8 }]}
          onPress={() => handleReject(item._id)}>
          <Ionicons name="close" size={16} color={theme.colors.error} />
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* <View style={[styles.header, { borderBottomColor: theme.colors.outlineVariant }]}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={theme.colors.onSurface} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: theme.colors.onSurface }]}>Follow Requests</Text>
      </View> */}

      {loading ? (
        <ActivityIndicator size="large" color={theme.colors.primary} style={{ marginTop: 20 }} />
      ) : (
        <FlatList
          data={requests}
          keyExtractor={(item) => item._id}
          renderItem={renderItem}
          ListEmptyComponent={
            <Text
              style={{ textAlign: 'center', marginTop: 20, color: theme.colors.onSurfaceVariant }}>
              No pending requests.
            </Text>
          }
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginLeft: 16,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    marginHorizontal: 16,
    marginVertical: 4,
    borderRadius: 12,
    elevation: 1,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  textContainer: {
    justifyContent: 'center',
  },
  username: {
    fontWeight: 'bold',
    fontSize: 14,
  },
  fullname: {
    fontSize: 12,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  btn: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default FollowRequestsScreen;
