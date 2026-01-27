import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  Dimensions,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { Searchbar, FAB, useTheme } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { getListingsAPI } from '../api/listingAPI';
import moment from 'moment';

const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - 40) / 2;

const MarketplaceScreen = () => {
  const navigation = useNavigation<any>();
  const theme = useTheme();
  const [listings, setListings] = useState<any[]>([]);
  const [filteredListings, setFilteredListings] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadListings = async () => {
    try {
      const res = await getListingsAPI();
      setListings(res.listings || []);
      setFilteredListings(res.listings || []);
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

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    if (query.trim() === '') {
      setFilteredListings(listings);
    } else {
      const filtered = listings.filter(
        (item) =>
          item.name.toLowerCase().includes(query.toLowerCase()) ||
          item.description.toLowerCase().includes(query.toLowerCase())
      );
      setFilteredListings(filtered);
    }
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
        <Text
          style={[styles.cardLocation, { color: theme.colors.onSurfaceVariant }]}
          numberOfLines={1}>
          {item.address}
        </Text>
        <Text
          style={[
            styles.cardLocation,
            { fontSize: 10, marginTop: 4, color: theme.colors.onSurfaceVariant },
          ]}>
          {moment(item.createdAt).format('MMM D, YYYY')}
          {'\n'}
          {moment(item.createdAt).format('h:mm A')}
        </Text>
        {item.isSold && (
          <View style={styles.soldBadge}>
            <Text style={styles.soldText}>SOLD</Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={[styles.center, { backgroundColor: theme.colors.background }]}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View
        style={[
          styles.header,
          { backgroundColor: theme.colors.surface, borderBottomColor: theme.colors.outlineVariant },
        ]}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Searchbar
            placeholder="Search marketplace"
            onChangeText={handleSearch}
            value={searchQuery}
            style={[
              styles.searchbar,
              { flex: 1, marginRight: 10, backgroundColor: theme.colors.surfaceVariant },
            ]}
            placeholderTextColor={theme.colors.onSurfaceVariant}
            iconColor={theme.colors.onSurfaceVariant}
            inputStyle={{ color: theme.colors.onSurface }}
          />
          <TouchableOpacity onPress={() => navigation.navigate('MyListings' as never)}>
            <Ionicons name="list-circle-outline" size={34} color={theme.colors.onSurface} />
          </TouchableOpacity>
        </View>
      </View>

      <FlatList
        data={filteredListings}
        renderItem={renderListingItem}
        keyExtractor={(item) => item._id}
        numColumns={2}
        contentContainerStyle={styles.listContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="cart-outline" size={80} color={theme.colors.outline} />
            <Text style={[styles.emptyText, { color: theme.colors.onSurfaceVariant }]}>
              No listings available
            </Text>
          </View>
        }
      />

      <FAB
        icon="plus"
        style={[styles.fab, { backgroundColor: theme.colors.primary }]}
        onPress={() => navigation.navigate('CreateListing')}
        label="Sell"
        color={theme.colors.onPrimary}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: 10,
    borderBottomWidth: 1,
  },
  searchbar: {
    elevation: 0,
  },
  listContent: {
    padding: 10,
  },
  card: {
    width: CARD_WIDTH,
    margin: 5,
    borderRadius: 10,
    overflow: 'hidden',
    borderWidth: 1,
  },
  cardImage: {
    width: '100%',
    height: CARD_WIDTH,
  },
  cardContent: {
    padding: 10,
  },
  cardPrice: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  cardName: {
    fontSize: 14,
    marginTop: 2,
  },
  cardLocation: {
    fontSize: 12,
    marginTop: 2,
  },
  soldBadge: {
    position: 'absolute',
    top: 5,
    right: 5,
    backgroundColor: 'red',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  soldText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
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
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
  },
});

export default MarketplaceScreen;
