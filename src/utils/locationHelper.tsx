import * as ExpoLocation from 'expo-location';

export const getReadableAddress = async (latitude: number, longitude: number): Promise<string> => {
  try {
    const [place] = await ExpoLocation.reverseGeocodeAsync({ latitude, longitude });
    if (place) {
      const { name, city, region, country } = place;
      return [name, city, region, country].filter(Boolean).join(', ');
    }
    return 'Unknown location';
  } catch (err) {
    console.error('📍 Error getting readable address:', err);
    return 'Unknown location';
  }
};

export const shortenAddress = (address: string): string => {
  if (!address) return '';
  const parts = address.split(',').map((p) => p.trim());
  if (parts.length <= 2) return address;
  // Return last two parts (e.g., City, Country)
  return `${parts[parts.length - 2]}, ${parts[parts.length - 1]}`;
};

/**
 * Robustly fetches the current location.
 * 1. Tries to get the last known position for immediate result.
 * 2. If no position or it's old, tries to get the current position with balanced accuracy and a 15s timeout.
 */
export const getRobustLocation = async (): Promise<ExpoLocation.LocationObject | null> => {
  const startTime = Date.now();
  console.log('🌍 [LOCATION-DEBUG] ===== Starting Location Fetch =====');
  console.log('🌍 [LOCATION-DEBUG] Timestamp:', new Date().toISOString());

  try {
    // 0. Check if location services are enabled
    console.log('🌍 [LOCATION-DEBUG] Step 0: Checking if location services are enabled...');
    const enabled = await ExpoLocation.hasServicesEnabledAsync();
    console.log('🌍 [LOCATION-DEBUG] Location services enabled:', enabled);

    if (!enabled) {
      console.error('❌ [LOCATION-DEBUG] CRITICAL: Location services are DISABLED on device!');
      console.log('🌍 [LOCATION-DEBUG] User needs to enable GPS in Android settings');
      return null;
    }

    // 1. Try last known position first (recent)
    console.log('🌍 [LOCATION-DEBUG] Step 1: Attempting to get last known position...');
    let lastKnown: ExpoLocation.LocationObject | null = null;

    try {
      lastKnown = await ExpoLocation.getLastKnownPositionAsync({});
      console.log('🌍 [LOCATION-DEBUG] Last known position result:', lastKnown ? 'Found' : 'None');

      if (lastKnown) {
        const age = Date.now() - lastKnown.timestamp;
        console.log(
          '🌍 [LOCATION-DEBUG] Last known position age:',
          age + 'ms (' + Math.round(age / 1000) + 's)'
        );
        console.log('🌍 [LOCATION-DEBUG] Last known coords:', {
          lat: lastKnown.coords.latitude,
          lon: lastKnown.coords.longitude,
          accuracy: lastKnown.coords.accuracy,
        });

        if (age < 30000) {
          console.log('✅ [LOCATION-DEBUG] Using recent lastKnown position (< 30s old)');
          return lastKnown;
        } else {
          console.log('⚠️ [LOCATION-DEBUG] Last known position too old, will try fresh GPS');
        }
      }
    } catch (lastKnownError) {
      console.error('❌ [LOCATION-DEBUG] Error getting last known position:', lastKnownError);
    }

    // 2. Attempt 1: Balanced Accuracy
    console.log(
      '🌍 [LOCATION-DEBUG] Step 2: Attempting getCurrentPosition with Balanced accuracy...'
    );
    console.log('🌍 [LOCATION-DEBUG] Timeout: 10 seconds');

    const timeout1Start = Date.now();
    const timeout1 = new Promise<null>((resolve) =>
      setTimeout(() => {
        console.log('⏱️ [LOCATION-DEBUG] Attempt 1 timeout triggered after 10s');
        resolve(null);
      }, 10000)
    );

    const locationPromise1 = ExpoLocation.getCurrentPositionAsync({
      accuracy: ExpoLocation.Accuracy.Balanced,
    })
      .then((result) => {
        console.log(
          '✅ [LOCATION-DEBUG] Attempt 1 SUCCESS! Time taken:',
          Date.now() - timeout1Start + 'ms'
        );
        console.log('🌍 [LOCATION-DEBUG] Balanced coords:', {
          lat: result.coords.latitude,
          lon: result.coords.longitude,
          accuracy: result.coords.accuracy,
        });
        return result;
      })
      .catch((err) => {
        console.error('❌ [LOCATION-DEBUG] Attempt 1 ERROR:', err);
        throw err;
      });

    try {
      const result1 = await Promise.race([locationPromise1, timeout1]);
      if (result1) {
        console.log('🎉 [LOCATION-DEBUG] Returning Balanced accuracy result');
        return result1 as ExpoLocation.LocationObject;
      }
    } catch (err) {
      console.error('❌ [LOCATION-DEBUG] Attempt 1 exception caught:', err);
    }

    // 3. Attempt 2: Low Accuracy (Fallback for speed/difficult conditions)
    console.log('🌍 [LOCATION-DEBUG] Step 3: Attempting getCurrentPosition with Low accuracy...');
    console.log('🌍 [LOCATION-DEBUG] Timeout: 7 seconds');

    const timeout2Start = Date.now();
    const timeout2 = new Promise<null>((resolve) =>
      setTimeout(() => {
        console.log('⏱️ [LOCATION-DEBUG] Attempt 2 timeout triggered after 7s');
        resolve(null);
      }, 7000)
    );

    const locationPromise2 = ExpoLocation.getCurrentPositionAsync({
      accuracy: ExpoLocation.Accuracy.Low,
    })
      .then((result) => {
        console.log(
          '✅ [LOCATION-DEBUG] Attempt 2 SUCCESS! Time taken:',
          Date.now() - timeout2Start + 'ms'
        );
        console.log('🌍 [LOCATION-DEBUG] Low accuracy coords:', {
          lat: result.coords.latitude,
          lon: result.coords.longitude,
          accuracy: result.coords.accuracy,
        });
        return result;
      })
      .catch((err) => {
        console.error('❌ [LOCATION-DEBUG] Attempt 2 ERROR:', err);
        throw err;
      });

    try {
      const result2 = await Promise.race([locationPromise2, timeout2]);
      if (result2) {
        console.log('🎉 [LOCATION-DEBUG] Returning Low accuracy result');
        return result2 as ExpoLocation.LocationObject;
      }
    } catch (err) {
      console.error('❌ [LOCATION-DEBUG] Attempt 2 exception caught:', err);
    }

    // 4. Final Fallback: Any Last Known position
    console.log(
      '🌍 [LOCATION-DEBUG] Step 4: Both fresh GPS attempts failed, checking lastKnown fallback...'
    );
    if (lastKnown) {
      const age = Date.now() - lastKnown.timestamp;
      console.log('⚠️ [LOCATION-DEBUG] Using stale lastKnown as final fallback');
      console.log('🌍 [LOCATION-DEBUG] Age:', age + 'ms (' + Math.round(age / 1000) + 's)');
      return lastKnown;
    }

    console.error('❌ [LOCATION-DEBUG] TOTAL FAILURE: All location fetch attempts failed!');
    console.log('🌍 [LOCATION-DEBUG] Total time elapsed:', Date.now() - startTime + 'ms');
    console.log('🌍 [LOCATION-DEBUG] ===== Location Fetch FAILED =====');
    return null;
  } catch (error) {
    console.error('💥 [LOCATION-DEBUG] CRITICAL ERROR in getRobustLocation:', error);
    console.error('💥 [LOCATION-DEBUG] Error type:', typeof error);
    console.error(
      '💥 [LOCATION-DEBUG] Error message:',
      error instanceof Error ? error.message : String(error)
    );
    console.log('🌍 [LOCATION-DEBUG] Total time elapsed:', Date.now() - startTime + 'ms');
    console.log('🌍 [LOCATION-DEBUG] ===== Location Fetch CRASHED =====');
    return null;
  }
};
