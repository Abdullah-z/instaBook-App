import React, { useState, useEffect, useContext, useCallback, useRef, useMemo } from 'react';
import {
  View,
  StyleSheet,
  Alert,
  ActivityIndicator,
  StatusBar,
  Platform,
  Dimensions,
  TouchableOpacity,
  Image,
  Modal,
  TextInput,
  DeviceEventEmitter,
} from 'react-native';
import { WebView } from 'react-native-webview';
import * as ExpoLocation from 'expo-location';
import Constants from 'expo-constants';
import {
  Text,
  Surface,
  Avatar,
  IconButton,
  SegmentedButtons,
  Button,
  Divider,
  Menu,
  useTheme,
  Chip,
} from 'react-native-paper';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import BottomSheet, { BottomSheetScrollView, BottomSheetBackdrop } from '@gorhom/bottom-sheet';
import { AuthContext } from '../auth/AuthContext';
import {
  shareLocationAPI,
  getSharedLocationsAPI,
  stopSharingAPI,
  createShoutoutAPI,
} from '../api/locationAPI';
import { getEventsAPI } from '../api/eventAPI';
import LocationAutocomplete from '../components/LocationAutocomplete';
import { getRobustLocation, getReadableAddress } from '../utils/locationHelper';
import moment from 'moment';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

const getMapHtml = (lat: number, lon: number, zoom: number, theme: any) => {
  const isDark = theme.dark;
  const primaryColor = theme.colors.primary;
  const surfaceColor = theme.colors.surface;
  const onSurfaceColor = theme.colors.onSurface;
  const mapBg = isDark ? '#1a1b1e' : '#f0f0f0';

  return `
<!DOCTYPE html>
<html>
  <head>
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
    <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
    <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
    <link rel="stylesheet" href="https://unpkg.com/leaflet.markercluster@1.5.3/dist/MarkerCluster.css" />
    <link rel="stylesheet" href="https://unpkg.com/leaflet.markercluster@1.5.3/dist/MarkerCluster.Default.css" />
    <script src="https://unpkg.com/leaflet.markercluster@1.5.3/dist/leaflet.markercluster.js"></script>
    <style>
      body { margin: 0; padding: 0; overflow: hidden; }
      #map { height: 100vh; width: 100vw; background: $\{'${mapBg}'\}; }
      
      /* User Location Blue Dot Style */
      .blue-dot {
        width: 14px;
        height: 14px;
        background-color: #007AFF;
        border: 2px solid white;
        border-radius: 50%;
        box-shadow: 0 0 5px rgba(0,0,0,0.3);
      }
      .blue-dot-pulse {
        width: 40px;
        height: 40px;
        background-color: rgba(0, 122, 255, 0.2);
        border-radius: 50%;
        position: absolute;
        top: -13px;
        left: -13px;
        animation: pulse-dot 2s infinite;
      }
      @keyframes pulse-dot {
        0% { transform: scale(0.5); opacity: 0.8; }
        100% { transform: scale(1.5); opacity: 0; }
      }

      .marker-pin {
        width: 44px; height: 44px;
        border-radius: 50% 50% 50% 0;
        background: $\{'${primaryColor}'\};
        position: absolute;
        transform: rotate(-45deg);
        left: 50%; top: 50%;
        margin: -22px 0 0 -22px;
        border: 2px solid $\{'${surfaceColor}'\};
        box-shadow: 0 4px 8px rgba(0,0,0,0.3);
      }
      .marker-pin.static { background: #00A8FF; }
      .marker-pin.post { background: #FF9800; }
      .marker-pin.event { background: #E4405F; }
      .marker-pin.shoutout { background: linear-gradient(135deg, #FF00CC 0%, #333399 100%); border-color: $\{'${primaryColor}'\}; }
      .marker-pin.focused { background: #FF0000; }
      .marker-img {
        width: 38px;
        height: 38px;
        border-radius: 50%;
        position: absolute;
        top: 3px;
        left: 3px;
        object-fit: cover;
        transform: rotate(45deg);
        background: #eee;
      }
      .marker-dot {
        width: 12px;
        height: 12px;
        border-radius: 50%;
        background: $\{'${surfaceColor}'\};
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%) rotate(45deg);
        z-index: 2;
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
      .shoutout-label {
        position: absolute;
        top: -30px;
        left: 50%;
        transform: translateX(-50%);
        background: $\{'${primaryColor}'\};
        color: $\{'${surfaceColor}'\};
        padding: 4px 10px;
        border-radius: 20px;
        font-family: 'Comic Sans MS', cursive, sans-serif;
        font-size: 12px;
        white-space: nowrap;
        font-weight: 900;
        box-shadow: 0 4px 10px rgba(0,0,0,0.4);
        border: 2px solid $\{'${surfaceColor}'\};
      }
      $\{'${isDark ? 'canvas { filter: invert(90%) hue-rotate(180deg) brightness(0.8) contrast(1.2) !important; } .leaflet-tile-pane { filter: invert(90%) hue-rotate(180deg) brightness(0.8) contrast(1.2) !important; }' : ''}'\}
    </style>
  </head>
  <body>
    <div id="map"></div>
    <script>
      var map = L.map('map', { zoomControl: false, attributionControl: false }).setView([${lat}, ${lon}], ${zoom});
      
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap'
      }).addTo(map);

      var markersLayer = L.markerClusterGroup({
        spiderfyOnMaxZoom: true,
        showCoverageOnHover: false,
        zoomToBoundsOnClick: true,
        animate: true
      }).addTo(map);

      // User Location Blue Dot
      var blueDot = null;
      function updateUserLocation(lat, lon) {
        if (!blueDot) {
          var icon = L.divIcon({
            className: 'blue-dot-container',
            html: '<div class="blue-dot-pulse"></div><div class="blue-dot"></div>',
            iconSize: [40, 40],
            iconAnchor: [20, 20]
          });
          blueDot = L.marker([lat, lon], { icon: icon, zIndexOffset: 1000 }).addTo(map);
        } else {
          blueDot.setLatLng([lat, lon]);
        }
      }

      map.on('click', function(e) {
        window.ReactNativeWebView.postMessage(JSON.stringify({
          type: 'click',
          lat: e.latlng.lat,
          lon: e.latlng.lng
        }));
      });

      var markersMap = {};

      function updateMarkers(data) {
        try {
          if (!data || !Array.isArray(data)) return;
          var newMarkersMap = {};
          var dataIds = data.map(m => m.id);
          
          Object.keys(markersMap).forEach(id => {
            if (!dataIds.includes(id)) {
              markersLayer.removeLayer(markersMap[id]);
              delete markersMap[id];
            }
          });

          data.forEach(m => {
            if (!m.lat || !m.lon) return;

            if (markersMap[m.id]) {
              var existing = markersMap[m.id];
              var curPos = existing.getLatLng();
              if (curPos.lat === m.lat && curPos.lng === m.lon) {
                newMarkersMap[m.id] = existing;
                return;
              }
              markersLayer.removeLayer(existing);
            }

            var pinClass = m.type === "static" ? "static" : (m.type === "post" ? "post" : (m.type === "event" ? "event" : (m.type === "shoutout" ? "shoutout" : (m.type === "focused" ? "focused" : ""))));
            var labelHtml = m.type === 'shoutout' 
               ? '<div class="shoutout-label">🌈 ' + m.shoutoutData.content + '</div>'
               : '<div class="label">' + (m.username || 'User') + '</div>';

            var iconArray = m.type === 'shoutout' ? [60, 60] : [44, 44];
            var anchorArray = m.type === 'shoutout' ? [30, 60] : [22, 44];

            var innerHtml = (m.type === 'post' && m.postData && m.postData.image)
              ? '<img class="marker-img" src="' + m.postData.image + '" />'
              : '<div class="marker-dot"></div>';

            var icon = L.divIcon({
              className: 'custom-div-icon',
              html: '<div class="marker-pin ' + pinClass + '">' +
                      innerHtml +
                      labelHtml +
                    '</div>',
              iconSize: iconArray,
              iconAnchor: anchorArray
            });
            var marker = L.marker([m.lat, m.lon], { icon: icon }).addTo(markersLayer);
            
            marker.on('click', function(e) {
              L.DomEvent.stopPropagation(e);
              window.ReactNativeWebView.postMessage(JSON.stringify({
                type: 'marker-click',
                userData: m
              }));
            });
            newMarkersMap[m.id] = marker;
          });
          markersMap = newMarkersMap;
        } catch (e) {
          console.error("Leaflet update error:", e);
        }
      }

      window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'ready' }));
    </script>
  </body>
</html>
`;
};

