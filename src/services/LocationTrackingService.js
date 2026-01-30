// src/services/LocationTrackingService.js
import * as Location from 'expo-location';
import * as TaskManager from 'expo-task-manager';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import ODOO_BASE_URL from '@api/config/odooConfig';

const LOCATION_UPDATE_INTERVAL = 30000; // 30 seconds
const BACKGROUND_LOCATION_TASK = 'background-location-task';

let locationSubscription = null;
let currentTrackingUserId = null;

// Define background location task (runs even when app is closed)
TaskManager.defineTask(BACKGROUND_LOCATION_TASK, async ({ data, error }) => {
  if (error) {
    console.error('[LocationTracking] Background task error:', error);
    return;
  }
  if (data) {
    const { locations } = data;
    const location = locations[0];

    if (location) {
      console.log('[LocationTracking] Background location update:', location.coords.latitude, location.coords.longitude);

      // Get stored user ID
      const userId = await AsyncStorage.getItem('tracking_user_id');
      if (userId) {
        let locationName = '';
        try {
          const reverseGeocode = await Location.reverseGeocodeAsync({
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
          });

          if (reverseGeocode && reverseGeocode.length > 0) {
            const address = reverseGeocode[0];
            const addressParts = [
              address.name,
              address.street,
              address.city,
            ].filter(Boolean);
            locationName = addressParts.join(', ');
          }
        } catch (e) {
          // Ignore reverse geocode errors
        }

        const locationData = {
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
          accuracy: location.coords.accuracy,
          locationName,
          timestamp: location.timestamp,
        };

        // Save to Odoo
        await saveUserLocationToOdoo(parseInt(userId), locationData);
      }
    }
  }
});

// Get Odoo auth headers
const getOdooAuthHeaders = async () => {
  const cookie = await AsyncStorage.getItem('odoo_cookie');
  return {
    'Content-Type': 'application/json',
    ...(cookie ? { Cookie: cookie } : {}),
  };
};

// Save location to Odoo
export const saveUserLocationToOdoo = async (userId, locationData) => {
  console.log('[LocationTracking] === SAVING LOCATION TO ODOO ===');
  console.log('[LocationTracking] User ID:', userId);
  console.log('[LocationTracking] Location Data:', JSON.stringify(locationData, null, 2));

  try {
    const headers = await getOdooAuthHeaders();
    console.log('[LocationTracking] Auth headers:', JSON.stringify(headers, null, 2));

    // First, check if user already has a location record
    console.log('[LocationTracking] Searching for existing record...');
    const searchResponse = await axios.post(
      `${ODOO_BASE_URL}/web/dataset/call_kw`,
      {
        jsonrpc: '2.0',
        method: 'call',
        params: {
          model: 'user.location',
          method: 'search_read',
          args: [[['user_id', '=', userId]]],
          kwargs: {
            fields: ['id'],
            limit: 1,
          },
        },
      },
      { headers }
    );

    console.log('[LocationTracking] Search response:', JSON.stringify(searchResponse.data, null, 2));

    const existingRecords = searchResponse.data?.result || [];

    // Format date for Odoo (YYYY-MM-DD HH:MM:SS)
    const formatDateForOdoo = (date) => {
      const d = new Date(date);
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      const hours = String(d.getHours()).padStart(2, '0');
      const minutes = String(d.getMinutes()).padStart(2, '0');
      const seconds = String(d.getSeconds()).padStart(2, '0');
      return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
    };

    const locationPayload = {
      user_id: userId,
      latitude: locationData.latitude,
      longitude: locationData.longitude,
      location_name: locationData.locationName || '',
      last_updated: formatDateForOdoo(new Date()),
      accuracy: locationData.accuracy || 0,
    };

    console.log('[LocationTracking] Location payload:', JSON.stringify(locationPayload, null, 2));

    if (existingRecords.length > 0) {
      // Update existing record
      console.log('[LocationTracking] Updating existing record ID:', existingRecords[0].id);
      const updateResponse = await axios.post(
        `${ODOO_BASE_URL}/web/dataset/call_kw`,
        {
          jsonrpc: '2.0',
          method: 'call',
          params: {
            model: 'user.location',
            method: 'write',
            args: [[existingRecords[0].id], locationPayload],
            kwargs: {},
          },
        },
        { headers }
      );
      console.log('[LocationTracking] ✅ UPDATE SUCCESS:', JSON.stringify(updateResponse.data, null, 2));
    } else {
      // Create new record
      console.log('[LocationTracking] Creating NEW record...');
      const createResponse = await axios.post(
        `${ODOO_BASE_URL}/web/dataset/call_kw`,
        {
          jsonrpc: '2.0',
          method: 'call',
          params: {
            model: 'user.location',
            method: 'create',
            args: [locationPayload],
            kwargs: {},
          },
        },
        { headers }
      );
      console.log('[LocationTracking] ✅ CREATE SUCCESS:', JSON.stringify(createResponse.data, null, 2));
    }

    console.log('[LocationTracking] =============================');
    return true;
  } catch (error) {
    console.error('[LocationTracking] ❌ ERROR saving location to Odoo:', error?.message || error);
    if (error.response) {
      console.error('[LocationTracking] Error response data:', JSON.stringify(error.response.data, null, 2));
      console.error('[LocationTracking] Error response status:', error.response.status);
    }
    console.log('[LocationTracking] =============================');
    return false;
  }
};

