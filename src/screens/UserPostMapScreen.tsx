import React, { useState, useEffect, useContext, useCallback, useRef, useMemo } from 'react';
import {
  View,
  StyleSheet,
  ActivityIndicator,
  StatusBar,
  Dimensions,
  TouchableOpacity,
  Image,
} from 'react-native';
import { WebView } from 'react-native-webview';
import * as ExpoLocation from 'expo-location';
import { Text, IconButton } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { AuthContext } from '../auth/AuthContext';
import { getSharedLocationsAPI } from '../api/locationAPI';
import { getRobustLocation } from '../utils/locationHelper';
import BottomSheet, { BottomSheetScrollView, BottomSheetBackdrop } from '@gorhom/bottom-sheet';

import moment from 'moment';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

const getMapHtml = (lat: number, lon: number, zoom: number) => `
<!DOCTYPE html>
<html>
  <head>
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
    <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
    <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
    <style>
      body { margin: 0; padding: 0; overflow: hidden; }
      #map { height: 100vh; width: 100vw; background: #f0f0f0; }
      .marker-pin {
        width: 44px; height: 44px;
        border-radius: 50% 50% 50% 0;
        background: #D4F637; /* Default/Live */
        position: absolute;
        transform: rotate(-45deg);
        left: 50%; top: 50%;
        margin: -22px 0 0 -22px;
        border: 2px solid #fff;
        box-shadow: 0 4px 8px rgba(0,0,0,0.3);
      }
      .marker-pin.post { background: #FF9800; }
      .marker-pin.static { background: #00A8FF; }
      .marker-dot {
        width: 12px;
        height: 12px;
        border-radius: 50%;
        background: #000;
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%) rotate(45deg);
      }
      .label {
        position: absolute;
        bottom: -25px;
        left: 50%;
        transform: translateX(-50%) rotate(45deg);
        background: rgba(0,0,0,0.7);
        color: white;
        padding: 2px 6px;
        border-radius: 4px;
        font-family: sans-serif;
        font-size: 10px;
        white-space: nowrap;
        font-weight: bold;
      }
    </style>
  </head>
  <body>
    <div id="map"></div>
    <script>
      var map = L.map('map', { zoomControl: false, attributionControl: false }).setView([${lat}, ${lon}], ${zoom});
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { attribution: '© OpenStreetMap' }).addTo(map);
      var markersLayer = L.layerGroup().addTo(map);
      var markersMap = {};

      function updateMarkers(data) {
        try {
          if (!data || !Array.isArray(data)) return;
          var newMarkersMap = {};
          var dataIds = data.map(m => m.id);
          Object.keys(markersMap).forEach(id => {
            if (!dataIds.includes(id)) { markersLayer.removeLayer(markersMap[id]); delete markersMap[id]; }
          });

          data.forEach(m => {
            if (!m.lat || !m.lon) return;
            if (markersMap[m.id]) { var existing = markersMap[m.id]; markersLayer.removeLayer(existing); }
            
            var pinClass = m.type === "post" ? "post" : (m.type === "static" ? "static" : "");
            
            var icon = L.divIcon({
              className: 'custom-div-icon',
              html: '<div class="marker-pin ' + pinClass + '">' +
                      '<div class="marker-dot"></div>' +
                      '<div class="label">' + (m.username || 'User') + '</div>' +
                    '</div>',
              iconSize: [44, 44],
              iconAnchor: [22, 44]
            });
            var marker = L.marker([m.lat, m.lon], { icon: icon }).addTo(markersLayer);
            marker.on('click', function() {
              window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'marker-click', userData: m }));
            });
            newMarkersMap[m.id] = marker;
          });
          markersMap = newMarkersMap;
        } catch (e) { console.error("Leaflet update error:", e); }
      }
      window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'ready' }));
    </script>
  </body>
</html>
`;

