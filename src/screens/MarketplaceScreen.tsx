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
      activeOpacity={0.9}
      style={[
        styles.card,
        {
          backgroundColor: theme.colors.surface,
          borderColor: theme.colors.outlineVariant,
          elevation: 2,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.1,
          shadowRadius: 8,
        },
      ]}
      onPress={() => navigation.navigate('ListingDetail', { id: item._id })}>
      <View style={styles.imageContainer}>
        <Image
          source={{ uri: item.images[0] }}
          style={[styles.cardImage, { backgroundColor: theme.colors.surfaceVariant }]}
        />
        <View style={[styles.priceTag, { backgroundColor: theme.colors.primaryContainer }]}>
          <Text style={[styles.priceText, { color: theme.colors.onPrimaryContainer }]}>
            ${item.price}
          </Text>
        </View>
        {item.isSold && (
          <View style={styles.soldOverlay}>
            <Text style={styles.soldText}>SOLD</Text>
          </View>
        )}
      </View>
      <View style={styles.cardContent}>
        <Text
          style={[styles.cardName, { color: theme.colors.onSurface, fontWeight: '700' }]}
          numberOfLines={1}>
          {item.name}
        </Text>
        <View style={styles.locationRow}>
          <Ionicons name="location-sharp" size={12} color={theme.colors.primary} />
          <Text
            style={[
              styles.cardLocation,
              { color: theme.colors.onSurfaceVariant, fontWeight: '600' },
            ]}
            numberOfLines={1}>
            {item.address}
          </Text>
        </View>
        <View style={styles.cardFooter}>
          <View style={styles.sellerMini}>
            <Image
              source={{ uri: item.user?.avatar || 'https://via.placeholder.com/20' }}
              style={styles.miniAvatar}
            />
            <Text style={[styles.miniUsername, { color: theme.colors.onSurfaceVariant }]}>
              @{item.user?.username}
            </Text>
          </View>
          <Text style={[styles.timeText, { color: theme.colors.onSurfaceVariant }]}>
            {moment(item.createdAt).fromNow(true)}
          </Text>
        </View>
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
          {
            backgroundColor: theme.colors.surface,
            borderBottomColor: theme.colors.outlineVariant,
            paddingTop: 16,
            paddingBottom: 16,
          },
        ]}>
        <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12 }}>
          <Searchbar
            placeholder="Search marketplace"
            onChangeText={handleSearch}
            value={searchQuery}
            style={[
              styles.searchbar,
              {
                flex: 1,
                marginRight: 12,
                backgroundColor: theme.colors.surfaceVariant,
                borderRadius: 18,
                height: 48,
              },
            ]}
            placeholderTextColor={theme.colors.onSurfaceVariant}
            iconColor={theme.colors.primary}
            inputStyle={{
              color: theme.colors.onSurface,
              fontSize: 14,
              fontWeight: '600',
              minHeight: 0,
            }}
          />
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => navigation.navigate('MyListings' as never)}>
            <View
              style={{
                padding: 8,
                backgroundColor: theme.colors.surfaceVariant,
                borderRadius: 14,
                width: 44,
                height: 44,
                justifyContent: 'center',
                alignItems: 'center',
              }}>
              <Ionicons name="bag-handle" size={24} color={theme.colors.onSurface} />
            </View>
          </TouchableOpacity>
        </View>
      </View>

      <FlatList
        data={filteredListings}
        renderItem={renderListingItem}
        keyExtractor={(item) => item._id}
        numColumns={2}
        contentContainerStyle={styles.listContent}
        columnWrapperStyle={{ justifyContent: 'space-between' }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <View
              style={{
                width: 120,
                height: 120,
                borderRadius: 60,
                backgroundColor: theme.colors.surfaceVariant,
                justifyContent: 'center',
                alignItems: 'center',
                marginBottom: 20,
              }}>
              <Ionicons name="cart" size={60} color={theme.colors.outline} />
            </View>
            <Text
              style={[
                styles.emptyText,
                { color: theme.colors.onSurface, fontWeight: '700', fontSize: 18 },
              ]}>
              No listings available
            </Text>
            <Text style={{ color: theme.colors.onSurfaceVariant, fontWeight: '500', marginTop: 8 }}>
              Check back later or try another search
            </Text>
          </View>
        }
      />

      <FAB
        icon="plus"
        style={[styles.fab, { backgroundColor: theme.colors.primary, borderRadius: 20 }]}
        onPress={() => navigation.navigate('CreateListing')}
        label="Create"
        uppercase={false}
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
    elevation: 2,
    borderBottomWidth: 1,
  },
  searchbar: {
    elevation: 0,
  },
  listContent: {
    padding: 12,
  },
  card: {
    width: CARD_WIDTH - 6,
    marginBottom: 16,
    borderRadius: 24,
    overflow: 'hidden',
    borderWidth: 1,
  },
  imageContainer: {
    width: '100%',
    height: CARD_WIDTH,
    position: 'relative',
  },
  cardImage: {
    width: '100%',
    height: '100%',
  },
  priceTag: {
    position: 'absolute',
    top: 12,
    left: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  priceText: {
    color: '#000',
    fontWeight: '900',
    fontSize: 14,
  },
  cardContent: {
    padding: 12,
    gap: 4,
  },
  cardName: {
    fontSize: 15,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  cardLocation: {
    fontSize: 11,
    flex: 1,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 6,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.05)',
  },
  sellerMini: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  miniAvatar: {
    width: 18,
    height: 18,
    borderRadius: 9,
  },
  miniUsername: {
    fontSize: 10,
    fontWeight: '700',
  },
  timeText: {
    fontSize: 9,
    fontWeight: '500',
  },
  soldOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  soldText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '900',
    borderWidth: 2,
    borderColor: '#fff',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 8,
    transform: [{ rotate: '-15deg' }],
    letterSpacing: 2,
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
    paddingTop: 100,
  },
  emptyText: {
    fontSize: 16,
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 8,
    bottom: 8,
    elevation: 8,
  },
});

export default MarketplaceScreen;
