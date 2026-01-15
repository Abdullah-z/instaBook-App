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
} from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import BottomSheet, { BottomSheetScrollView, BottomSheetBackdrop } from '@gorhom/bottom-sheet';
import { AuthContext } from '../auth/AuthContext';
import { shareLocationAPI, getSharedLocationsAPI, stopSharingAPI } from '../api/locationAPI';
import LocationAutocomplete from '../components/LocationAutocomplete';
import { getRobustLocation } from '../utils/locationHelper';
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
        background: #D4F637;
        position: absolute;
        transform: rotate(-45deg);
        left: 50%; top: 50%;
        margin: -22px 0 0 -22px;
        border: 2px solid #fff;
        box-shadow: 0 4px 8px rgba(0,0,0,0.3);
      }
      .marker-pin.static { background: #00A8FF; }
      .marker-pin.post { background: #FF9800; }
      .marker-pin.focused { background: #FF0000; }
      .marker-pin.focused .marker-img { display: none; }
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
      // Initialize map with passed coordinates
      var map = L.map('map', { zoomControl: false, attributionControl: false }).setView([${lat}, ${lon}], ${zoom});
      
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap'
      }).addTo(map);

      var markersLayer = L.layerGroup().addTo(map);

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
          
          // Remove old markers not in new data
          Object.keys(markersMap).forEach(id => {
            if (!dataIds.includes(id)) {
              markersLayer.removeLayer(markersMap[id]);
              delete markersMap[id];
            }
          });

          data.forEach(m => {
            if (!m.lat || !m.lon) return;

            // Check if marker already exists and position is same
            if (markersMap[m.id]) {
              var existing = markersMap[m.id];
              var curPos = existing.getLatLng();
              if (curPos.lat === m.lat && curPos.lng === m.lon) {
                newMarkersMap[m.id] = existing;
                return;
              }
              markersLayer.removeLayer(existing);
            }

            var imgSrc = (m.type === 'post' && m.postData && m.postData.image) 
              ? m.postData.image 
              : (m.avatar || "https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460__340.png");
            
            var pinClass = m.type === "static" ? "static" : (m.type === "post" ? "post" : (m.type === "focused" ? "focused" : ""));
            
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

const MapScreen = () => {
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
  const [bottomSheetIndex, setBottomSheetIndex] = useState(-1);
  const [sheetMode, setSheetMode] = useState<'user' | 'sharing'>('sharing');

  const snapPoints = useMemo(() => {
    if (sheetMode === 'user') return ['30%', '50%'];
    return ['45%', '75%'];
  }, [sheetMode]);

  const fetchLocations = useCallback(
    async ({
      syncState = false,
      silent = false,
    }: { syncState?: boolean; silent?: boolean } = {}) => {
      console.time('[Map Fetch]');
      if (!silent) setLoading(true);
      try {
        const lat = deviceLocation?.coords.latitude;
        const lon = deviceLocation?.coords.longitude;
        // console.log('[MapScreen] Fetching locations near:', lat, lon, 'Radius:', radius);
        const data = await getSharedLocationsAPI(lat, lon, radius);
        console.timeEnd('[Map Fetch]');

        if (Array.isArray(data)) {
          // console.log('[MapScreen] Fetched locations count:', data.length);
          setSharedLocations(data);
        } else {
          console.warn('[MapScreen] API returned non-array data:', data);
          setSharedLocations([]);
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

    let markerList = isFocusedMode
      ? []
      : sharedLocations
          .filter((loc) => loc && loc.user) // Robust check for missing user data
          .map((loc) => ({
            id: loc._id,
            lat: loc.latitude,
            lon: loc.longitude,
            title: loc.user.fullname,
            username: loc.user.username,
            fullname: loc.user.fullname,
            avatar: loc.user.avatar,
            isMe: loc.user._id === currentUser?._id,
            type: loc.type || 'live',
            lastUpdate: loc.lastUpdate || loc.updatedAt,
            postData: loc.postData,
            address: loc.address,
          }));

    // Add selected/static marker if it exists
    if (selectedLocation || isFocusedMode) {
      const pinLat = isFocusedMode ? route.params.lat : selectedLocation!.latitude;
      const pinLon = isFocusedMode ? route.params.lon : selectedLocation!.longitude;
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
        isMe: !isFocusedMode,
        type: isFocusedMode ? 'focused' : 'static',
        lastUpdate: new Date().toISOString(),
        postData: undefined,
        address: isFocusedMode ? route.params.address : undefined,
      });
    }
    console.log('[MapScreen] Final marker list size:', markerList.length);
    return markerList;
  }, [sharedLocations, selectedLocation, route.params, currentUser]);

  const updateMarkers = useCallback(() => {
    console.log('[MapScreen] updateMarkers called. LogRef:', !!webViewRef.current);
    // Safety check: ensure ref and method exist
    if (!webViewRef.current || !webViewRef.current.injectJavaScript) {
      // console.log("MapScreen: injectJavaScript not available in updateMarkers");
      return;
    }

    const markersData = markers.map((m) => ({
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
    }));

    console.log('[MapScreen] Injecting markers JSON length:', JSON.stringify(markersData).length);

    // Wrap in setTimeout to ensure execution on next tick
    setTimeout(() => {
      try {
        if (webViewRef.current?.injectJavaScript) {
          console.log('[MapScreen] Executing injectJavaScript updateMarkers');
          webViewRef.current.injectJavaScript(`updateMarkers(${JSON.stringify(markersData)})`);
        }
      } catch (err) {
        console.error('MapScreen: injectJavaScript failed in updateMarkers', err);
      }
    }, 0);
  }, [markers]);

  useEffect(() => {
    // Call updateMarkers whenever markers change.
    // Since map is always "ready" (static load), we can just try to update.
    updateMarkers();
  }, [updateMarkers]);

  // Calculate Initial Map State
  const initialMapState = useMemo(() => {
    const isFocused = route.params?.lat !== undefined && route.params?.lon !== undefined;
    let lat = 0,
      lon = 0,
      zoom = 2; // Default to world view

    if (isFocused) {
      lat = route.params.lat;
      lon = route.params.lon;
      zoom = 15;
    } else if (deviceLocation?.coords) {
      lat = deviceLocation.coords.latitude;
      lon = deviceLocation.coords.longitude;
      zoom = 13;
    }
    return { lat, lon, zoom };
  }, [route.params, deviceLocation]);

  const webViewSource = useMemo(
    () => ({
      html: getMapHtml(initialMapState.lat, initialMapState.lon, initialMapState.zoom),
    }),
    [initialMapState]
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

            if (!initialLoc) {
              console.error('❌ [MAP-DEBUG] No location returned!');
              Alert.alert(
                'Location Error',
                'Could not acquire a GPS lock. Please ensure you are outdoors or near a window, and check that high accuracy is enabled in your device settings.'
              );
            }
          } else {
            console.error('❌ [MAP-DEBUG] Permission denied! Status:', status);
            Alert.alert(
              'Permission Denied',
              'Permission to access location was denied. Showing global markers.'
            );
          }
        }

        // Handle deviceLocation state
        if (initialLoc) {
          setDeviceLocation(initialLoc);
        } else if (!deviceLocation) {
          // Fallback if permission denied or GPS failed
          setDeviceLocation({
            coords: { latitude: 0, longitude: 0, altitude: 0, accuracy: 0, heading: 0, speed: 0 },
            timestamp: Date.now(),
          } as any);
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

  // Trigger immediate fetch when radius or timePeriod/target changes
  useEffect(() => {
    const isFocusedMode = route.params?.lat !== undefined && route.params?.lon !== undefined;
    if (deviceLocation && !isFocusedMode) {
      // console.log('[MapScreen] Params changed (Radius/Period). Triggering immediate fetch.');
      fetchLocations();
    }
  }, [radius]);

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
      Alert.alert('Error', err.message);
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
      if (webViewRef.current?.injectJavaScript) {
        // Added safety check
        webViewRef.current.injectJavaScript(`
          map.setView([${deviceLocation.coords.latitude}, ${deviceLocation.coords.longitude}], 13);
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
            const coords = { latitude: data.lat, longitude: data.lon };
            setSelectedLocation(coords);
            setSharingType('static');
          } else if (data.type === 'marker-click') {
            setSelectedUser(data.userData);
            setSheetMode('user');
            bottomSheetRef.current?.snapToIndex(1);
          }
        } catch (e) {
          console.error('WebView message error:', e);
        }
      }, 0);
    },
    [route.params, deviceLocation]
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

  const getStatusColor = () => {
    if (sharingVisibility === 'off') return '#888';
    return sharingType === 'live' ? '#D4F637' : '#00A8FF';
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
            containerColor="#fff"
            iconColor="#000"
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
        <View style={styles.floatingControls}>
          <Menu
            visible={radiusMenuVisible}
            onDismiss={() => setRadiusMenuVisible(false)}
            anchor={
              <Button
                mode="contained"
                onPress={() => setRadiusMenuVisible(true)}
                style={styles.fab}
                buttonColor="#fff"
                textColor="#000"
                icon="radius-outline">
                {radius >= 10000 ? 'All' : `${radius}km`}
              </Button>
            }
            contentStyle={styles.radiusMenu}>
            <Menu.Item
              onPress={() => {
                setLoading(true);
                setRadius(20000);
                setRadiusMenuVisible(false);
              }}
              title="All"
              leadingIcon={radius >= 10000 ? 'check' : undefined}
            />
            <Menu.Item
              onPress={() => {
                setLoading(true);
                setRadius(5);
                setRadiusMenuVisible(false);
              }}
              title="5 km"
              leadingIcon={radius === 5 ? 'check' : undefined}
            />
            <Menu.Item
              onPress={() => {
                setLoading(true);
                setRadius(20);
                setRadiusMenuVisible(false);
              }}
              title="20 km"
              leadingIcon={radius === 20 ? 'check' : undefined}
            />
            <Menu.Item
              onPress={() => {
                setLoading(true);
                setRadius(50);
                setRadiusMenuVisible(false);
              }}
              title="50 km"
              leadingIcon={radius === 50 ? 'check' : undefined}
            />
            <Menu.Item
              onPress={() => {
                setLoading(true);
                setRadius(100);
                setRadiusMenuVisible(false);
              }}
              title="100 km"
              leadingIcon={radius === 100 ? 'check' : undefined}
            />
            <Menu.Item
              onPress={() => {
                setLoading(true);
                setRadius(500);
                setRadiusMenuVisible(false);
              }}
              title="500 km"
              leadingIcon={radius === 500 ? 'check' : undefined}
            />
          </Menu>

          <IconButton
            icon="crosshairs-gps"
            mode="contained"
            containerColor="#000"
            iconColor="#D4F637"
            size={24}
            onPress={resetToMyLocation}
            style={styles.fab}
          />
          <IconButton
            icon="share-variant"
            mode="contained"
            containerColor="#D4F637"
            iconColor="#000"
            size={24}
            onPress={handleOpenSharing}
            style={styles.fab}
          />
        </View>
      )}

      <BottomSheet
        ref={bottomSheetRef}
        index={-1}
        snapPoints={snapPoints}
        enablePanDownToClose
        onChange={setBottomSheetIndex}
        backdropComponent={renderBackdrop}
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
                      <Image
                        source={{ uri: selectedUser.postData.image }}
                        style={styles.postPreviewImage}
                      />
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
                    <ActivityIndicator size={12} color="#666" style={{ marginLeft: 8 }} />
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
              </View>

              <View style={styles.settingsActions}>
                <Button
                  mode="contained"
                  onPress={handleShareNow}
                  loading={loading}
                  style={styles.settingsActionBtn}
                  buttonColor="#D4F637"
                  textColor="#000"
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
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f0f0f0',
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
    backgroundColor: '#fff',
    borderRadius: 14,
    width: 44,
    height: 44,
    marginRight: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 4,
  },
  searchWrapper: {
    flex: 1,
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
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
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
    color: '#666',
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
    color: '#666',
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
  username: {
    color: '#666',
  },
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
    backgroundColor: '#D4F637',
  },
  postPreviewContainer: {
    marginTop: 15,
    backgroundColor: '#F8F9FA',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E9ECEF',
  },
  latestPostTitle: {
    marginBottom: 8,
    fontWeight: 'bold',
    color: '#495057',
  },
  postCardPreview: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  postPreviewImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
    backgroundColor: '#eee',
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
    backgroundColor: '#fff',
    borderRadius: 15,
    marginTop: -220, // Adjust to show above button
    paddingVertical: 5,
  },
});

export default MapScreen;
