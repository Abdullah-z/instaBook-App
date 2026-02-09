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
import { promptSaveImage, downloadAndSaveImage } from '../utils/MediaUtils';
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
      {/* Back Button */}
      <View style={styles.backButtonContainer}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={[styles.iconButton, { backgroundColor: 'rgba(255,255,255,0.9)' }]}>
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        {isOwner && (
          <View style={styles.ownerActions}>
            <TouchableOpacity
              onPress={() => navigation.navigate('CreateListing', { editListing: listing })}
              style={[styles.iconButton, { backgroundColor: 'rgba(255,255,255,0.9)' }]}>
              <Ionicons name="create-outline" size={24} color="#000" />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleDelete}
              style={[styles.iconButton, { backgroundColor: 'rgba(255,255,255,0.9)' }]}>
              <Ionicons name="trash-outline" size={24} color="red" />
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Image Carousel */}
      <View style={styles.carouselContainer}>
        {listing.images && listing.images.length > 0 ? (
          <Carousel
            loop={false}
            width={width}
            height={width * 0.9}
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

      <View
        style={[
          styles.content,
          {
            borderTopLeftRadius: 32,
            borderTopRightRadius: 32,
            marginTop: -32,
            backgroundColor: theme.colors.background,
          },
        ]}>
        <View style={styles.headerRow}>
          <View style={{ flex: 1 }}>
            <Text
              style={[
                styles.name,
                {
                  color: theme.colors.onSurface,
                  fontWeight: '900',
                  fontSize: 28,
                  letterSpacing: -1,
                },
              ]}>
              {listing.name}
            </Text>
            <View style={styles.locationContainer}>
              <Ionicons name="location" size={16} color={theme.colors.primary} />
              <Text
                style={[
                  styles.address,
                  { color: theme.colors.onSurfaceVariant, fontWeight: '600' },
                ]}>
                {listing.address}
              </Text>
            </View>
          </View>
          <View style={[styles.priceBadge, { backgroundColor: theme.colors.primaryContainer }]}>
            <Text
              style={[
                styles.priceText,
                { color: theme.colors.onPrimaryContainer, fontWeight: '900', fontSize: 24 },
              ]}>
              ${listing.price}
            </Text>
          </View>
        </View>

        <View style={styles.infoRow}>
          <View style={styles.infoItem}>
            <Text style={[styles.infoLabel, { color: theme.colors.onSurfaceVariant }]}>
              CONDITION
            </Text>
            <Text style={[styles.infoValue, { color: theme.colors.onSurface }]}>New</Text>
          </View>
          <View style={styles.infoItem}>
            <Text style={[styles.infoLabel, { color: theme.colors.onSurfaceVariant }]}>
              CATEGORY
            </Text>
            <Text style={[styles.infoValue, { color: theme.colors.onSurface }]}>
              {listing.category}
            </Text>
          </View>
          <View style={styles.infoItem}>
            <Text style={[styles.infoLabel, { color: theme.colors.onSurfaceVariant }]}>POSTED</Text>
            <Text style={[styles.infoValue, { color: theme.colors.onSurface }]}>
              {moment(listing.createdAt).fromNow()}
            </Text>
          </View>
        </View>

        {(listing.listingType === 'Bid' || listing.listingType === 'Both') && (
          <View
            style={[
              styles.bidInfoContainer,
              {
                backgroundColor: theme.colors.surfaceVariant,
                borderRadius: 32,
                padding: 24,
                elevation: 4,
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.1,
                shadowRadius: 12,
              },
            ]}>
            <View style={styles.bidHeader}>
              <View>
                <Text
                  style={[
                    styles.bidLabel,
                    { color: theme.colors.onSurfaceVariant, fontWeight: '800', letterSpacing: 1 },
                  ]}>
                  CURRENT BID
                </Text>
                <Text
                  style={[
                    styles.bidValue,
                    { color: theme.colors.primary, fontSize: 36, fontWeight: '900' },
                  ]}>
                  ${listing.currentBid || 0}
                </Text>
              </View>
              <View
                style={[
                  styles.timerContainer,
                  {
                    backgroundColor: theme.colors.surface,
                    borderRadius: 16,
                    paddingHorizontal: 16,
                    paddingVertical: 10,
                    borderWidth: 2,
                    borderColor: theme.colors.error,
                  },
                ]}>
                <Ionicons name="time" size={20} color={theme.colors.error} />
                <Text
                  style={[
                    styles.timerText,
                    { color: theme.colors.error, fontSize: 16, fontWeight: '800' },
                  ]}>
                  {timeLeft}
                </Text>
              </View>
            </View>

            {listing.highestBidder && (
              <View style={styles.highestBidderRow}>
                <Ionicons name="checkmark-circle" size={16} color="#4CAF50" />
                <Text style={[styles.highestBidderText, { color: '#4CAF50', fontWeight: '700' }]}>
                  Highest bidder: @{listing.highestBidder.username}
                </Text>
              </View>
            )}

            {!isOwner && !listing.isSold && timeLeft !== 'Auction Ended' && (
              <View style={styles.placeBidContainer}>
                <TextInput
                  placeholder="0.00"
                  value={bidAmount}
                  onChangeText={setBidAmount}
                  keyboardType="numeric"
                  style={[
                    styles.bidInput,
                    { backgroundColor: theme.colors.surface, borderRadius: 16 },
                  ]}
                  mode="outlined"
                  outlineStyle={{ borderRadius: 16, borderWidth: 2 }}
                  outlineColor={theme.colors.outlineVariant}
                  activeOutlineColor={theme.colors.primary}
                  left={<TextInput.Affix text="$" />}
                />
                <Button
                  mode="contained"
                  onPress={handlePlaceBid}
                  loading={placingBid}
                  buttonColor={theme.colors.primary}
                  textColor={theme.colors.onPrimary}
                  labelStyle={{ fontWeight: '900', fontSize: 16 }}
                  style={[styles.bidBtn, { height: 54, borderRadius: 16 }]}>
                  Place Bid
                </Button>
              </View>
            )}
          </View>
        )}

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={[styles.sectionDot, { backgroundColor: theme.colors.primary }]} />
            <Text
              style={[styles.sectionTitle, { color: theme.colors.onSurface, fontWeight: '900' }]}>
              Description
            </Text>
          </View>
          <Text
            style={[
              styles.description,
              { color: theme.colors.onSurface, lineHeight: 22, fontWeight: '500' },
            ]}>
            {listing.description}
          </Text>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={[styles.sectionDot, { backgroundColor: theme.colors.primary }]} />
            <Text
              style={[styles.sectionTitle, { color: theme.colors.onSurface, fontWeight: '900' }]}>
              Location
            </Text>
          </View>
          <View
            style={[
              styles.mapWrapper,
              {
                borderRadius: 24,
                overflow: 'hidden',
                borderWidth: 1,
                borderColor: theme.colors.outlineVariant,
              },
            ]}>
            <View style={{ height: 200 }}>
              {listing.location?.coordinates ? (
                <LeafletMap
                  latitude={listing.location.coordinates[1]}
                  longitude={listing.location.coordinates[0]}
                />
              ) : (
                <View
                  style={[styles.mapPlaceholder, { backgroundColor: theme.colors.surfaceVariant }]}>
                  <Ionicons name="map-outline" size={30} color={theme.colors.onSurfaceVariant} />
                  <Text style={{ color: theme.colors.onSurfaceVariant, fontWeight: '600' }}>
                    Location not available
                  </Text>
                </View>
              )}
            </View>
            <TouchableOpacity
              onPress={() =>
                Linking.openURL(
                  `https://www.google.com/maps/search/?api=1&query=${listing.location.coordinates[1]},${listing.location.coordinates[0]}`
                )
              }
              style={styles.mapOverlayButton}>
              <Ionicons name="open-outline" size={14} color="#000" />
              <Text style={styles.mapOverlayText}>OPEN IN MAPS</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.section}>
          <Text
            style={[
              styles.sectionTitle,
              { color: theme.colors.onSurface, fontWeight: '900', marginBottom: 16 },
            ]}>
            Seller Information
          </Text>
          <TouchableOpacity
            activeOpacity={0.8}
            style={[
              styles.sellerCard,
              { backgroundColor: theme.colors.surfaceVariant, borderRadius: 24, padding: 16 },
            ]}
            onPress={() =>
              listing.user?._id && navigation.navigate('Profile', { id: listing.user._id })
            }>
            <Avatar.Image
              size={60}
              source={{ uri: listing.user?.avatar || 'https://via.placeholder.com/60' }}
            />
            <View style={styles.sellerInfo}>
              <Text
                style={[
                  styles.sellerName,
                  { color: theme.colors.onSurface, fontWeight: '900', fontSize: 18 },
                ]}>
                {listing.user?.fullname || listing.user?.username || 'Unknown Seller'}
              </Text>
              <Text
                style={[
                  styles.joinedTime,
                  { color: theme.colors.onSurfaceVariant, fontWeight: '600' },
                ]}>
                Community Member
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={24} color={theme.colors.onSurfaceVariant} />
          </TouchableOpacity>
        </View>

        <View style={styles.contactActions}>
          {!isOwner ? (
            <View style={styles.actionRow}>
              <Button
                mode="contained"
                onPress={handleMessageSeller}
                style={[styles.mainActionBtn, { flex: 3, borderRadius: 20, height: 56 }]}
                labelStyle={{ fontWeight: '900', fontSize: 16 }}
                icon="message"
                buttonColor={theme.colors.primary}
                textColor={theme.colors.onPrimary}>
                Message Seller
              </Button>
              <TouchableOpacity
                onPress={handleCallSeller}
                style={[
                  styles.callBtn,
                  {
                    backgroundColor: theme.colors.surfaceVariant,
                    borderRadius: 20,
                    height: 56,
                    width: 56,
                  },
                ]}>
                <Ionicons name="call" size={24} color={theme.colors.primary} />
              </TouchableOpacity>
            </View>
          ) : (
            <Button
              mode="contained"
              onPress={handleMarkAsSold}
              style={[styles.mainActionBtn, { borderRadius: 20, height: 56 }]}
              labelStyle={{ fontWeight: '900', fontSize: 16 }}
              buttonColor={listing.isSold ? theme.colors.surfaceVariant : theme.colors.primary}
              textColor={listing.isSold ? theme.colors.onSurfaceVariant : theme.colors.onPrimary}>
              {listing.isSold ? 'Mark as Available' : 'Mark as Sold'}
            </Button>
          )}
        </View>

        <View
          style={[
            styles.safetyTip,
            {
              backgroundColor: theme.colors.secondaryContainer,
              borderColor: theme.colors.outlineVariant,
              borderWidth: 1,
            },
          ]}>
          <Ionicons name="shield-checkmark" size={24} color={theme.colors.onSecondaryContainer} />
          <View style={{ flex: 1, marginLeft: 12 }}>
            <Text
              style={{
                fontWeight: '900',
                color: theme.colors.onSecondaryContainer,
                fontSize: 14,
              }}>
              Safety & Fair Trade
            </Text>
            <Text
              style={{
                fontSize: 12,
                color: theme.colors.onSecondaryContainer,
                lineHeight: 16,
                fontWeight: '500',
                opacity: 0.8,
              }}>
              Meet in public places. Inspect items before payment. For auctions, bids are binding.
            </Text>
          </View>
        </View>
      </View>

      <ImageView
        images={listing.images ? listing.images.map((img: string) => ({ uri: img })) : []}
        imageIndex={viewerIndex}
        visible={viewerVisible}
        onRequestClose={() => setViewerVisible(false)}
        swipeToCloseEnabled={true}
        doubleTapToZoomEnabled={true}
        HeaderComponent={({ imageIndex }) => (
          <View style={styles.viewerHeader}>
            <TouchableOpacity
              onPress={() =>
                listing.images[imageIndex] && downloadAndSaveImage(listing.images[imageIndex])
              }
              style={styles.viewerIconBtn}>
              <Ionicons name="download-outline" size={24} color="#fff" />
            </TouchableOpacity>
          </View>
        )}
      />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  backButtonContainer: {
    position: 'absolute',
    top: 50,
    left: 20,
    right: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    zIndex: 100,
  },
  ownerActions: {
    flexDirection: 'row',
    gap: 10,
  },
  iconButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  carouselContainer: {
    height: width * 0.9,
    backgroundColor: '#f0f0f0',
  },
  carouselImage: {
    width: width,
    height: width * 0.9,
    resizeMode: 'cover',
  },
  soldOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  soldOverlayText: {
    color: '#fff',
    fontSize: 50,
    fontWeight: '900',
    borderWidth: 6,
    borderColor: '#fff',
    paddingHorizontal: 20,
    paddingVertical: 10,
    transform: [{ rotate: '-15deg' }],
  },
  content: {
    padding: 24,
    paddingTop: 32,
    elevation: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    gap: 4,
  },
  name: {
    fontSize: 28,
  },
  address: {
    fontSize: 14,
  },
  priceBadge: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
  },
  priceText: {
    fontSize: 24,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
    padding: 16,
    backgroundColor: 'rgba(0,0,0,0.02)',
    borderRadius: 20,
  },
  infoItem: {
    alignItems: 'center',
  },
  infoLabel: {
    fontSize: 10,
    fontWeight: '800',
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '700',
  },
  bidInfoContainer: {
    marginVertical: 10,
  },
  bidHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  bidLabel: {
    fontSize: 12,
  },
  bidValue: {
    fontSize: 36,
  },
  timerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  timerText: {
    fontSize: 16,
  },
  highestBidderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 20,
    backgroundColor: 'rgba(76, 175, 80, 0.1)',
    padding: 8,
    borderRadius: 10,
  },
  highestBidderText: {
    fontSize: 13,
  },
  placeBidContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  bidInput: {
    flex: 1,
    height: 54,
  },
  bidBtn: {
    minWidth: 120,
    justifyContent: 'center',
  },
  section: {
    marginTop: 32,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 12,
  },
  sectionDot: {
    width: 6,
    height: 18,
    borderRadius: 3,
  },
  sectionTitle: {
    fontSize: 20,
  },
  description: {
    fontSize: 15,
  },
  mapWrapper: {
    position: 'relative',
  },
  mapOverlayButton: {
    position: 'absolute',
    bottom: 12,
    right: 12,
    left: 12,
    backgroundColor: 'rgba(255,255,255,0.95)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderRadius: 12,
    gap: 6,
    elevation: 4,
  },
  mapOverlayText: {
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1,
  },
  sellerCard: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sellerInfo: {
    flex: 1,
    marginLeft: 16,
  },
  sellerName: {
    fontSize: 16,
  },
  joinedTime: {
    fontSize: 12,
  },
  contactActions: {
    marginTop: 40,
    marginBottom: 20,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 12,
  },
  mainActionBtn: {
    justifyContent: 'center',
  },
  callBtn: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  safetyTip: {
    flexDirection: 'row',
    padding: 16,
    borderRadius: 20,
    borderWidth: 1,
    marginTop: 10,
    marginBottom: 40,
  },
  viewerHeader: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    padding: 20,
    paddingTop: 50,
  },
  viewerIconBtn: {
    backgroundColor: 'rgba(0,0,0,0.5)',
    padding: 10,
    borderRadius: 25,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  mapPlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default ListingDetailScreen;
