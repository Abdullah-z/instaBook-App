import React, { useContext, useState } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import moment from 'moment';
import { AuthContext } from '../auth/AuthContext';
import { toggleInterestedAPI, toggleGoingAPI } from '../api/eventAPI';

const { width } = Dimensions.get('window');

interface Props {
  event: any;
  onUpdate?: (updatedEvent: any) => void;
}

const EventCard: React.FC<Props> = ({ event, onUpdate }) => {
  const navigation = useNavigation<any>();
  const { user } = useContext(AuthContext);
  const [loading, setLoading] = useState(false);

  const isInterested = event.interested.some((uid: any) =>
    typeof uid === 'string' ? uid === user?._id : uid._id === user?._id
  );
  const isGoing = event.going.some((uid: any) =>
    typeof uid === 'string' ? uid === user?._id : uid._id === user?._id
  );

  const handleInterested = async () => {
    setLoading(true);
    try {
      await toggleInterestedAPI(event._id);
      // For simplicity, we trigger a refresh or local update if onUpdate is provided
      if (onUpdate) onUpdate(event._id);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleGoing = async () => {
    setLoading(true);
    try {
      await toggleGoingAPI(event._id);
      if (onUpdate) onUpdate(event._id);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <TouchableOpacity
      style={styles.card}
      activeOpacity={0.9}
      onPress={() => navigation.navigate('EventDetail', { id: event._id })}>
      {event.image && <Image source={{ uri: event.image }} style={styles.image} />}
      <View style={styles.content}>
        <Text style={styles.dateText}>
          {moment(event.date).format('ddd, MMM D')} • {event.time}
        </Text>
        <Text style={styles.title}>{event.title}</Text>
        <View style={styles.locationRow}>
          <Ionicons name="location-outline" size={14} color="#65676B" />
          <Text style={styles.locationText} numberOfLines={1}>
            {event.address}
          </Text>
        </View>
        <Text style={styles.stats}>
          {event.going.length} going • {event.interested.length} interested
        </Text>

        <View style={styles.actions}>
          <TouchableOpacity
            style={[styles.actionBtn, isInterested && styles.activeBtn]}
            onPress={handleInterested}
            disabled={loading}>
            <Ionicons
              name={isInterested ? 'star' : 'star-outline'}
              size={18}
              color={isInterested ? '#fff' : '#1c1e21'}
            />
            <Text style={[styles.actionText, isInterested && styles.activeText]}>Interested</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionBtn, isGoing && styles.activeBtn]}
            onPress={handleGoing}
            disabled={loading}>
            <Ionicons
              name={isGoing ? 'checkmark-circle' : 'checkmark-circle-outline'}
              size={18}
              color={isGoing ? '#fff' : '#1c1e21'}
            />
            <Text style={[styles.actionText, isGoing && styles.activeText]}>Going</Text>
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginVertical: 8,
    marginHorizontal: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: 180,
    backgroundColor: '#eee',
  },
  content: {
    padding: 12,
  },
  dateText: {
    fontSize: 13,
    color: '#E4405F',
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1c1e21',
    marginVertical: 4,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  locationText: {
    fontSize: 14,
    color: '#65676B',
    marginLeft: 4,
    flex: 1,
  },
  stats: {
    fontSize: 13,
    color: '#65676B',
    marginBottom: 12,
  },
  actions: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: '#f0f2f5',
    paddingTop: 12,
    gap: 10,
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f0f2f5',
    paddingVertical: 8,
    borderRadius: 6,
    gap: 6,
  },
  activeBtn: {
    backgroundColor: '#1877f2',
  },
  actionText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1c1e21',
  },
  activeText: {
    color: '#fff',
  },
});

export default EventCard;