// Fetch user's current location from Odoo
export const fetchUserLocationFromOdoo = async (userId) => {
  console.log('[LocationTracking] Fetching location for user ID:', userId);
  console.log('[LocationTracking] Odoo URL:', ODOO_BASE_URL);

  try {
    const headers = await getOdooAuthHeaders();
    console.log('[LocationTracking] Request headers:', JSON.stringify(headers, null, 2));

    const requestBody = {
      jsonrpc: '2.0',
      method: 'call',
      params: {
        model: 'user.location',
        method: 'search_read',
        args: [[['user_id', '=', userId]]],
        kwargs: {
          fields: ['id', 'user_id', 'latitude', 'longitude', 'location_name', 'last_updated', 'accuracy'],
          limit: 1,
        },
      },
    };
    console.log('[LocationTracking] Request body:', JSON.stringify(requestBody, null, 2));

    const response = await axios.post(
      `${ODOO_BASE_URL}/web/dataset/call_kw`,
      requestBody,
      { headers }
    );

    console.log('[LocationTracking] Response:', JSON.stringify(response.data, null, 2));

    const locations = response.data?.result || [];
    if (locations.length > 0) {
      const loc = locations[0];
      const result = {
        userId: loc.user_id?.[0] || userId,
        userName: loc.user_id?.[1] || '',
        latitude: loc.latitude,
        longitude: loc.longitude,
        locationName: loc.location_name || '',
        lastUpdated: loc.last_updated,
        accuracy: loc.accuracy || 0,
      };
      console.log('[LocationTracking] Parsed location:', JSON.stringify(result, null, 2));
      return result;
    }
    console.log('[LocationTracking] No location records found for user:', userId);
    return null;
  } catch (error) {
    console.error('[LocationTracking] Error fetching location from Odoo:', error?.message || error);
    if (error.response) {
      console.error('[LocationTracking] Error response:', JSON.stringify(error.response.data, null, 2));
    }
    return null;
  }
};

// Fetch all users' locations from Odoo
export const fetchAllUsersLocationsFromOdoo = async () => {
  try {
    const headers = await getOdooAuthHeaders();

    const response = await axios.post(
      `${ODOO_BASE_URL}/web/dataset/call_kw`,
      {
        jsonrpc: '2.0',
        method: 'call',
        params: {
          model: 'user.location',
          method: 'search_read',
          args: [[]],
          kwargs: {
            fields: ['id', 'user_id', 'latitude', 'longitude', 'location_name', 'last_updated', 'accuracy'],
            order: 'last_updated desc',
          },
        },
      },
      { headers }
    );

    const locations = response.data?.result || [];
    return locations.map(loc => ({
      userId: loc.user_id?.[0],
      userName: loc.user_id?.[1] || '',
      latitude: loc.latitude,
      longitude: loc.longitude,
      locationName: loc.location_name || '',
      lastUpdated: loc.last_updated,
      accuracy: loc.accuracy || 0,
    }));
  } catch (error) {
    console.error('[LocationTracking] Error fetching all locations from Odoo:', error?.message || error);
    return [];
  }
};

