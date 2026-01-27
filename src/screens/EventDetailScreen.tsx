import React, { useEffect, useState, useContext } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  Dimensions,
  Alert,
  FlatList,
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import moment from 'moment';
import { getEventAPI, toggleInterestedAPI, toggleGoingAPI, deleteEventAPI } from '../api/eventAPI';
import { AuthContext } from '../auth/AuthContext';
import { Avatar, Divider } from 'react-native-paper';
import { getMapPreview } from '../utils/getMapPreview';

const { width } = Dimensions.get('window');

const EventDetailScreen = () => {
  const route = useRoute<any>();
  const navigation = useNavigation<any>();
  const { user } = useContext(AuthContext);
  const [event, setEvent] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchEvent = async () => {
    try {
      const res = await getEventAPI(route.params.id);
      setEvent(res.event);
    } catch (err) {
      console.error(err);
      Alert.alert('Error', 'Could not load event details.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvent();
  }, [route.params.id]);

  const handleToggle = async (type: 'interested' | 'going') => {
    setActionLoading(true);
    try {
      if (type === 'interested') await toggleInterestedAPI(event._id);
      else await toggleGoingAPI(event._id);
      fetchEvent();
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = () => {
    Alert.alert('Delete Event', 'Are you sure you want to delete this event?', [
      { text: 'Cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteEventAPI(event._id);
            navigation.goBack();
          } catch (err) {
            console.error(err);
          }
        },
      },
    ]);
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#1877f2" />
      </View>
    );
  }

  if (!event) return null;

  const isInterested = event.interested.some((u: any) => u._id === user?._id);
  const isGoing = event.going.some((u: any) => u._id === user?._id);
  const mapPreview = getMapPreview(event.location.coordinates[1], event.location.coordinates[0]);

  return (
    <ScrollView style={styles.container}>
      {event.image && <Image source={{ uri: event.image }} style={styles.headerImage} />}

      <View style={styles.content}>
        <Text style={styles.dateText}>
          {moment(event.date).format('dddd, MMMM D')} at {event.time}
        </Text>
        <Text style={styles.title}>{event.title}</Text>

        <View style={styles.hostRow}>
          <Avatar.Image size={32} source={{ uri: event.user.avatar }} />
          <Text style={styles.hostText}>
            Hosted by <Text style={{ fontWeight: 'bold' }}>{event.user.fullname}</Text>
          </Text>
        </View>

        <Divider style={styles.divider} />

        <View style={styles.infoRow}>
          <Ionicons name="location" size={24} color="#65676B" />
          <View style={styles.infoTextCol}>
            <Text style={styles.infoTitle}>{event.address}</Text>
            <Text style={styles.infoSub}>Location Details</Text>
          </View>
        </View>

        <TouchableOpacity
          style={styles.mapContainer}
          onPress={() =>
            navigation.navigate('Map', {
              initialRegion: {
                latitude: event.location.coordinates[1],
                longitude: event.location.coordinates[0],
                latitudeDelta: 0.01,
                longitudeDelta: 0.01,
              },
              highlightEventId: event._id,
            })
          }>
          <Image source={{ uri: mapPreview }} style={styles.mapImage} />
        </TouchableOpacity>

        <Divider style={styles.divider} />

        <Text style={styles.sectionTitle}>Details</Text>
        <Text style={styles.description}>{event.description}</Text>

        <Divider style={styles.divider} />

        <View style={styles.statsRow}>
          <View style={styles.statBox}>
            <Text style={styles.statNum}>{event.going.length}</Text>
            <Text style={styles.statLabel}>Going</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statNum}>{event.interested.length}</Text>
            <Text style={styles.statLabel}>Interested</Text>
          </View>
        </View>

        <View style={styles.attendeesList}>
          {event.going.length > 0 && (
            <View style={styles.attendeeSection}>
              <Text style={styles.attendeeSectionTitle}>Going ({event.going.length})</Text>
              <FlatList
                data={event.going}
                horizontal
                showsHorizontalScrollIndicator={false}
                keyExtractor={(item: any) => item._id}
                renderItem={({ item }: { item: any }) => (
                  <TouchableOpacity
                    style={styles.attendeeItem}
                    onPress={() => navigation.navigate('Profile', { id: item._id })}>
                    <Avatar.Image size={40} source={{ uri: item.avatar }} />
                    <Text style={styles.attendeeName} numberOfLines={1}>
                      {item.fullname.split(' ')[0]}
                    </Text>
                  </TouchableOpacity>
                )}
              />
            </View>
          )}

          {event.interested.length > 0 && (
            <View style={styles.attendeeSection}>
              <Text style={styles.attendeeSectionTitle}>
                Interested ({event.interested.length})
              </Text>
              <FlatList
                data={event.interested}
                horizontal
                showsHorizontalScrollIndicator={false}
                keyExtractor={(item: any) => item._id}
                renderItem={({ item }: { item: any }) => (
                  <TouchableOpacity
                    style={styles.attendeeItem}
                    onPress={() => navigation.navigate('Profile', { id: item._id })}>
                    <Avatar.Image size={40} source={{ uri: item.avatar }} />
                    <Text style={styles.attendeeName} numberOfLines={1}>
                      {item.fullname.split(' ')[0]}
                    </Text>
                  </TouchableOpacity>
                )}
              />
            </View>
          )}
        </View>
      </View>

      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.actionBtn, isInterested && styles.activeBtnInterested]}
          onPress={() => handleToggle('interested')}
          disabled={actionLoading}>
          <Ionicons
            name={isInterested ? 'star' : 'star-outline'}
            size={20}
            color={isInterested ? '#fff' : '#1c1e21'}
          />
          <Text style={[styles.actionText, isInterested && styles.activeText]}>Interested</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionBtn, isGoing && styles.activeBtnGoing, { flex: 2 }]}
          onPress={() => handleToggle('going')}
          disabled={actionLoading}>
          <Ionicons
            name={isGoing ? 'checkmark-circle' : 'checkmark-circle-outline'}
            size={20}
            color={isGoing ? '#fff' : '#1c1e21'}
          />
          <Text style={[styles.actionText, isGoing && styles.activeText]}>Going</Text>
        </TouchableOpacity>

        {event.user._id === user?._id && (
          <>
            <TouchableOpacity
              style={styles.deleteBtn}
              onPress={() => navigation.navigate('EditEvent', { eventId: event._id })}>
              <Ionicons name="pencil-outline" size={24} color="#1c1e21" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.deleteBtn} onPress={handleDelete}>
              <Ionicons name="trash-outline" size={24} color="#FF3B30" />
            </TouchableOpacity>
          </>
        )}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerImage: {
    width: '100%',
    height: 250,
    backgroundColor: '#f0f2f5',
  },
  content: {
    padding: 16,
  },
  dateText: {
    fontSize: 14,
    color: '#E4405F',
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1c1e21',
    marginVertical: 8,
  },
  hostRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 10,
  },
  hostText: {
    marginLeft: 10,
    fontSize: 15,
    color: '#65676B',
  },
  divider: {
    marginVertical: 16,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  infoTextCol: {
    marginLeft: 12,
    flex: 1,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1c1e21',
  },
  infoSub: {
    fontSize: 14,
    color: '#65676B',
  },
  mapContainer: {
    height: 120,
    backgroundColor: '#f0f2f5',
    borderRadius: 8,
    marginTop: 12,
    overflow: 'hidden',
  },
  mapImage: {
    width: '100%',
    height: '100%',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1c1e21',
    marginBottom: 8,
  },
  description: {
    fontSize: 16,
    color: '#1c1e21',
    lineHeight: 24,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 30,
  },
  statBox: {
    alignItems: 'center',
  },
  statNum: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1c1e21',
  },
  statLabel: {
    fontSize: 14,
    color: '#65676B',
  },
  attendeesList: {
    marginTop: 15,
  },
  attendeeSection: {
    marginBottom: 20,
  },
  attendeeSectionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#65676B',
    marginBottom: 10,
    textTransform: 'uppercase',
  },
  attendeeItem: {
    alignItems: 'center',
    marginRight: 15,
    width: 60,
  },
  attendeeName: {
    fontSize: 12,
    color: '#1c1e21',
    marginTop: 5,
    textAlign: 'center',
  },
  footer: {
    flexDirection: 'row',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#f0f2f5',
    gap: 10,
    alignItems: 'center',
    marginBottom: 30,
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f0f2f5',
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
  },
  activeBtnInterested: {
    backgroundColor: '#E4405F',
  },
  activeBtnGoing: {
    backgroundColor: '#1877f2',
  },
  activeText: {
    color: '#fff',
  },
  actionText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1c1e21',
  },
  deleteBtn: {
    padding: 10,
  },
});

export default EventDetailScreen;
