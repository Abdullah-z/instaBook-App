import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  RefreshControl,
  Dimensions,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { getMyListingsAPI, deleteListingAPI } from '../api/listingAPI';
import moment from 'moment';
import { Button, useTheme } from 'react-native-paper';

const { width } = Dimensions.get('window');
const COLUMN_WIDTH = (width - 40) / 2;

const MyListingsScreen = () => {
  const navigation = useNavigation<any>();
  const theme = useTheme();
  const [listings, setListings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadListings = async () => {
    try {
      const res = await getMyListingsAPI();
      setListings(res.listings || []);
    } catch (err) {
      console.error('Failed to load listings:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadListings();
    }, [])
  );

  const onRefresh = () => {
    setRefreshing(true);
    loadListings();
  };

  const handleDelete = (id: string) => {
    Alert.alert('Delete Listing', 'Are you sure you want to delete this listing?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteListingAPI(id);
            loadListings();
          } catch (err) {
            console.error('Failed to delete:', err);
          }
        },
      },
    ]);
  };

  const renderListingItem = ({ item }: { item: any }) => (
    <TouchableOpacity
      style={[
        styles.card,
        { backgroundColor: theme.colors.surface, borderColor: theme.colors.outlineVariant },
      ]}
      onPress={() => navigation.navigate('ListingDetail', { id: item._id })}>
      <Image
        source={{ uri: item.images[0] }}
        style={[styles.cardImage, { backgroundColor: theme.colors.surfaceVariant }]}
      />
      <View style={styles.cardContent}>
        <Text style={[styles.cardPrice, { color: theme.colors.primary }]}>${item.price}</Text>
        <Text style={[styles.cardName, { color: theme.colors.onSurface }]} numberOfLines={1}>
          {item.name}
        </Text>
        <View
          style={[
            styles.statusBadge,
            { backgroundColor: item.isSold ? theme.colors.error : theme.colors.primary },
          ]}>
          <Text style={styles.statusText}>{item.isSold ? 'SOLD' : 'AVAILABLE'}</Text>
        </View>
        <Text style={{ fontSize: 10, color: theme.colors.onSurfaceVariant, marginTop: 4 }}>
          {moment(item.createdAt).format('MMM D, YYYY')}
          {'\n'}
          {moment(item.createdAt).format('h:mm A')}
        </Text>
        <View style={styles.cardActions}>
          <TouchableOpacity
            onPress={() => navigation.navigate('CreateListing', { editListing: item })}>
            <Ionicons name="create-outline" size={20} color={theme.colors.onSurface} />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => handleDelete(item._id)}>
            <Ionicons name="trash-outline" size={20} color="red" />
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      ) : (
        <FlatList
          data={listings}
          renderItem={renderListingItem}
          keyExtractor={(item) => item._id}
          numColumns={2}
          contentContainerStyle={styles.listContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="cart-outline" size={80} color={theme.colors.outline} />
              <Text style={[styles.emptyText, { color: theme.colors.onSurfaceVariant }]}>
                You haven't listed anything yet
              </Text>
              <Button
                mode="contained"
                onPress={() => navigation.navigate('CreateListing')}
                style={{ marginTop: 20 }}
                buttonColor={theme.colors.primary}
                textColor={theme.colors.onPrimary}>
                Start Selling
              </Button>
            </View>
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
  listContent: {
    padding: 10,
  },
  card: {
    width: COLUMN_WIDTH,
    margin: 5,
    borderRadius: 10,
    overflow: 'hidden',
    borderWidth: 1,
  },
  cardImage: {
    width: '100%',
    height: COLUMN_WIDTH,
    backgroundColor: '#f9f9f9',
  },
  cardContent: {
    padding: 10,
  },
  cardPrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#000',
  },
  cardName: {
    fontSize: 14,
    marginTop: 2,
  },
  statusBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginTop: 5,
  },
  statusText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  cardActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 15,
    marginTop: 10,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 100,
  },
  emptyText: {
    marginTop: 16,
    fontSize: 16,
    color: '#999',
  },
});

export default MyListingsScreen;
