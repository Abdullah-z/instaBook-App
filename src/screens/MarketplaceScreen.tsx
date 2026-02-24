import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Dimensions,
  RefreshControl,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { Searchbar, FAB, useTheme } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { getListingsAPI } from '../api/listingAPI';
import ListingCard from '../components/ListingCard';

const { width } = Dimensions.get('window');

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

  const renderListingItem = useCallback(
    ({ item, index }: { item: any; index: number }) => (
      <ListingCard
        item={item}
        index={index}
        onPress={(id) => navigation.navigate('ListingDetail', { id })}
      />
    ),
    [navigation]
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
        initialNumToRender={8}
        maxToRenderPerBatch={4}
        windowSize={5}
        removeClippedSubviews={Platform.OS === 'android'}
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
