import { Image } from 'expo-image';
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { useTheme } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown } from 'react-native-reanimated';
import moment from 'moment';

const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - 40) / 2;

interface ListingCardProps {
  item: any;
  index: number;
  onPress: (id: string) => void;
  isOwnerView?: boolean;
  onEdit?: (item: any) => void;
  onDelete?: (id: string) => void;
}

const ListingCard = React.memo(
  ({ item, index, onPress, isOwnerView = false, onEdit, onDelete }: ListingCardProps) => {
    const theme = useTheme();

    return (
      <Animated.View
        entering={FadeInDown.delay(index * 50)
          .duration(400)
          .springify()}
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
        ]}>
        <TouchableOpacity activeOpacity={0.9} onPress={() => onPress(item._id)}>
          <View style={styles.imageContainer}>
            <Image
              source={{ uri: item.images?.[0] || 'https://via.placeholder.com/150' }}
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

            {isOwnerView ? (
              <View style={styles.ownerFooter}>
                <View
                  style={[
                    styles.statusBadge,
                    { backgroundColor: item.isSold ? theme.colors.error : theme.colors.primary },
                  ]}>
                  <Text style={styles.statusText}>{item.isSold ? 'SOLD' : 'AVAILABLE'}</Text>
                </View>
                <View style={styles.cardActions}>
                  <TouchableOpacity onPress={() => onEdit?.(item)}>
                    <Ionicons name="create-outline" size={20} color={theme.colors.onSurface} />
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => onDelete?.(item._id)}>
                    <Ionicons name="trash-outline" size={20} color="red" />
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
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
            )}
          </View>
        </TouchableOpacity>
      </Animated.View>
    );
  }
);

const styles = StyleSheet.create({
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
  ownerFooter: {
    marginTop: 6,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.05)',
    gap: 8,
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
  statusBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
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
  },
});

export default ListingCard;