// Get current location with reverse geocoding
export const getCurrentLocationWithAddress = async () => {
  try {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      console.log('[LocationTracking] Permission denied');
      return null;
    }

    // Use highest accuracy for best GPS precision
    const location = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.BestForNavigation,
      mayShowUserSettingsDialog: true,
    });

    let locationName = '';
    try {
      const reverseGeocode = await Location.reverseGeocodeAsync({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      });

      if (reverseGeocode && reverseGeocode.length > 0) {
        const address = reverseGeocode[0];
        const addressParts = [
          address.name,
          address.street,
          address.city,
          address.region,
        ].filter(Boolean);
        locationName = addressParts.join(', ');
      }
    } catch (e) {
      console.log('[LocationTracking] Reverse geocode failed:', e?.message);
    }

    return {
      latitude: location.coords.latitude,
      longitude: location.coords.longitude,
      accuracy: location.coords.accuracy,
      locationName,
      timestamp: location.timestamp,
    };
  } catch (error) {
    console.error('[LocationTracking] Error getting location:', error?.message || error);
    return null;
  }
};

// Start background location tracking (works even when app is closed)
export const startLocationTracking = async (userId) => {
  try {
    // Request foreground permission first
    const { status: foregroundStatus } = await Location.requestForegroundPermissionsAsync();
    if (foregroundStatus !== 'granted') {
      console.log('[LocationTracking] Foreground permission denied');
      return false;
    }

    // Request background permission (Android 10+ required for continuous tracking)
    const { status: backgroundStatus } = await Location.requestBackgroundPermissionsAsync();
    if (backgroundStatus !== 'granted') {
      console.log('[LocationTracking] Background permission denied - tracking will stop when app is closed');
      // Continue with foreground tracking only
    }

    // Store user ID for tracking (used by background task)
    currentTrackingUserId = userId;
    await AsyncStorage.setItem('tracking_user_id', userId.toString());

    // Get initial location and save to Odoo
    const initialLocation = await getCurrentLocationWithAddress();
    if (initialLocation) {
      await saveUserLocationToOdoo(userId, initialLocation);
    }

    // Check if background task is already registered
    const isRegistered = await TaskManager.isTaskRegisteredAsync(BACKGROUND_LOCATION_TASK);

    if (isRegistered) {
      console.log('[LocationTracking] Background task already registered, stopping previous...');
      await Location.stopLocationUpdatesAsync(BACKGROUND_LOCATION_TASK);
    }

    // Start background location updates (works even when app is closed)
    await Location.startLocationUpdatesAsync(BACKGROUND_LOCATION_TASK, {
      accuracy: Location.Accuracy.BestForNavigation,
      timeInterval: LOCATION_UPDATE_INTERVAL, // 30 seconds
      distanceInterval: 10, // Update if moved 10 meters
      foregroundService: {
        notificationTitle: 'Location Tracking Active',
        notificationBody: 'Your location is being tracked for staff monitoring',
        notificationColor: '#4285F4',
      },
    });

    console.log('[LocationTracking] Started BACKGROUND tracking for user:', userId);
    console.log('[LocationTracking] Updates every 30 seconds or 10 meters movement');
    return true;
  } catch (error) {
    console.error('[LocationTracking] Error starting tracking:', error?.message || error);
    return false;
  }
};

// Stop location tracking
export const stopLocationTracking = async () => {
  try {
    // Stop background location updates
    const isRegistered = await TaskManager.isTaskRegisteredAsync(BACKGROUND_LOCATION_TASK);
    if (isRegistered) {
      await Location.stopLocationUpdatesAsync(BACKGROUND_LOCATION_TASK);
      console.log('[LocationTracking] Stopped background task');
    }

    // Stop foreground subscription if exists
    if (locationSubscription) {
      locationSubscription.remove();
      locationSubscription = null;
    }

    // Clear stored user ID
    await AsyncStorage.removeItem('tracking_user_id');
    currentTrackingUserId = null;

    console.log('[LocationTracking] Stopped all tracking');
    return true;
  } catch (error) {
    console.error('[LocationTracking] Error stopping tracking:', error?.message || error);
    return false;
  }
};

// Check if tracking is active
export const isTrackingActive = async () => {
  try {
    const isRegistered = await TaskManager.isTaskRegisteredAsync(BACKGROUND_LOCATION_TASK);
    return isRegistered || locationSubscription !== null;
  } catch (error) {
    return locationSubscription !== null;
  }
};

// Get last known location (fetches from Odoo)
export const getLastKnownLocation = async () => {
  if (currentTrackingUserId) {
    return await fetchUserLocationFromOdoo(currentTrackingUserId);
  }
  return null;
};

export default {
  startLocationTracking,
  stopLocationTracking,
  isTrackingActive,
  getCurrentLocationWithAddress,
  getLastKnownLocation,
  saveUserLocationToOdoo,
  fetchUserLocationFromOdoo,
  fetchAllUsersLocationsFromOdoo,
};