const UserPostMapScreen = () => {
  const { user: currentUser } = useContext(AuthContext);
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const webViewRef = useRef<WebView>(null);
  const bottomSheetRef = useRef<BottomSheet>(null);

  const [deviceLocation, setDeviceLocation] = useState<ExpoLocation.LocationObject | null>(null);
  const [sharedLocations, setSharedLocations] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [targetUserId] = useState<string>(route.params?.targetUserId);
  const [timePeriod, setTimePeriod] = useState<string>('all');
  const [selectedUser, setSelectedUser] = useState<any>(null);

  const fetchLocations = useCallback(async () => {
    if (!targetUserId) return;
    setLoading(true);
    try {
      // Fixed radius to 20000 (All) for history view
      const data = await getSharedLocationsAPI(0, 0, 20000, targetUserId, timePeriod);
      if (Array.isArray(data)) setSharedLocations(data);
    } catch (err) {
      console.error('Error fetching user post locations:', err);
    } finally {
      setLoading(false);
    }
  }, [targetUserId, timePeriod]);

  useEffect(() => {
    (async () => {
      // Fetch locations immediately, don't wait for GPS
      fetchLocations();

      // Attempt to get location in parallel for UI purposes
      try {
        let { status } = await ExpoLocation.getForegroundPermissionsAsync();
        if (status !== 'granted') {
          const result = await ExpoLocation.requestForegroundPermissionsAsync();
          status = result.status;
        }

        if (status === 'granted') {
          const loc = await getRobustLocation();
          if (loc) {
            setDeviceLocation(loc);
          } else {
            console.warn('[UserPostMapScreen] Robust location fetch returned null');
            // We don't always want to alert here because the markers might still load fine
          }
        }
      } catch (e) {
        console.log('Location check failed, but data should be loading:', e);
      }
    })();
  }, [fetchLocations]);

  const updateMarkers = useCallback(() => {
    if (!webViewRef.current) return;
    const markersData = sharedLocations.map((loc) => ({
      id: loc._id,
      lat: loc.latitude,
      lon: loc.longitude,
      username: loc.user?.username || 'User',
      avatar: loc.user?.avatar,
      address: loc.address,
      type: loc.type || 'post', // Default to post if undefined, but backend sends 'post' or 'live'
      postData: loc.postData,
    }));
    webViewRef.current.injectJavaScript(`updateMarkers(${JSON.stringify(markersData)})`);

    // Auto-fit bounds if we have markers
    if (markersData.length > 0) {
      const bounds = markersData.map((m) => [m.lat, m.lon]);
      webViewRef.current.injectJavaScript(
        `map.fitBounds(${JSON.stringify(bounds)}, {padding: [50, 50]});`
      );
    }
  }, [sharedLocations]);

  useEffect(() => {
    updateMarkers();
  }, [updateMarkers]);

  const onMessage = (event: any) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      if (data.type === 'ready') updateMarkers();
      if (data.type === 'marker-click') {
        setSelectedUser(data.userData);
        bottomSheetRef.current?.snapToIndex(0);
      }
    } catch (e) {}
  };

  const renderBackdrop = useCallback(
    (props: any) => (
      <BottomSheetBackdrop {...props} disappearsOnIndex={-1} appearsOnIndex={0} opacity={0.5} />
    ),
    []
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <WebView
        ref={webViewRef}
        originWhitelist={['*']}
        source={{ html: getMapHtml(0, 0, 2) }}
        style={styles.map}
        onMessage={onMessage}
      />

      <View style={styles.topControls}>
        <IconButton
          icon="chevron-left"
          size={24}
          mode="contained"
          containerColor="#fff"
          iconColor="#000"
          onPress={() => navigation.goBack()}
        />
        <View style={styles.timePeriodContainer}>
          {['day', 'month', 'year', 'all'].map((p) => (
            <TouchableOpacity
              key={p}
              onPress={() => setTimePeriod(p)}
              style={[styles.periodButton, timePeriod === p && styles.activePeriodButton]}>
              <Text
                style={[
                  styles.periodText,
                  timePeriod === p && { color: '#000', fontWeight: 'bold' },
                ]}>
                {p.charAt(0).toUpperCase() + p.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {loading && (
        <View style={styles.loader}>
          <ActivityIndicator size="large" color="#D4F637" />
        </View>
      )}

      <BottomSheet
        ref={bottomSheetRef}
        index={-1}
        snapPoints={['40%']}
        enablePanDownToClose
        backdropComponent={renderBackdrop}>
        <BottomSheetScrollView contentContainerStyle={styles.sheetContent}>
          {selectedUser && (
            <View>
              <View style={styles.userHeader}>
                <Image
                  source={{ uri: selectedUser.avatar || 'https://via.placeholder.com/50' }}
                  style={styles.avatar}
                />
                <View style={styles.userInfo}>
                  <Text style={styles.fullname}>{selectedUser.username}</Text>
                  <Text style={styles.postTime}>
                    {selectedUser.postData
                      ? selectedUser.postData.createdAt
                        ? moment(selectedUser.postData.createdAt).fromNow()
                        : 'Historical Post'
                      : 'Live Location'}
                  </Text>
                </View>
              </View>
              {selectedUser.postData ? (
                <>
                  {selectedUser.postData.image && (
                    <Image source={{ uri: selectedUser.postData.image }} style={styles.postImage} />
                  )}
                  {selectedUser.address && (
                    <View style={styles.locationRow}>
                      <Ionicons name="location-sharp" size={16} color="#666" />
                      <Text style={styles.locationText}>{selectedUser.address}</Text>
                    </View>
                  )}
                  <Text style={styles.postText}>{selectedUser.postData.content}</Text>
                  <View style={styles.statsRow}>
                    <View style={styles.statItem}>
                      <Ionicons name="heart-outline" size={18} color="#666" />
                      <Text style={styles.statText}>{selectedUser.postData.likes || 0} Likes</Text>
                    </View>
                    <View style={styles.statItem}>
                      <Ionicons name="chatbubble-outline" size={18} color="#666" />
                      <Text style={styles.statText}>
                        {selectedUser.postData.comments || 0} Comments
                      </Text>
                    </View>
                  </View>
                  <TouchableOpacity
                    style={styles.viewPostBtn}
                    onPress={() => {
                      if (selectedUser.postData && selectedUser.postData.id) {
                        navigation.navigate('PostDetail', { postId: selectedUser.postData.id });
                      }
                    }}>
                    <Text style={styles.viewPostText}>View Full Post</Text>
                  </TouchableOpacity>
                </>
              ) : (
                <Text style={styles.postText}>Current active location</Text>
              )}
            </View>
          )}
        </BottomSheetScrollView>
      </BottomSheet>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  map: { flex: 1 },
  topControls: {
    position: 'absolute',
    top: 50,
    left: 20,
    right: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  timePeriodContainer: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: 'rgba(0,0,0,0.8)',
    borderRadius: 25,
    padding: 4,
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  periodButton: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  activePeriodButton: { backgroundColor: '#D4F637' },
  periodText: { color: '#fff', fontSize: 13 },
  loader: {
    position: 'absolute',
    top: 120,
    alignSelf: 'center',
    backgroundColor: 'rgba(255,255,255,0.8)',
    borderRadius: 20,
    padding: 10,
  },
  sheetContent: { padding: 20 },
  userHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 15 },
  avatar: { width: 50, height: 50, borderRadius: 25, marginRight: 15 },
  userInfo: { flex: 1 },
  fullname: { fontSize: 18, fontWeight: 'bold' },
  postTime: { color: '#666', fontSize: 12 },
  postImage: { width: '100%', height: 200, borderRadius: 12, marginBottom: 10 },
  postText: { fontSize: 14, color: '#333' },
  locationRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8, marginTop: 4 },
  locationText: { fontSize: 13, color: '#666', marginLeft: 4, flex: 1 },
  statsRow: {
    flexDirection: 'row',
    marginTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#eee',
    paddingTop: 12,
  },
  statItem: { flexDirection: 'row', alignItems: 'center', marginRight: 20 },
  statText: { fontSize: 13, color: '#666', marginLeft: 6 },
  viewPostBtn: {
    backgroundColor: '#000',
    marginTop: 15,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  viewPostText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
});

export default UserPostMapScreen;