const getVideoThumbnail = (url: string) => {
  if (!url) return null;
  if (url.includes('cloudinary.com')) {
    return url.replace(/\.[^/.]+$/, '.jpg');
  }
  return null;
};

const MapScreen = () => {
  const theme = useTheme();
  const { user: currentUser } = useContext(AuthContext);
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const webViewRef = useRef<WebView>(null);
  const bottomSheetRef = useRef<BottomSheet>(null);

  const [deviceLocation, setDeviceLocation] = useState<ExpoLocation.LocationObject | null>(null);
  const [selectedLocation, setSelectedLocation] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);
  const [sharedLocations, setSharedLocations] = useState<any[]>([]);
  const [sharingVisibility, setSharingVisibility] = useState<string>('off');
  const [sharingType, setSharingType] = useState<'live' | 'static'>('live');
  const [sharingDuration, setSharingDuration] = useState<number>(24);
  const [loading, setLoading] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [radius, setRadius] = useState(50);
  const [radiusMenuVisible, setRadiusMenuVisible] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [selectedEvent, setSelectedEvent] = useState<any>(null);
  const [selectedShoutout, setSelectedShoutout] = useState<any>(null);
  const [events, setEvents] = useState<any[]>([]);
  const [shoutoutModalVisible, setShoutoutModalVisible] = useState(false);
  const [shoutoutContent, setShoutoutContent] = useState('');
  const [isSelectingLocation, setIsSelectingLocation] = useState(false);
  const [bottomSheetIndex, setBottomSheetIndex] = useState(-1);
  const [sheetMode, setSheetMode] = useState<'user' | 'sharing' | 'event' | 'shoutout'>('sharing');
  const [activeFilter, setActiveFilter] = useState<
    'all' | 'friends' | 'shared' | 'post' | 'shoutout'
  >('all');

  // Picker mode detection
  const isPickerMode = route.params?.pickLocation === true;
  const [pickerAddress, setPickerAddress] = useState('');

  const snapPoints = useMemo(() => {
    if (sheetMode === 'user' || sheetMode === 'event') return ['30%', '50%'];
    return ['45%', '75%'];
  }, [sheetMode]);

  const fetchLocations = useCallback(
    async ({
      syncState = false,
      silent = false,
      overrideRadius,
      overrideLocation,
    }: {
      syncState?: boolean;
      silent?: boolean;
      overrideRadius?: number;
      overrideLocation?: ExpoLocation.LocationObject | null;
    } = {}) => {
      const activeRadius = overrideRadius !== undefined ? overrideRadius : radius;
      const activeLoc = overrideLocation !== undefined ? overrideLocation : deviceLocation;

      // if (!silent) setLoading(true); // Removed to avoid loops, but we need to know if it runs
      if (!silent) {
        // Alert.alert('DEBUG [1]', `fetchLocations START\nRadius: ${activeRadius}\nLoc: ${!!activeLoc}`);
        setLoading(true);
      }
      try {
        const lat = activeLoc?.coords.latitude;
        const lon = activeLoc?.coords.longitude;

        // Use a better check that allows 0, 0
        if (lat === undefined || lon === undefined) {
          if (!silent)
            Alert.alert('Debug Error', 'fetchLocations aborted: current lat/lon is undefined');
          return;
        }

        // if (!silent) Alert.alert('DEBUG [2]', `Calling API for radius ${activeRadius}`);
        const typeFilter =
          activeFilter === 'post'
            ? 'post'
            : activeFilter === 'shoutout'
              ? 'shoutout'
              : activeFilter === 'shared'
                ? 'live,static'
                : undefined;
        const audienceFilter = activeFilter === 'friends' ? 'friends' : undefined;

        const data = await getSharedLocationsAPI(
          lat,
          lon,
          activeRadius,
          undefined,
          undefined,
          typeFilter,
          audienceFilter
        );
        // if (!silent) Alert.alert('DEBUG [3]', `API Success! Count: ${data?.length}`);

        if (Array.isArray(data)) {
          // Success Alert for APK Debugging - Remove after verification
          // Alert.alert('Fetch Success', `Found ${data.length} markers`);
          setSharedLocations(data);
        } else {
          console.warn('[MapScreen] API returned non-array data:', data);
          setSharedLocations([]);
        }

        // Fetch Events too
        try {
          const eventRes = await getEventsAPI();
          setEvents(eventRes.events || []);
        } catch (e) {
          console.error('Error fetching events on map:', e);
        }

        if (syncState && Array.isArray(data)) {
          const myLoc = data.find((loc: any) => loc.user?._id === currentUser?._id);
          if (myLoc) {
            setSharingVisibility(myLoc.visibility);
            setSharingType(myLoc.type);
            // If it's static, we should also restore the selectedLocation if possible
            if (myLoc.type === 'static') {
              setSelectedLocation({ latitude: myLoc.latitude, longitude: myLoc.longitude });
            }
          }
        }
      } catch (err: any) {
        console.error('Error fetching locations:', err);
        // if (!silent) {
        //   Alert.alert('Map Error', err.message || 'Failed to fetch locations');
        // }
      } finally {
        if (!silent) setLoading(false);
      }
    },
    [currentUser, deviceLocation, radius]
  );

  const updateServerLocation = useCallback(
    async (
      lat: number,
      lon: number,
      visibility: string,
      type: 'live' | 'static',
      duration: number
    ) => {
      if (visibility === 'off') return;
      setIsUpdating(true);
      try {
        await shareLocationAPI(lat, lon, visibility, type, duration);
      } catch (err) {
        console.error('Error sharing location:', err);
      } finally {
        setIsUpdating(false);
      }
    },
    []
  );

  // Sync markers to WebView
  const markers = useMemo(() => {
    const isFocusedMode = route.params?.lat !== undefined && route.params?.lon !== undefined;
    console.log(
      '[MapScreen] generating markers. Focused:',
      isFocusedMode,
      'Shared count:',
      sharedLocations.length
    );

    const latestLiveLocs = new Map<string, any>();
    const shoutouts: any[] = [];
    const postMarkers: any[] = [];

    // 1. Process shared locations (shoutouts vs user locations vs posts)
    sharedLocations.forEach((loc) => {
      if (!loc || !loc.user) return;

      const userId = String(loc.user._id);
      const currentUserId = currentUser?._id ? String(currentUser._id) : null;

      if (loc.type === 'shoutout') {
        shoutouts.push({
          id: loc._id,
          lat: loc.latitude,
          lon: loc.longitude,
          title: 'Graffiti',
          username: loc.user.username,
          fullname: loc.user.fullname,
          avatar: loc.user.avatar,
          isMe: userId === currentUserId,
          type: 'shoutout',
          lastUpdate: loc.lastUpdate || loc.updatedAt,
          shoutoutData: {
            content: loc.content,
            visibility: loc.visibility,
          },
        });
      } else if (loc.type === 'post') {
        postMarkers.push({
          id: loc._id,
          lat: loc.latitude,
          lon: loc.longitude,
          title: loc.user.fullname,
          username: loc.user.username,
          fullname: loc.user.fullname,
          avatar: loc.user.avatar,
          isMe: userId === currentUserId,
          type: 'post',
          lastUpdate: loc.lastUpdate || loc.updatedAt,
          postData: loc.postData,
          address: loc.address,
        });
      } else {
        // Keep only the latest live/static update per user
        const existing = latestLiveLocs.get(userId);
        if (!existing || new Date(loc.updatedAt) > new Date(existing.updatedAt)) {
          latestLiveLocs.set(userId, loc);
        }
      }
    });

    const currentUserId = currentUser?._id ? String(currentUser._id) : null;

    // Map user live/static locations
    let markerList: any[] = Array.from(latestLiveLocs.values())
      .filter((loc) => {
        const userId = String(loc.user._id);
        // Hide self only if it's a live location (blue dot covers it)
        // BUT show self if it's a static location so the user sees their pinned spot
        if (userId === currentUserId) {
          return loc.type === 'static';
        }
        return true;
      })
      .map((loc) => ({
        id: loc._id,
        lat: loc.latitude,
        lon: loc.longitude,
        title: loc.user.fullname,
        username: loc.user.username,
        fullname: loc.user.fullname,
        avatar: loc.user.avatar,
        isMe: String(loc.user._id) === currentUserId,
        type: loc.type || 'live',
        lastUpdate: loc.lastUpdate || loc.updatedAt,
        postData: loc.postData,
        address: loc.address,
      }));

    // Add shoutouts and posts
    markerList = [...markerList, ...shoutouts, ...postMarkers];

    // 2. Add selected/static marker if it exists - only show if NOT selecting for graffiti
    // and if we don't already have a marker for this user at this location
    if ((selectedLocation || isFocusedMode) && !isSelectingLocation) {
      const pinLat = isFocusedMode ? route.params.lat : selectedLocation!.latitude;
      const pinLon = isFocusedMode ? route.params.lon : selectedLocation!.longitude;

      // Check for overlap with existing markers (0.00001 precision)
      const hasOverlapWithOtherMarkers = markerList.some(
        (m: any) => Math.abs(m.lat - pinLat) < 0.00001 && Math.abs(m.lon - pinLon) < 0.00001
      );

      // ALSO check for overlap with the Blue Dot (current device location)
      const userLat = deviceLocation?.coords.latitude;
      const userLon = deviceLocation?.coords.longitude;
      const overlapsWithBlueDot =
        userLat !== undefined &&
        userLon !== undefined &&
        Math.abs(userLat - pinLat) < 0.00001 &&
        Math.abs(userLon - pinLon) < 0.00001;

      if (!hasOverlapWithOtherMarkers && !overlapsWithBlueDot) {
        const pinTitle = isFocusedMode ? 'Shared Location' : 'Selected Spot';
        const pinUsername = isFocusedMode ? route.params.address || 'Location' : 'Fixed Point';

        markerList.push({
          id: isFocusedMode ? 'shared_pin' : 'selected',
          lat: pinLat,
          lon: pinLon,
          title: pinTitle,
          username: pinUsername,
          fullname: pinTitle,
          avatar: currentUser?.avatar || '',
          isMe: false,
          type: isFocusedMode ? 'focused' : 'static',
          lastUpdate: new Date().toISOString(),
          postData: undefined,
          address: isFocusedMode ? route.params.address : undefined,
        });
      }
    }

    // 3. Add Events
    events.forEach((ev: any) => {
      markerList.push({
        id: ev._id,
        lat: ev.location.coordinates[1],
        lon: ev.location.coordinates[0],
        title: ev.title,
        username: ev.title,
        fullname: ev.title,
        avatar: ev.image || '',
        isMe: false,
        type: 'event',
        lastUpdate: ev.updatedAt,
        postData: undefined,
        address: ev.address,
        eventData: ev,
      });
    });

    console.log('[MapScreen] Final marker list size:', markerList.length);
    return markerList;
  }, [sharedLocations, selectedLocation, route.params, currentUser, events, isSelectingLocation]);

  const updateMarkers = useCallback(() => {
    console.log('[MapScreen] updateMarkers called. LogRef:', !!webViewRef.current);
    if (!webViewRef.current || !webViewRef.current.injectJavaScript) {
      return;
    }

    const markersData = markers.map((m: any) => ({
      id: m.id,
      lat: m.lat,
      lon: m.lon,
      type: m.type,
      avatar: m.avatar,
      username: m.username,
      fullname: m.fullname,
      isMe: m.isMe,
      postData: m.postData,
      lastUpdate: m.lastUpdate,
      address: m.address,
      eventData: m.eventData,
      shoutoutData: m.shoutoutData,
    }));

    // Inject markers and user blue dot
    const userLat = deviceLocation?.coords.latitude;
    const userLon = deviceLocation?.coords.longitude;
    const userUpdateJs =
      userLat && userLon
        ? `if(window.updateUserLocation) { updateUserLocation(${userLat}, ${userLon}); }`
        : '';

    setTimeout(() => {
      try {
        if (webViewRef.current?.injectJavaScript) {
          webViewRef.current.injectJavaScript(`
            ${userUpdateJs}
            updateMarkers(${JSON.stringify(markersData)});
            true;
          `);
        }
      } catch (err) {
        console.error('MapScreen: injectJavaScript failed in updateMarkers', err);
      }
    }, 0);
  }, [markers, deviceLocation]);

  useEffect(() => {
    // Call updateMarkers whenever markers change.
    // Since map is always "ready" (static load), we can just try to update.
    updateMarkers();
  }, [updateMarkers]);

  // Calculate Initial Map State - STABLE
  const initialMapRef = useRef<{ lat: number; lon: number; zoom: number } | null>(null);
  const initialMapState = useMemo(() => {
    if (initialMapRef.current) return initialMapRef.current;

    const isFocused = route.params?.lat !== undefined && route.params?.lon !== undefined;
    let lat = 0,
      lon = 0,
      zoom = 2;

    if (isFocused) {
      lat = route.params.lat;
      lon = route.params.lon;
      zoom = 15;
    } else if (deviceLocation?.coords) {
      lat = deviceLocation.coords.latitude;
      lon = deviceLocation.coords.longitude;
      zoom = 13;
    }

    if (lat !== 0) {
      initialMapRef.current = { lat, lon, zoom };
    }
    return { lat, lon, zoom };
  }, [route.params, deviceLocation]);

  const webViewSource = useMemo(
    () => ({
      html: getMapHtml(initialMapState.lat, initialMapState.lon, initialMapState.zoom, theme),
    }),
    [initialMapState.lat, initialMapState.lon, initialMapState.zoom, theme]
  );

  // Use refs for interval to avoid frequent resets
  const stateRef = useRef({
    sharingVisibility,
    sharingType,
    sharingDuration,
    deviceLocation,
    radius,
  });

  useEffect(() => {
    stateRef.current = {
      sharingVisibility,
      sharingType,
      sharingDuration,
      deviceLocation,
      radius,
    };
  }, [sharingVisibility, sharingType, sharingDuration, deviceLocation, radius]);

  useEffect(() => {
    (async () => {
      console.log('🗺️ [MAP-DEBUG] ===== MapScreen useEffect Started =====');
      setLoading(true);
      // Alert.alert('Debug', 'Mount IIFE Start');
      try {
        const isFocusedMode = route.params?.lat !== undefined && route.params?.lon !== undefined;
        console.log('🗺️ [MAP-DEBUG] isFocusedMode:', isFocusedMode);
        let initialLoc: ExpoLocation.LocationObject | null = null;

        console.log('🗺️ [MAP-DEBUG] Checking if location services enabled...');
        const servicesEnabled = await ExpoLocation.hasServicesEnabledAsync();
        console.log('🗺️ [MAP-DEBUG] Services enabled:', servicesEnabled);

        if (!servicesEnabled) {
          console.error('❌ [MAP-DEBUG] Location services disabled!');
          Alert.alert('Location Services Off', 'Please enable location services to use the map.');
        } else {
          console.log('🗺️ [MAP-DEBUG] Checking current permission status...');
          let { status } = await ExpoLocation.getForegroundPermissionsAsync();
          console.log('🗺️ [MAP-DEBUG] Current permission status:', status);

          if (status !== 'granted') {
            console.log('🗺️ [MAP-DEBUG] Permission not granted, requesting...');
            const result = await ExpoLocation.requestForegroundPermissionsAsync();
            status = result.status;
            console.log('🗺️ [MAP-DEBUG] New permission status:', status);
          } else {
            console.log('🗺️ [MAP-DEBUG] Permission already granted, skipping request');
          }

          if (status === 'granted') {
            console.log('🗺️ [MAP-DEBUG] Calling getRobustLocation...');
            initialLoc = await getRobustLocation();
            console.log(
              '🗺️ [MAP-DEBUG] getRobustLocation returned:',
              initialLoc ? 'SUCCESS' : 'NULL'
            );

            setDeviceLocation(initialLoc);
            // Alert.alert('Debug', `Location state set to: ${initialLoc.coords.latitude.toFixed(2)}`);
            // Trigger fetch immediately with the fresh location
            if (!isFocusedMode) {
              fetchLocations({ overrideLocation: initialLoc });
            }
          } else if (!deviceLocation) {
            const fallback = {
              coords: { latitude: 0, longitude: 0, altitude: 0, accuracy: 0, heading: 0, speed: 0 },
              timestamp: Date.now(),
            } as any;
            setDeviceLocation(fallback);
            Alert.alert('Debug', 'Location failed, set to 0,0 fallback');
          }
        }
        // Initial fetch logic
        if (!isFocusedMode) {
          try {
            const lat = initialLoc?.coords.latitude || 0;
            const lon = initialLoc?.coords.longitude || 0;
            console.log('[MapScreen] Initial fetch with coords:', lat, lon);
            const data = await getSharedLocationsAPI(lat, lon, radius);
            if (Array.isArray(data)) {
              setSharedLocations(data);
            } else {
              setSharedLocations([]);
            }
          } catch (err) {
            console.error('[MapScreen] Initial fetch error:', err);
          }
        }
      } catch (error) {
        console.log('Error in location setup:', error);
        // Alert.alert('Location Setup Error', String(error));
      } finally {
        setLoading(false);
      }
    })();

    const interval = setInterval(() => {
      const isFocusedMode = route.params?.lat !== undefined && route.params?.lon !== undefined;
      if (isFocusedMode) return;

      fetchLocations({ silent: true });

      const {
        sharingVisibility: vis,
        sharingType: type,
        sharingDuration: dur,
        deviceLocation: loc,
      } = stateRef.current;

      if (vis !== 'off' && type === 'live' && loc?.coords) {
        updateServerLocation(loc.coords.latitude, loc.coords.longitude, vis, 'live', dur);
      }
    }, 30000);

    return () => clearInterval(interval);
  }, [route.params?.lat, route.params?.lon]); // Only re-run if target coordinates change

  useEffect(() => {
    const isFocusedMode = route.params?.lat !== undefined && route.params?.lon !== undefined;
    if (!isFocusedMode && deviceLocation) {
      // Alert.alert('DEBUG [Effect]', `Radius changed to ${radius}`);
      fetchLocations();
    }
  }, [radius, deviceLocation, activeFilter]); // Added activeFilter to deps

  const handleVisibilityChange = async (value: string) => {
    setSharingVisibility(value);
    if (value === 'off') {
      try {
        await stopSharingAPI();
        setSharingType('live');
        setSelectedLocation(null);
      } catch (err) {
        console.error('Error stopping sharing:', err);
      }
    } else {
      const lat =
        sharingType === 'live'
          ? deviceLocation?.coords.latitude
          : (selectedLocation?.latitude ?? deviceLocation?.coords.latitude);
      const lon =
        sharingType === 'live'
          ? deviceLocation?.coords.longitude
          : (selectedLocation?.longitude ?? deviceLocation?.coords.longitude);
      if (lat !== undefined && lon !== undefined) {
        await updateServerLocation(lat, lon, value, sharingType, sharingDuration);
      }
    }
    await fetchLocations();
  };

  const handleTypeChange = async (value: string) => {
    const newType = value as 'live' | 'static';
    setSharingType(newType);
    if (sharingVisibility !== 'off') {
      const lat =
        newType === 'live'
          ? deviceLocation?.coords.latitude
          : (selectedLocation?.latitude ?? deviceLocation?.coords.latitude);
      const lon =
        newType === 'live'
          ? deviceLocation?.coords.longitude
          : (selectedLocation?.longitude ?? deviceLocation?.coords.longitude);
      if (lat !== undefined && lon !== undefined) {
        await updateServerLocation(lat, lon, sharingVisibility, newType, sharingDuration);
      }
    }
  };

  const handleDurationChange = async (value: string) => {
    const newDuration = parseInt(value);
    setSharingDuration(newDuration);
    if (sharingVisibility !== 'off') {
      const lat =
        sharingType === 'live'
          ? deviceLocation?.coords.latitude
          : (selectedLocation?.latitude ?? deviceLocation?.coords.latitude);
      const lon =
        sharingType === 'live'
          ? deviceLocation?.coords.longitude
          : (selectedLocation?.longitude ?? deviceLocation?.coords.longitude);
      if (lat !== undefined && lon !== undefined) {
        await updateServerLocation(lat, lon, sharingVisibility, sharingType, newDuration);
      }
    }
  };

  const handleShareNow = async () => {
    console.log('[MapScreen] handleShareNow START');
    console.log('[MapScreen] Checks:');
    console.log('- getRobustLocation type:', typeof getRobustLocation);
    console.log('- ExpoLocation type:', typeof ExpoLocation);
    console.log('- updateServerLocation type:', typeof updateServerLocation);
    console.log('- fetchLocations type:', typeof fetchLocations);
    console.log('- Alert type:', typeof Alert);
    console.log('- moment type:', typeof moment);
    if (sharingVisibility === 'off') {
      Alert.alert(
        'Select Audience',
        'Please select if you want to share with Friends or Public first.'
      );
      return;
    }

    setLoading(true);
    try {
      let lat: number | undefined;
      let lon: number | undefined;

      console.log('[MapScreen] sharingType:', sharingType);
      console.log('[MapScreen] selectedLocation:', JSON.stringify(selectedLocation));

      // If we're sharing a static spot and have a marker, use it directly
      if (sharingType === 'static' && selectedLocation) {
        console.log('[MapScreen] Using static location');
        lat = selectedLocation.latitude;
        lon = selectedLocation.longitude;
      } else {
        // Otherwise, we need the actual device location or use device location as static
        try {
          console.log('[MapScreen] Checking permissions...');

          // Check status first to avoid hanging request
          const { status: existingStatus } = await ExpoLocation.getForegroundPermissionsAsync();
          let finalStatus = existingStatus;

          if (existingStatus !== 'granted') {
            console.log('[MapScreen] Requesting permissions (not granted yet)...');
            // Add timeout for permission request
            const permPromise = ExpoLocation.requestForegroundPermissionsAsync();
            const timeoutPromise = new Promise<{ status: string }>((_, reject) =>
              setTimeout(() => reject(new Error('Permission request timed out')), 5000)
            );
            const result = (await Promise.race([
              permPromise,
              timeoutPromise,
            ])) as ExpoLocation.PermissionResponse;
            finalStatus = result.status;
          } else {
            console.log('[MapScreen] Permissions already granted, skipping request.');
          }

          console.log('[MapScreen] Permission status:', finalStatus);

          if (finalStatus !== 'granted') {
            throw new Error('Location permission is required.');
          }

          console.log('[MapScreen] Calling getRobustLocation...');
          const loc = await getRobustLocation();
          console.log('[MapScreen] getRobustLocation returned:', loc ? 'Location Object' : 'null');

          if (!loc) {
            throw new Error('Could not get GPS location. Try placing a marker manually.');
          }
          setDeviceLocation(loc);
          lat = loc.coords.latitude;
          lon = loc.coords.longitude;
        } catch (e: any) {
          console.error('[MapScreen] Location error:', e);
          throw new Error(e.message || 'Failed to fetch GPS location.');
        }
      }

      console.log('[MapScreen] Coordinates to share:', lat, lon);

      if (lat !== undefined && lon !== undefined) {
        console.log('[MapScreen] Calling updateServerLocation...');
        await updateServerLocation(lat, lon, sharingVisibility, sharingType, sharingDuration);
        console.log('[MapScreen] updateServerLocation success');

        Alert.alert(
          'Success',
          `Location shared with ${sharingVisibility} for ${sharingDuration}h!`
        );
        // Force an immediate fetch to show the new sharing status on map
        console.log('[MapScreen] Fetching new locations...');
        await fetchLocations({ silent: true });
        console.log('[MapScreen] Fetch complete');
      }
    } catch (err: any) {
      console.error('[MapScreen] handleShareNow Error:', err);
      // Alert.alert('Error', err.message);
    } finally {
      console.log('[MapScreen] handleShareNow finally block');
      setLoading(false);
    }
  };

  const handleLocationSelect = (address: string, coordinates: [number, number]) => {
    const coords = { latitude: coordinates[1], longitude: coordinates[0] };
    setSelectedLocation(coords);
    setSharingType('static');

    if (webViewRef.current?.injectJavaScript) {
      // Added safety check
      webViewRef.current.injectJavaScript(`
        map.setView([${coords.latitude}, ${coords.longitude}], 13);
      `);
    }
  };

  const resetToMyLocation = () => {
    setSelectedLocation(null);
    setSharingType('live');
    if (deviceLocation) {
      const lat = deviceLocation.coords.latitude;
      const lon = deviceLocation.coords.longitude;

      if (webViewRef.current?.injectJavaScript) {
        // Just pan, the blue dot is handled by updateMarkers
        webViewRef.current.injectJavaScript(`
          map.setView([${lat}, ${lon}], 13);
        `);
      }
    }
  };

  const onMessage = useCallback(
    (event: any) => {
      // Wrap in setTimeout to break synchronous link with Native Event
      // This prevents the Native Crash caused by immediate state updates
      setTimeout(() => {
        try {
          const data = JSON.parse(event.nativeEvent.data);
          console.log('MapScreen: onMessage received', data.type);

          if (data.type === 'ready') {
            console.log('[MapScreen] WebView ready. Triggering initial marker update.');
            updateMarkers();
          } else if (data.type === 'click') {
            if (
              isSelectingLocation ||
              (sheetMode === 'sharing' && sharingType === 'static') ||
              isPickerMode
            ) {
              const coords = { latitude: data.lat, longitude: data.lon };
              setSelectedLocation(coords);

              if (isPickerMode) {
                // In picker mode, just set the location and fetch address
                console.log('[MapScreen] Picker mode: location selected', coords);
                addTemporaryMarker(data.lat, data.lon, 'gps');
                getReadableAddress(data.lat, data.lon)
                  .then((addr: string) => {
                    console.log('[MapScreen] Address fetched:', addr);
                    setPickerAddress(addr);
                  })
                  .catch(() => setPickerAddress('Selected Location'));
              } else {
                setSharingType('static');
                // Add visual marker for selected location
                addTemporaryMarker(data.lat, data.lon, isSelectingLocation ? 'graffiti' : 'gps');

                if (isSelectingLocation) {
                  setIsSelectingLocation(false);
                  // Reopen graffiti modal
                  setTimeout(() => {
                    setShoutoutModalVisible(true);
                  }, 300);
                } else {
                  // Reopen sharing settings
                  setTimeout(() => {
                    bottomSheetRef.current?.snapToIndex(1);
                  }, 300);
                }
              }
            }
          } else if (data.type === 'marker-click') {
            if (data.userData.type === 'event') {
              setSelectedEvent(data.userData.eventData);
              setSheetMode('event');
            } else if (data.userData.type === 'shoutout') {
              setSelectedShoutout(data.userData);
              setSheetMode('shoutout');
            } else {
              setSelectedUser(data.userData);
              setSheetMode('user');
            }
            bottomSheetRef.current?.snapToIndex(1);
          }
        } catch (e) {
          console.error('WebView message error:', e);
        }
      }, 0);
    },
    [route.params, deviceLocation, isSelectingLocation, sheetMode, sharingType]
  );

  const handleOpenSharing = () => {
    setSheetMode('sharing');
    bottomSheetRef.current?.snapToIndex(1);
  };

  const handleStopSharing = async () => {
    setSharingVisibility('off');
    try {
      await stopSharingAPI();
      setSharingType('live');
      setSelectedLocation(null);
      await fetchLocations();
      Alert.alert('Stopped Sharing', 'Your location has been removed from the map.');
      bottomSheetRef.current?.close();
    } catch (err) {
      console.error('Error stopping sharing:', err);
      Alert.alert('Error', 'Failed to stop sharing.');
    }
  };

  const getStatusText = () => {
    if (sharingVisibility === 'off') return 'Not Sharing';
    return `${sharingType === 'live' ? 'Live' : 'Static'} sharing with ${sharingVisibility}`;
  };

  const handleCreateShoutout = async () => {
    if (!shoutoutContent.trim()) {
      Alert.alert('Empty Shoutout', 'Please enter some graffiti text!');
      return;
    }

    setLoading(true);
    try {
      let lat = deviceLocation?.coords.latitude || 0;
      let lon = deviceLocation?.coords.longitude || 0;

      // If a spot is selected, use that instead of current location
      if (selectedLocation) {
        lat = selectedLocation.latitude;
        lon = selectedLocation.longitude;
      }

      await createShoutoutAPI(shoutoutContent, lat, lon, 'public');
      Alert.alert('✨ Success!', "You've left your digital graffiti on the map!");
      setShoutoutContent('');
      setShoutoutModalVisible(false);
      setSelectedLocation(null); // Clear selected location
      removeTemporaryMarker(); // Remove the temporary marker
      await fetchLocations({ silent: true });
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to create shoutout');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = () => {
    if (sharingVisibility === 'off') return theme.colors.outline;
    return sharingType === 'live' ? theme.colors.primary : '#00A8FF';
  };

  // Handle location confirmation in picker mode
  const handleConfirmLocation = async () => {
    if (!selectedLocation) {
      Alert.alert('No Location Selected', 'Please tap on the map to select a location.');
      return;
    }

    const locationData = {
      address: pickerAddress || 'Selected Location',
      latitude: selectedLocation.latitude,
      longitude: selectedLocation.longitude,
    };

    console.log('[MapScreen] Confirming location via event:', locationData);

    // Emit event instead of complicated navigation
    DeviceEventEmitter.emit('onLocationPicked', locationData);

    // Simply go back
    navigation.goBack();
  };

  // Function to add a temporary marker on the map
  const addTemporaryMarker = (lat: number, lon: number, type: 'graffiti' | 'gps') => {
    const markerColor = type === 'graffiti' ? '#FF00CC' : theme.colors.primary;
    const markerLabel = type === 'graffiti' ? '📍 Graffiti Location' : '📍 My Location';

    const js = `
      (function() {
        // Remove existing temporary marker if any
        if (window.tempMarker) {
          map.removeLayer(window.tempMarker);
        }
        
        // Create custom icon for temporary marker
        var icon = L.divIcon({
          className: 'custom-div-icon',
          html: '<div class="marker-pin" style="background: ${markerColor}; border-color: ${theme.colors.surface}; width: 50px; height: 50px; margin: -25px 0 0 -25px; animation: pulse 1.5s infinite;">' +
                  '<div class="marker-dot" style="background: ${theme.colors.surface};"></div>' +
                  '<div class="label" style="bottom: -30px; font-size: 11px; font-weight: bold;">${markerLabel}</div>' +
                '</div>',
          iconSize: [50, 50],
          iconAnchor: [25, 50]
        });
        
        // Add pulsing animation
        var style = document.createElement('style');
        style.innerHTML = '@keyframes pulse { 0%, 100% { transform: scale(1); } 50% { transform: scale(1.1); } }';
        document.head.appendChild(style);
        
        // Create and add marker
        window.tempMarker = L.marker([${lat}, ${lon}], { icon: icon }).addTo(map);
        
        // Pan to marker
        map.panTo([${lat}, ${lon}]);
      })();
      true;
    `;

    webViewRef.current?.injectJavaScript(js);
  };

  const removeTemporaryMarker = () => {
    const js = `
      (function() {
        if (window.tempMarker) {
          map.removeLayer(window.tempMarker);
          window.tempMarker = null;
        }
      })();
      true;
    `;
    webViewRef.current?.injectJavaScript(js);
  };

  const renderBackdrop = useCallback(
    (props: any) => (
      <BottomSheetBackdrop {...props} disappearsOnIndex={-1} appearsOnIndex={0} opacity={0.5} />
    ),
    []
  );

  return (
    <View style={styles.container}>
      <WebView
        ref={webViewRef}
        originWhitelist={['*']}
        source={webViewSource}
        style={styles.map}
        onMessage={onMessage}
        onLoadEnd={() => {
          console.log('[MapScreen] WebView onLoadEnd. Triggering markers update safe-guard.');
          updateMarkers();
        }}
      />

      {bottomSheetIndex <= 0 && (
        <View style={styles.topControls}>
          <IconButton
            icon="chevron-left"
            size={24}
            mode="contained"
            containerColor={theme.colors.surface}
            iconColor={theme.colors.onSurface}
            onPress={() => navigation.goBack()}
            style={styles.backBtn}
          />
          <View style={styles.searchWrapper}>
            <LocationAutocomplete
              onLocationSelect={handleLocationSelect}
              placeholder="Search address or city..."
              isLoading={loading}
            />
          </View>
        </View>
      )}

      {bottomSheetIndex <= 0 && (
        <View style={styles.filterContainer}>
          <BottomSheetScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filterScrollContent}>
            <Chip
              selected={activeFilter === 'all'}
              onPress={() => setActiveFilter('all')}
              style={styles.filterChip}
              icon="layers-outline"
              selectedColor={theme.colors.primary}>
              Everything
            </Chip>
            <Chip
              selected={activeFilter === 'friends'}
              onPress={() => setActiveFilter('friends')}
              style={styles.filterChip}
              icon="account-group-outline"
              selectedColor={theme.colors.primary}>
              Friends
            </Chip>
            <Chip
              selected={activeFilter === 'shared'}
              onPress={() => setActiveFilter('shared')}
              style={styles.filterChip}
              icon="map-marker-outline"
              selectedColor={theme.colors.primary}>
              Shared
            </Chip>
            <Chip
              selected={activeFilter === 'post'}
              onPress={() => setActiveFilter('post')}
              style={styles.filterChip}
              icon="image-outline"
              selectedColor={theme.colors.primary}>
              Posts
            </Chip>
            <Chip
              selected={activeFilter === 'shoutout'}
              onPress={() => setActiveFilter('shoutout')}
              style={styles.filterChip}
              icon="format-paint"
              selectedColor="#FF00CC">
              Graffiti
            </Chip>
          </BottomSheetScrollView>
        </View>
      )}

      {/* Confirm Button for Picker Mode */}
      {isPickerMode && selectedLocation && (
        <View style={[styles.pickerConfirmContainer, { backgroundColor: theme.colors.surface }]}>
          <Text style={[styles.pickerAddressText, { color: theme.colors.onSurface }]}>
            {pickerAddress || 'Loading address...'}
          </Text>
          <Button
            mode="contained"
            onPress={handleConfirmLocation}
            style={styles.confirmButton}
            contentStyle={{ paddingVertical: 8 }}
            labelStyle={{ fontSize: 16, fontWeight: 'bold' }}>
            Confirm Location
          </Button>
        </View>
      )}

      {bottomSheetIndex <= 0 && (
        <View style={styles.floatingControls}>
          <Menu
            visible={radiusMenuVisible}
            onDismiss={() => setRadiusMenuVisible(false)}
            anchor={
              <Button
                mode="contained"
                onPress={() => setRadiusMenuVisible(true)}
                style={styles.fab}
                buttonColor={theme.colors.surface}
                textColor={theme.colors.onSurface}
                icon="radius-outline">
                {radius >= 10000 ? 'All' : `${radius}km`}
              </Button>
            }
            contentStyle={styles.radiusMenu}>
            <Menu.Item
              onPress={() => {
                try {
                  // Alert.alert('DEBUG [Click]', 'Changing radius to 20000');
                  setRadius(20000);
                  setRadiusMenuVisible(false);
                  fetchLocations({ overrideRadius: 20000 });
                } catch (e) {
                  // Alert.alert('Fatal Error', String(e));
                }
              }}
              title="All"
              leadingIcon={radius >= 10000 ? 'check' : undefined}
            />
            <Menu.Item
              onPress={() => {
                try {
                  setRadius(5);
                  setRadiusMenuVisible(false);
                  fetchLocations({ overrideRadius: 5 });
                } catch (e) {
                  // Alert.alert('Error', String(e));
                }
              }}
              title="5 km"
              leadingIcon={radius === 5 ? 'check' : undefined}
            />
            <Menu.Item
              onPress={() => {
                try {
                  setRadius(20);
                  setRadiusMenuVisible(false);
                  fetchLocations({ overrideRadius: 20 });
                } catch (e) {
                  // Alert.alert('Error', String(e));
                }
              }}
              title="20 km"
              leadingIcon={radius === 20 ? 'check' : undefined}
            />
            <Menu.Item
              onPress={() => {
                try {
                  setRadius(50);
                  setRadiusMenuVisible(false);
                  fetchLocations({ overrideRadius: 50 });
                } catch (e) {
                  // Alert.alert('Error', String(e));
                }
              }}
              title="50 km"
              leadingIcon={radius === 50 ? 'check' : undefined}
            />
            <Menu.Item
              onPress={() => {
                try {
                  setRadius(100);
                  setRadiusMenuVisible(false);
                  fetchLocations({ overrideRadius: 100 });
                } catch (e) {
                  // Alert.alert('Error', String(e));
                }
              }}
              title="100 km"
              leadingIcon={radius === 100 ? 'check' : undefined}
            />
            <Menu.Item
              onPress={() => {
                try {
                  setRadius(500);
                  setRadiusMenuVisible(false);
                  fetchLocations({ overrideRadius: 500 });
                } catch (e) {
                  // Alert.alert('Error', String(e));
                }
              }}
              title="500 km"
              leadingIcon={radius === 500 ? 'check' : undefined}
            />
          </Menu>

          <IconButton
            icon="crosshairs-gps"
            mode="contained"
            containerColor={theme.colors.onSurface}
            iconColor={theme.colors.primary}
            size={24}
            onPress={resetToMyLocation}
            style={styles.fab}
          />
          {!isPickerMode && (
            <React.Fragment>
              <IconButton
                icon="share-variant"
                mode="contained"
                containerColor={theme.colors.primary}
                iconColor={theme.colors.onPrimary}
                size={24}
                onPress={handleOpenSharing}
                style={styles.fab}
              />
              <IconButton
                icon="format-paint"
                mode="contained"
                containerColor="#FF00CC"
                iconColor="#fff"
                size={24}
                onPress={() => setShoutoutModalVisible(true)}
                style={styles.fab}
              />
            </React.Fragment>
          )}
        </View>
      )}

      <BottomSheet
        ref={bottomSheetRef}
        index={-1}
        snapPoints={snapPoints}
        enablePanDownToClose
        onChange={setBottomSheetIndex}
        backdropComponent={renderBackdrop}
        backgroundStyle={{ backgroundColor: theme.colors.surface }}
        handleIndicatorStyle={{ backgroundColor: theme.colors.onSurfaceVariant }}
        style={{ zIndex: 2000 }}>
        <BottomSheetScrollView style={styles.bottomSheetContent}>
          {sheetMode === 'user' && selectedUser ? (
            <View style={styles.userInfoContainer}>
              <View style={styles.userHeader}>
                <Avatar.Image
                  size={70}
                  source={{
                    uri:
                      selectedUser.avatar ||
                      'https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460__340.png',
                  }}
                />
                <View style={styles.userNameInfo}>
                  <Text variant="titleLarge" style={styles.fullname}>
                    {selectedUser.fullname}
                  </Text>
                  <Text variant="bodyMedium" style={styles.username}>
                    @{selectedUser.username}
                  </Text>
                </View>
              </View>

              <Divider style={styles.divider} />

              <View style={styles.infoRow}>
                <IconButton icon="clock-outline" size={20} />
                <Text variant="bodyMedium">
                  Last updated {moment(selectedUser.lastUpdate).fromNow()}
                </Text>
              </View>

              <View style={styles.infoRow}>
                <IconButton
                  icon={
                    selectedUser.type === 'live'
                      ? 'broadcast'
                      : selectedUser.type === 'post'
                        ? 'pin'
                        : 'pin-outline'
                  }
                  size={20}
                />
                <Text variant="bodyMedium">
                  Mode:{' '}
                  <Text style={{ fontWeight: 'bold' }}>
                    {selectedUser.type === 'live'
                      ? 'Live Track'
                      : selectedUser.type === 'post'
                        ? 'Tagged Post'
                        : 'Static Spot'}
                  </Text>
                </Text>
              </View>

              {selectedUser.postData && (
                <View style={styles.postPreviewContainer}>
                  <Text variant="titleSmall" style={styles.latestPostTitle}>
                    Latest Post
                  </Text>
                  <TouchableOpacity
                    style={styles.postCardPreview}
                    onPress={() => {
                      bottomSheetRef.current?.close();
                      navigation.navigate('PostDetail', { postId: selectedUser.postData.id });
                    }}>
                    {selectedUser.postData.image && (
                      <>
                        {selectedUser.postData.resource_type === 'video' ||
                        selectedUser.postData.image.endsWith('.mp4') ? (
                          <View
                            style={[
                              styles.postPreviewImage,
                              {
                                backgroundColor: '#000',
                                justifyContent: 'center',
                                alignItems: 'center',
                                overflow: 'hidden',
                              },
                            ]}>
                            {getVideoThumbnail(selectedUser.postData.image) ? (
                              <Image
                                source={{
                                  uri: getVideoThumbnail(selectedUser.postData.image) as string,
                                }}
                                style={{ width: '100%', height: '100%', opacity: 0.7 }}
                              />
                            ) : null}
                            <Ionicons
                              name="play-circle-outline"
                              size={24}
                              color="#fff"
                              style={{ position: 'absolute' }}
                            />
                          </View>
                        ) : (
                          <Image
                            source={{ uri: selectedUser.postData.image }}
                            style={styles.postPreviewImage}
                          />
                        )}
                      </>
                    )}
                    <View style={styles.postPreviewTextContent}>
                      <Text variant="bodyMedium" numberOfLines={2}>
                        {selectedUser.postData.content}
                      </Text>
                      <Text style={styles.viewMoreText}>Tap to view post</Text>
                    </View>
                  </TouchableOpacity>
                </View>
              )}

              <Button
                mode="contained"
                style={styles.viewProfileBtn}
                onPress={() => {
                  bottomSheetRef.current?.close();
                  if (selectedUser.isMe) {
                    navigation.navigate('Profile');
                  } else {
                    navigation.navigate('Profile', { id: selectedUser.id });
                  }
                }}>
                View Profile
              </Button>

              {selectedUser.isMe && sharingVisibility !== 'off' && (
                <Button
                  mode="outlined"
                  textColor="#FF3B30"
                  icon="eye-off"
                  style={[
                    styles.viewProfileBtn,
                    { backgroundColor: 'transparent', borderColor: '#FF3B30', marginTop: 10 },
                  ]}
                  onPress={handleStopSharing}>
                  Stop Sharing My Location
                </Button>
              )}
            </View>
          ) : sheetMode === 'event' && selectedEvent ? (
            <View style={styles.userInfoContainer}>
              <View style={styles.userHeader}>
                {selectedEvent.image ? (
                  <Image
                    source={{ uri: selectedEvent.image }}
                    style={[styles.postPreviewImage, { width: 80, height: 80 }]}
                  />
                ) : (
                  <Avatar.Icon size={70} icon="calendar" />
                )}
                <View style={styles.userNameInfo}>
                  <Text variant="titleLarge" style={styles.fullname}>
                    {selectedEvent.title}
                  </Text>
                  <Text variant="bodyMedium" style={styles.username}>
                    {moment(selectedEvent.date).format('ddd, MMM D')} • {selectedEvent.time}
                  </Text>
                </View>
              </View>

              <Divider style={styles.divider} />

              <View style={styles.infoRow}>
                <IconButton icon="map-marker-outline" size={20} />
                <Text variant="bodyMedium" style={{ flex: 1 }}>
                  {selectedEvent.address}
                </Text>
              </View>

              <View style={styles.infoRow}>
                <IconButton icon="account-group-outline" size={20} />
                <Text variant="bodyMedium">
                  {selectedEvent.going?.length || 0} going • {selectedEvent.interested?.length || 0}{' '}
                  interested
                </Text>
              </View>

              <Button
                mode="contained"
                style={styles.viewProfileBtn}
                onPress={() => {
                  bottomSheetRef.current?.close();
                  navigation.navigate('EventDetail', { id: selectedEvent._id });
                }}>
                View Event Details
              </Button>
            </View>
          ) : sheetMode === 'shoutout' && selectedShoutout ? (
            <View style={styles.userInfoContainer}>
              <View style={styles.userHeader}>
                <Avatar.Text
                  size={70}
                  label="🌈"
                  style={{ backgroundColor: theme.colors.primary }}
                  labelStyle={{ fontSize: 40 }}
                />
                <View style={styles.userNameInfo}>
                  <Text variant="titleLarge" style={[styles.fullname, { color: '#FF00CC' }]}>
                    Digital Graffiti
                  </Text>
                  <Text variant="bodyMedium" style={styles.username}>
                    by {selectedShoutout.fullname} (@{selectedShoutout.username})
                  </Text>
                </View>
              </View>

              <View style={styles.shoutoutContentCard}>
                <Text style={styles.shoutoutLargeText}>
                  "{selectedShoutout.shoutoutData.content}"
                </Text>
              </View>

              <Divider style={styles.divider} />

              <View style={styles.infoRow}>
                <IconButton icon="clock-outline" size={20} />
                <Text variant="bodyMedium">
                  Left {moment(selectedShoutout.lastUpdate).fromNow()}
                </Text>
              </View>

              <Button
                mode="contained"
                style={styles.viewProfileBtn}
                onPress={() => {
                  bottomSheetRef.current?.close();
                  navigation.navigate('Profile', { id: selectedShoutout.user._id });
                }}>
                View Author Profile
              </Button>
            </View>
          ) : (
            <View style={styles.sharingSettingsContainer}>
              <View style={styles.settingsHeaderContainer}>
                <Text variant="titleLarge" style={styles.settingsHeader}>
                  Sharing Settings
                </Text>
                <View style={styles.statusRow}>
                  <View style={[styles.statusDot, { backgroundColor: getStatusColor() }]} />
                  <Text variant="bodySmall" style={styles.statusText}>
                    {getStatusText()}
                  </Text>
                  {isUpdating && (
                    <ActivityIndicator
                      size={12}
                      color={theme.colors.onSurfaceVariant}
                      style={{ marginLeft: 8 }}
                    />
                  )}
                </View>
              </View>
              <Divider style={styles.divider} />

              <View style={styles.controlGroup}>
                <Text style={styles.controlsTitle}>Who can see you?</Text>
                <SegmentedButtons
                  value={sharingVisibility}
                  onValueChange={handleVisibilityChange}
                  buttons={[
                    { value: 'off', label: 'Off', icon: 'eye-off' },
                    { value: 'friends', label: 'Friends', icon: 'account-group' },
                    { value: 'public', label: 'Public', icon: 'earth' },
                  ]}
                  density="medium"
                  style={{ marginBottom: 15 }}
                />
              </View>

              <View style={styles.controlGroup}>
                <Text style={styles.controlsTitle}>Sharing Mode & Duration</Text>
                <View style={styles.modeDurationRow}>
                  <SegmentedButtons
                    value={sharingType}
                    onValueChange={handleTypeChange}
                    buttons={[
                      { value: 'live', label: 'Live', icon: 'map-marker-radius' },
                      { value: 'static', label: 'Spot', icon: 'pin' },
                    ]}
                    density="medium"
                    style={{ flex: 1.2, marginRight: 8 }}
                  />
                  <SegmentedButtons
                    value={sharingDuration.toString()}
                    onValueChange={handleDurationChange}
                    buttons={[
                      { value: '1', label: '1h' },
                      { value: '8', label: '8h' },
                      { value: '24', label: '24h' },
                    ]}
                    density="medium"
                    style={{ flex: 1.5 }}
                  />
                </View>
                {sharingType === 'static' && (
                  <Button
                    mode="outlined"
                    icon="map-marker-plus"
                    onPress={() => {
                      bottomSheetRef.current?.close();
                      Alert.alert(
                        'Select Spot',
                        'Tap anywhere on the map to pick your sharing location',
                        [{ text: 'OK' }]
                      );
                    }}
                    style={{ marginTop: 10 }}
                    textColor={theme.colors.primary}>
                    Tap on Map to Pick Spot
                  </Button>
                )}
                {sharingType === 'static' && selectedLocation && (
                  <Text
                    style={{
                      fontSize: 12,
                      color: theme.colors.primary,
                      marginTop: 4,
                      textAlign: 'center',
                    }}>
                    ✅ Location selected on map
                  </Text>
                )}
              </View>

              <View style={styles.settingsActions}>
                <Button
                  mode="contained"
                  onPress={handleShareNow}
                  loading={loading}
                  style={styles.settingsActionBtn}
                  buttonColor={theme.colors.primary}
                  textColor={theme.colors.onPrimary}
                  icon="share-variant">
                  {sharingVisibility === 'off' ? 'Start Sharing' : 'Update Now'}
                </Button>

                {sharingVisibility !== 'off' && (
                  <Button
                    mode="contained"
                    onPress={handleStopSharing}
                    style={[styles.settingsActionBtn, { marginTop: 10, marginBottom: 30 }]}
                    buttonColor="#FF3B30"
                    textColor="#fff"
                    icon="close-circle-outline">
                    Stop Sharing
                  </Button>
                )}
              </View>
            </View>
          )}
        </BottomSheetScrollView>
      </BottomSheet>

      {/* Shoutout Modal */}
      <Modal
        visible={shoutoutModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setShoutoutModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.shoutoutModal, { backgroundColor: theme.colors.surface }]}>
            <View style={styles.shoutoutModalInner}>
              <Text
                variant="titleLarge"
                style={[styles.shoutoutTitle, { color: theme.colors.onSurface }]}>
                Spray some Graffiti! 🎨
              </Text>
              <Text
                variant="bodySmall"
                style={[styles.shoutoutSub, { color: theme.colors.onSurfaceVariant }]}>
                Leave a fun message for others nearby.
              </Text>
              <View
                style={[
                  styles.shoutoutInputWrapper,
                  { backgroundColor: theme.colors.surfaceVariant },
                ]}>
                <IconButton icon="format-paint" iconColor="#FF00CC" size={24} />
                <View style={{ flex: 1 }}>
                  <LocationAutocomplete
                    onLocationSelect={(addr, coord) => {
                      const c = { latitude: coord[1], longitude: coord[0] };
                      setSelectedLocation(c);
                    }}
                    placeholder="Searching for a spot?"
                  />
                </View>
              </View>

              <Button
                mode="outlined"
                icon="map-marker-plus"
                onPress={() => {
                  setShoutoutModalVisible(false);
                  setIsSelectingLocation(true);
                }}
                style={{ marginTop: 10 }}
                textColor={theme.colors.primary}>
                Tap on Map to Select Location
              </Button>

              {selectedLocation && (
                <View style={{ marginTop: 10, flexDirection: 'row', alignItems: 'center' }}>
                  <Ionicons name="checkmark-circle" size={20} color={theme.colors.primary} />
                  <Text
                    style={{ marginLeft: 5, color: theme.colors.onSurfaceVariant, fontSize: 13 }}>
                    Location selected on map
                  </Text>
                </View>
              )}

              <View
                style={[
                  styles.shoutoutInputWrapper,
                  { marginTop: 10, backgroundColor: theme.colors.surfaceVariant },
                ]}>
                <IconButton icon="chat-outline" iconColor="#00A8FF" size={24} />
                <TextInput
                  style={{
                    flex: 1,
                    padding: 10,
                    fontSize: 15,
                    color: theme.colors.onSurface,
                    minHeight: 80,
                  }}
                  placeholder="What is on your mind?"
                  placeholderTextColor={theme.colors.onSurfaceVariant}
                  value={shoutoutContent}
                  onChangeText={setShoutoutContent}
                  multiline
                  maxLength={200}
                  textAlignVertical="top"
                />
              </View>

              <View style={{ height: 20 }} />

              <Button
                mode="contained"
                buttonColor={theme.colors.primary}
                textColor={theme.colors.onPrimary}
                onPress={handleCreateShoutout}
                loading={loading}
                disabled={!shoutoutContent}
                style={{ marginBottom: 10 }}>
                POST GRAFFITI
              </Button>
              <Button onPress={() => setShoutoutModalVisible(false)}>Cancel</Button>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    flex: 1,
  },
  topControls: {
    position: 'absolute',
    top: Constants.statusBarHeight + 10,
    left: 15,
    right: 15,
    flexDirection: 'row',
    alignItems: 'center',
    zIndex: 1000,
  },
  backBtn: {
    borderRadius: 14,
    width: 44,
    height: 44,
    marginRight: 10,
    elevation: 4,
  },
  searchWrapper: {
    flex: 1,
  },
  filterContainer: {
    position: 'absolute',
    top: Constants.statusBarHeight + 65,
    left: 0,
    right: 0,
    zIndex: 1000,
  },
  filterScrollContent: {
    paddingHorizontal: 15,
    paddingBottom: 5,
    gap: 8,
  },
  filterChip: {
    backgroundColor: 'rgba(255,255,255,0.9)',
    elevation: 2,
    height: 34,
  },
  floatingControls: {
    position: 'absolute',
    bottom: 30,
    right: 20,
    flexDirection: 'column',
    gap: 10,
    zIndex: 10,
  },
  fab: {
    margin: 0,
    elevation: 4,
  },
  sharingSettingsContainer: {
    paddingBottom: 20,
  },
  settingsHeaderContainer: {
    marginBottom: 5,
  },
  settingsHeader: {
    fontWeight: 'bold',
    textAlign: 'center',
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 6,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
  },
  settingsActions: {
    marginTop: 20,
    gap: 10,
  },
  settingsActionBtn: {
    borderRadius: 12,
    paddingVertical: 4,
  },
  controlGroup: {
    width: '100%',
    marginBottom: 15,
  },
  controlsTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  modeDurationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  bottomSheetContent: {
    padding: 20,
  },
  userInfoContainer: {
    flex: 1,
  },
  userHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  userNameInfo: {
    marginLeft: 15,
  },
  fullname: {
    fontWeight: 'bold',
  },
  username: {},
  divider: {
    marginBottom: 15,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: -10,
  },
  viewProfileBtn: {
    marginTop: 20,
    borderRadius: 10,
  },
  postPreviewContainer: {
    marginTop: 15,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  latestPostTitle: {
    marginBottom: 8,
    fontWeight: 'bold',
  },
  postCardPreview: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  postPreviewImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
  },
  postPreviewTextContent: {
    flex: 1,
    marginLeft: 12,
  },
  viewMoreText: {
    fontSize: 12,
    color: '#007AFF',
    marginTop: 4,
    fontWeight: '600',
  },
  radiusMenu: {
    borderRadius: 15,
    marginTop: -220, // Adjust to show above button
    paddingVertical: 5,
  },
  shoutoutModal: {
    borderRadius: 20,
    width: Dimensions.get('window').width * 0.85,
    padding: 10,
  },
  shoutoutModalInner: {
    padding: 10,
  },
  shoutoutTitle: {
    fontWeight: '900',
    textAlign: 'center',
    marginBottom: 5,
  },
  shoutoutSub: {
    textAlign: 'center',
    marginBottom: 20,
  },
  shoutoutInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    paddingHorizontal: 10,
  },
  shoutoutContentCard: {
    backgroundColor: '#000',
    padding: 20,
    borderRadius: 15,
    marginVertical: 10,
    transform: [{ rotate: '-2deg' }],
    borderWidth: 3,
    borderColor: '#D4F637',
    shadowColor: '#FF00CC',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 10,
  },
  shoutoutLargeText: {
    color: '#D4F637',
    fontSize: 24,
    fontWeight: '900',
    fontFamily: Platform.OS === 'ios' ? 'Marker Felt' : 'monospace',
    textAlign: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  pickerConfirmContainer: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
    padding: 16,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  pickerAddressText: {
    fontSize: 14,
    marginBottom: 12,
    textAlign: 'center',
    fontWeight: '500',
  },
  confirmButton: {
    borderRadius: 12,
  },
});

export default MapScreen;
