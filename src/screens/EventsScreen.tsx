import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { useTheme } from 'react-native-paper';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { getEventsAPI } from '../api/eventAPI';
import EventCard from '../components/EventCard';

const EventsScreen = () => {
  const navigation = useNavigation<any>();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const theme = useTheme();

  const fetchEvents = async () => {
    try {
      const res = await getEventsAPI();
      setEvents(res.events);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchEvents();
    }, [])
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchEvents();
  };

  if (loading && !refreshing) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: theme.colors.background }]}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <FlatList
        data={events}
        keyExtractor={(item: any) => item._id}
        renderItem={({ item }) => <EventCard event={item} onUpdate={fetchEvents} />}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="calendar-outline" size={80} color={theme.colors.outline} />
            <Text style={[styles.emptyText, { color: theme.colors.onSurfaceVariant }]}>
              No upcoming events found.
            </Text>
            <TouchableOpacity
              style={[styles.createFirstBtn, { backgroundColor: theme.colors.primary }]}
              onPress={() => navigation.navigate('CreateEvent')}>
              <Text style={[styles.createFirstTxt, { color: theme.colors.onPrimary }]}>
                Create an Event
              </Text>
            </TouchableOpacity>
          </View>
        }
        ListHeaderComponent={
          <View
            style={[
              styles.header,
              {
                backgroundColor: theme.colors.surface,
                borderBottomColor: theme.colors.outlineVariant,
              },
            ]}>
            <View>
              <Text style={[styles.headerTitle, { color: theme.colors.onSurface }]}>
                Upcoming Events
              </Text>
              <TouchableOpacity onPress={() => navigation.navigate('MyEvents')}>
                <Text style={{ color: theme.colors.primary, fontWeight: 'bold', marginTop: 4 }}>
                  My Created Events
                </Text>
              </TouchableOpacity>
            </View>
            <TouchableOpacity onPress={() => navigation.navigate('CreateEvent')}>
              <Ionicons name="add-circle" size={32} color={theme.colors.primary} />
            </TouchableOpacity>
          </View>
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f0f2f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#1c1e21',
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 100,
  },
  emptyText: {
    fontSize: 18,
    color: '#65676B',
    marginTop: 20,
    marginBottom: 20,
  },
  createFirstBtn: {
    backgroundColor: '#1877f2',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 6,
  },
  createFirstTxt: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
});

export default EventsScreen;
