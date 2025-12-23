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
} from 'react-native';
import { Text, Button, Avatar, Divider, List } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import { useRoute, useNavigation } from '@react-navigation/native';
import { getListingAPI, markListingAsSoldAPI, deleteListingAPI } from '../api/listingAPI';
import { AuthContext } from '../auth/AuthContext';
import { VoiceCallContext } from '../auth/VoiceCallContext';
import Carousel from 'react-native-reanimated-carousel';
import LeafletMap from '../components/LeafletMap';
import Constants from 'expo-constants';

const isExpoGo = Constants.appOwnership === 'expo';

const { width } = Dimensions.get('window');

const ListingDetailScreen = () => {
  const route = useRoute<any>();
  const navigation = useNavigation<any>();
  const { id } = route.params || {};
  const { user } = useContext(AuthContext);
  const { initiateCall } = useContext(VoiceCallContext);

  const [listing, setListing] = useState<any>(null);
  const [loading, setLoading] = useState(true);

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
    } catch (err) {
      console.error('Failed to load listing:', err);
      Alert.alert('Error', 'Could not load listing details.');
    } finally {
      setLoading(false);
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
    <ScrollView style={styles.container}>
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
              <Image source={{ uri: item as string }} style={styles.carouselImage} />
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
        <Text style={styles.price}>${listing.price}</Text>
        <Text style={styles.name}>{listing.name}</Text>
        <Text style={styles.time}>Listed {new Date(listing.createdAt).toLocaleDateString()}</Text>

        <Divider style={styles.divider} />

        <Text style={styles.sectionTitle}>Description</Text>
        <Text style={styles.description}>{listing.description}</Text>

        <Divider style={styles.divider} />

        <Text style={styles.sectionTitle}>Location</Text>
        <Text style={styles.address}>{listing.address}</Text>

        <View style={styles.mapContainer}>
          {listing.location?.coordinates ? (
            <LeafletMap
              latitude={listing.location.coordinates[1]}
              longitude={listing.location.coordinates[0]}
            />
          ) : (
            <View style={[styles.map, styles.mapPlaceholder]}>
              <Ionicons name="map-outline" size={30} color="#ccc" />
              <Text style={styles.mapPlaceholderText}>Location not available</Text>
            </View>
          )}
        </View>

        <Divider style={styles.divider} />

        <Text style={styles.sectionTitle}>Seller Information</Text>
        <TouchableOpacity
          style={styles.sellerRow}
          onPress={() =>
            listing.user?._id && navigation.navigate('Profile', { userId: listing.user._id })
          }>
          <Avatar.Image
            size={50}
            source={{ uri: listing.user?.avatar || 'https://via.placeholder.com/50' }}
          />
          <View style={styles.sellerInfo}>
            <Text style={styles.sellerName}>
              {listing.user?.fullname || listing.user?.username || 'Unknown Seller'}
            </Text>
            <Text style={styles.joinedTime}>Seller on Marketplace</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#888" />
        </TouchableOpacity>

        <View style={styles.contactActions}>
          {!isOwner ? (
            <>
              <Button
                mode="contained"
                onPress={handleMessageSeller}
                style={styles.actionBtn}
                icon="message-outline"
                buttonColor="#000">
                Message
              </Button>
              <Button
                mode="outlined"
                onPress={handleCallSeller}
                style={styles.actionBtn}
                icon="phone-outline"
                textColor="#000">
                Call
              </Button>
            </>
          ) : (
            <>
              <Button
                mode="contained"
                onPress={handleMarkAsSold}
                style={styles.actionBtn}
                buttonColor={listing.isSold ? '#ddd' : '#D4F637'}
                textColor="#000">
                {listing.isSold ? 'Mark as Available' : 'Mark as Sold'}
              </Button>
              <Button
                mode="outlined"
                onPress={() => navigation.navigate('CreateListing', { editListing: listing })}
                style={styles.actionBtn}
                textColor="#000">
                Edit
              </Button>
              <Button mode="text" onPress={handleDelete} style={styles.deleteBtn} textColor="red">
                Delete
              </Button>
            </>
          )}
        </View>
      </View>
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
});

export default ListingDetailScreen;
