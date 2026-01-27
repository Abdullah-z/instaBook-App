import React, { useEffect, useState, useContext } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  Image,
  TouchableOpacity,
  Dimensions,
  ActivityIndicator,
  Alert,
  Linking,
  RefreshControl,
  Modal as RNModal,
} from 'react-native';
import ImageView from 'react-native-image-viewing';
import {
  Text,
  Button,
  Avatar,
  Divider,
  List,
  TextInput,
  useTheme as usePaperTheme,
} from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import { useRoute, useNavigation } from '@react-navigation/native';
import {
  getListingAPI,
  markListingAsSoldAPI,
  deleteListingAPI,
  placeBidAPI,
} from '../api/listingAPI';
import { AuthContext } from '../auth/AuthContext';
import { VoiceCallContext } from '../auth/VoiceCallContext';
import Carousel from 'react-native-reanimated-carousel';
import LeafletMap from '../components/LeafletMap';
import Constants from 'expo-constants';
import { promptSaveImage } from '../utils/MediaUtils';
import moment from 'moment';

const isExpoGo = Constants.appOwnership === 'expo';

const { width } = Dimensions.get('window');

const ListingDetailScreen = () => {
  const route = useRoute<any>();
  const navigation = useNavigation<any>();
  const { id } = route.params || {};
  const { user } = useContext(AuthContext);
  const { initiateCall } = useContext(VoiceCallContext);
  const theme = usePaperTheme();

  const [listing, setListing] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [bidAmount, setBidAmount] = useState('');
  const [timeLeft, setTimeLeft] = useState('');
  const [placingBid, setPlacingBid] = useState(false);
  const [viewerVisible, setViewerVisible] = useState(false);
  const [viewerIndex, setViewerIndex] = useState(0);

  useEffect(() => {
    if (id) {
      loadListing();
    } else {
      setLoading(false);
      Alert.alert('Error', 'Listing not found', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    }
  }, [id]);

  const loadListing = async () => {
    try {
      const res = await getListingAPI(id);
      setListing(res.listing);
      if (res.listing.price) {
        setBidAmount((res.listing.currentBid || 0).toString());
      }
    } catch (err) {
      console.error('Failed to load listing:', err);
      Alert.alert('Error', 'Could not load listing details.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadListing();
  };

  useEffect(() => {
    if (!listing?.bidEndTime || listing.isSold) return;

    const interval = setInterval(() => {
      const now = moment();
      const end = moment(listing.bidEndTime);
      const diff = end.diff(now);

      if (diff <= 0) {
        setTimeLeft('Auction Ended');
        clearInterval(interval);
      } else {
        const duration = moment.duration(diff);
        setTimeLeft(
          `${duration.days() > 0 ? duration.days() + 'd ' : ''}${duration.hours()}h ${duration.minutes()}m ${duration.seconds()}s`
        );
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [listing?.bidEndTime, listing?.isSold]);

  const handlePlaceBid = async () => {
    const amount = parseFloat(bidAmount);
    if (isNaN(amount)) return Alert.alert('Error', 'Please enter a valid amount.');

    if (amount <= (listing.currentBid || 0)) {
      return Alert.alert('Error', 'Bid must be higher than current bid.');
    }

    if (amount > listing.price) {
      return Alert.alert('Error', 'Bid cannot exceed asking price.');
    }

    setPlacingBid(true);
    try {
      const res = await placeBidAPI(id, amount);
      setListing(res.listing);
      Alert.alert('Success', res.msg);
    } catch (err: any) {
      Alert.alert('Error', err.response?.data?.msg || 'Failed to place bid');
    } finally {
      setPlacingBid(false);
    }
  };

  const handleMarkAsSold = async () => {
    try {
      const res = await markListingAsSoldAPI(id, !listing.isSold);
      setListing(res.listing);
      Alert.alert('Success', res.msg);
    } catch (err) {
      console.error('Failed to mark as sold:', err);
    }
  };

  const handleDelete = () => {
    Alert.alert('Delete Listing', 'Are you sure you want to delete this listing?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteListingAPI(id);
            navigation.goBack();
          } catch (err) {
            console.error('Failed to delete:', err);
          }
        },
      },
    ]);
  };

  const handleMessageSeller = () => {
    if (!listing?.user) return;

    console.log('Navigate to Chat with:', {
      userId: listing.user._id,
      username: listing.user.username,
      avatar: listing.user.avatar,
    });
    navigation.navigate('Chat', {
      userId: listing.user._id,
      username: listing.user.username,
      avatar: listing.user.avatar,
    });
  };

  const handleCallSeller = () => {
    if (!listing?.user) return;
    initiateCall(listing.user._id, listing.user.username, listing.user.avatar);
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#D4F637" />
      </View>
    );
  }

  if (!listing) return null;

  const isOwner = user?._id === listing.user._id;

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}>
      {/* Image Carousel */}
      <View style={styles.carouselContainer}>
        {listing.images && listing.images.length > 0 ? (
          <Carousel
            loop={false}
            width={width}
            height={width * 0.8}
            data={listing.images}
            scrollAnimationDuration={500}
            renderItem={({ item }) => (
              <TouchableOpacity
                activeOpacity={0.9}
                onPress={() => {
                  setViewerIndex(listing.images.indexOf(item));
                  setViewerVisible(true);
                }}
                onLongPress={() => promptSaveImage(item as string)}>
                <Image source={{ uri: item as string }} style={styles.carouselImage} />
              </TouchableOpacity>
            )}
          />
        ) : (
          <View style={[styles.carouselImage, styles.center]}>
            <Ionicons name="image-outline" size={50} color="#ccc" />
          </View>
        )}
        {listing.isSold && (
          <View style={styles.soldOverlay}>
            <Text style={styles.soldOverlayText}>SOLD</Text>
          </View>
        )}
      </View>

      <View style={styles.content}>
        <Text style={[styles.price, { color: theme.colors.onSurface }]}>${listing.price}</Text>
        <Text style={[styles.name, { color: theme.colors.onSurface }]}>{listing.name}</Text>

        {(listing.listingType === 'Bid' || listing.listingType === 'Both') && (
          <View
            style={[
              styles.bidInfoContainer,
              {
                backgroundColor: theme.colors.surfaceVariant,
                borderColor: theme.colors.outlineVariant,
              },
            ]}>
            <View style={styles.bidRow}>
              <View>
                <Text style={[styles.bidLabel, { color: theme.colors.onSurfaceVariant }]}>
                  Current Bid
                </Text>
                <Text style={[styles.bidValue, { color: theme.colors.onSurface }]}>
                  ${listing.currentBid || 0}
                </Text>
              </View>
              <View
                style={[
                  styles.timerContainer,
                  { backgroundColor: theme.colors.surface, borderColor: theme.colors.error },
                ]}>
                <Ionicons name="time-outline" size={16} color={theme.colors.error} />
                <Text style={[styles.timerText, { color: theme.colors.error }]}>{timeLeft}</Text>
              </View>
            </View>

            {listing.highestBidder && (
              <Text style={styles.highestBidderText}>
                Highest bidder: @{listing.highestBidder.username}
              </Text>
            )}

            {!isOwner && !listing.isSold && timeLeft !== 'Auction Ended' && (
              <View style={styles.placeBidContainer}>
                <TextInput
                  placeholder="Enter bid amount"
                  placeholderTextColor={theme.colors.onSurfaceVariant}
                  value={bidAmount}
                  onChangeText={setBidAmount}
                  keyboardType="numeric"
                  style={[styles.bidInput, { backgroundColor: theme.colors.surface }]}
                  mode="outlined"
                  dense
                  outlineColor={theme.colors.outline}
                  activeOutlineColor={theme.colors.primary}
                  textColor={theme.colors.onSurface}
                />
                <Button
                  mode="contained"
                  onPress={handlePlaceBid}
                  loading={placingBid}
                  buttonColor={theme.colors.primary}
                  textColor={theme.colors.onPrimary}
                  style={styles.bidBtn}>
                  Bid
                </Button>
              </View>
            )}
          </View>
        )}

        <Text style={[styles.time, { color: theme.colors.onSurfaceVariant }]}>
          Listed {moment(listing.createdAt).format('MMM D, YYYY')} at{' '}
          {moment(listing.createdAt).format('h:mm A')}
        </Text>

        <Divider style={styles.divider} />

        <Text style={[styles.sectionTitle, { color: theme.colors.onSurface }]}>Description</Text>
        <Text style={[styles.description, { color: theme.colors.onSurface }]}>
          {listing.description}
        </Text>

        <Divider style={styles.divider} />

        <Text style={[styles.sectionTitle, { color: theme.colors.onSurface }]}>Location</Text>
        <Text style={[styles.address, { color: theme.colors.onSurfaceVariant }]}>
          {listing.address}
        </Text>

        <View style={[styles.mapContainer, { borderColor: theme.colors.outlineVariant }]}>
          {listing.location?.coordinates ? (
            <LeafletMap
              latitude={listing.location.coordinates[1]}
              longitude={listing.location.coordinates[0]}
            />
          ) : (
            <View
              style={[
                styles.map,
                styles.mapPlaceholder,
                { backgroundColor: theme.colors.surfaceVariant },
              ]}>
              <Ionicons name="map-outline" size={30} color={theme.colors.onSurfaceVariant} />
              <Text style={[styles.mapPlaceholderText, { color: theme.colors.onSurfaceVariant }]}>
                Location not available
              </Text>
            </View>
          )}
        </View>

        <Divider style={styles.divider} />

        <Text style={[styles.sectionTitle, { color: theme.colors.onSurface }]}>
          Seller Information
        </Text>
        <TouchableOpacity
          style={styles.sellerRow}
          onPress={() =>
            listing.user?._id && navigation.navigate('Profile', { id: listing.user._id })
          }>
          <Avatar.Image
            size={50}
            source={{ uri: listing.user?.avatar || 'https://via.placeholder.com/50' }}
          />
          <View style={styles.sellerInfo}>
            <Text style={[styles.sellerName, { color: theme.colors.onSurface }]}>
              {listing.user?.fullname || listing.user?.username || 'Unknown Seller'}
            </Text>
            <Text style={[styles.joinedTime, { color: theme.colors.onSurfaceVariant }]}>
              Seller on Marketplace
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={theme.colors.onSurfaceVariant} />
        </TouchableOpacity>

        <View style={styles.contactActions}>
          {!isOwner ? (
            <>
              <Button
                mode="contained"
                onPress={handleMessageSeller}
                style={styles.actionBtn}
                icon="message-outline"
                buttonColor={theme.colors.primary}
                textColor={theme.colors.onPrimary}>
                Message
              </Button>
              <Button
                mode="outlined"
                onPress={handleCallSeller}
                style={[styles.actionBtn, { borderColor: theme.colors.primary }]}
                icon="phone-outline"
                textColor={theme.colors.primary}>
                Call
              </Button>
            </>
          ) : (
            <>
              <Button
                mode="contained"
                onPress={handleMarkAsSold}
                style={styles.actionBtn}
                buttonColor={listing.isSold ? theme.colors.surfaceVariant : theme.colors.primary}
                textColor={listing.isSold ? theme.colors.onSurfaceVariant : theme.colors.onPrimary}>
                {listing.isSold ? 'Mark as Available' : 'Mark as Sold'}
              </Button>
              <Button
                mode="outlined"
                onPress={() => navigation.navigate('CreateListing', { editListing: listing })}
                style={[styles.actionBtn, { borderColor: theme.colors.primary }]}
                textColor={theme.colors.primary}>
                Edit
              </Button>
              <Button mode="text" onPress={handleDelete} style={styles.deleteBtn} textColor="red">
                Delete
              </Button>
            </>
          )}
        </View>
      </View>

      <ImageView
        images={listing.images ? listing.images.map((img: string) => ({ uri: img })) : []}
        imageIndex={viewerIndex}
        visible={viewerVisible}
        onRequestClose={() => setViewerVisible(false)}
        swipeToCloseEnabled={true}
        doubleTapToZoomEnabled={true}
      />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  carouselContainer: {
    height: width * 0.8,
    backgroundColor: '#f0f0f0',
  },
  carouselImage: {
    width: width,
    height: width * 0.8,
    resizeMode: 'contain',
  },
  soldOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  soldOverlayText: {
    color: '#fff',
    fontSize: 40,
    fontWeight: 'bold',
    borderWidth: 4,
    borderColor: '#fff',
    paddingHorizontal: 20,
    paddingVertical: 10,
    transform: [{ rotate: '-15deg' }],
  },
  content: {
    padding: 20,
  },
  price: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000',
  },
  name: {
    fontSize: 20,
    color: '#333',
    marginTop: 5,
  },
  time: {
    fontSize: 12,
    color: '#888',
    marginTop: 5,
  },
  divider: {
    marginVertical: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
  },
  description: {
    fontSize: 16,
    color: '#555',
    lineHeight: 24,
  },
  address: {
    fontSize: 14,
    color: '#666',
    marginBottom: 10,
  },
  mapContainer: {
    height: 200,
    borderRadius: 10,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#eee',
  },
  map: {
    flex: 1,
  },
  sellerRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sellerInfo: {
    flex: 1,
    marginLeft: 15,
  },
  sellerName: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  joinedTime: {
    fontSize: 12,
    color: '#888',
  },
  contactActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 30,
    gap: 10,
    paddingBottom: 40,
  },
  actionBtn: {
    flex: 1,
    minWidth: '45%',
    borderRadius: 25,
  },
  deleteBtn: {
    width: '100%',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  mapPlaceholder: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  mapPlaceholderText: {
    marginTop: 10,
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
  coordinates: {
    marginTop: 5,
    fontSize: 10,
    color: '#999',
  },
  bidInfoContainer: {
    backgroundColor: '#f8f9fa',
    padding: 15,
    borderRadius: 10,
    marginVertical: 15,
    borderWidth: 1,
    borderColor: '#eee',
  },
  bidRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  bidLabel: {
    fontSize: 14,
    color: '#666',
  },
  bidValue: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#000',
  },
  timerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: '#ffeaea',
  },
  timerText: {
    fontSize: 14,
    color: '#ff4757',
    fontWeight: 'bold',
    marginLeft: 5,
  },
  highestBidderText: {
    fontSize: 12,
    color: '#2ecc71',
    marginTop: 5,
    fontStyle: 'italic',
  },
  placeBidContainer: {
    flexDirection: 'row',
    marginTop: 15,
    gap: 10,
  },
  bidInput: {
    flex: 1,
    backgroundColor: '#fff',
  },
  bidBtn: {
    justifyContent: 'center',
    borderRadius: 5,
  },
});

export default ListingDetailScreen;
