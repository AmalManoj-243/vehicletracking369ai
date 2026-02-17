// Cancel a vehicle tracking trip in Odoo by updating trip_cancel to true
export const cancelVehicleTrackingTripOdoo = async ({ tripId, username = 'admin', password = 'admin', db = DEFAULT_VEHICLE_TRACKING_DB } = {}) => {
  const baseUrl = (VEHICLE_TRACKING_BASE_URL || '').replace(/\/$/, '');
  if (!tripId) {
    throw new Error('Trip ID is required to cancel a trip');
  }
  const payload = { trip_cancel: true, start_trip: false };
  console.log('[cancelVehicleTrackingTripOdoo] Payload sent to Odoo:', { id: tripId, ...payload });
  try {
    // Step 1: Authenticate to Odoo
    const loginResp = await loginVehicleTrackingOdoo({ username, password, db });
    // Step 2: Update trip record via JSON-RPC (write method)
    const headers = await getOdooAuthHeaders();
    if (loginResp && loginResp.cookies) headers.Cookie = loginResp.cookies;
    const response = await axios.post(
      `${baseUrl}/web/dataset/call_kw`,
      {
        jsonrpc: '2.0',
        method: 'call',
        params: {
          model: 'vehicle.tracking',
          method: 'write',
          args: [[tripId], payload],
          kwargs: {},
        },
      },
      {
        headers,
        withCredentials: true,
        timeout: 15000,
      }
    );
    if (response.data.error) {
      console.error('Odoo JSON-RPC error (cancel trip):', response.data.error);
      throw new Error('Odoo JSON-RPC error');
    }
    return response.data.result;
  } catch (error) {
    console.error('cancelVehicleTrackingTripOdoo error:', error?.message || error);
    if (error && error.response) {
      console.error('cancelVehicleTrackingTripOdoo response status:', error.response.status);
      try { console.error('cancelVehicleTrackingTripOdoo response data:', error.response.data); } catch (e) {}
    }
    throw error;
  }
};
// Fetch vehicle tracking trips from Odoo using JSON-RPC, filtered by date
// Fetch vehicle tracking trips from Odoo using JSON-RPC, filtered by date and vehicle_id
export const fetchVehicleTrackingTripsOdoo = async (params = {}) => {
  // Accept either `vehicleId` or `vehicle_id` to be backward-compatible with callers
  const { date, vehicleId: vIdFromCamel, offset = 0, limit = 50 } = params;
  const vehicleIdRaw = params.vehicleId ?? params.vehicle_id ?? vIdFromCamel;
  const vehicleId = vehicleIdRaw != null && vehicleIdRaw !== '' ? (Number.isNaN(Number(vehicleIdRaw)) ? undefined : Number(vehicleIdRaw)) : undefined;
  try {
    // Filter by date and vehicleId if provided (Odoo often stores `date` as datetime)
    // Use a date range (start/end of day) so comparisons match datetime values
    let domain = [];
    if (date) {
      const startOfDay = `${date} 00:00:00`;
      const endOfDay = `${date} 23:59:59`;
      domain.push(["date", ">=", startOfDay]);
      domain.push(["date", "<=", endOfDay]);
    }
    if (typeof vehicleId !== 'undefined') {
      domain.push(["vehicle_id", "=", vehicleId]);
    }
    const headers = await getOdooAuthHeaders();
    const response = await axios.post(
      `${ODOO_BASE_URL}/web/dataset/call_kw`,
      {
        jsonrpc: "2.0",
        method: "call",
        params: {
          model: "vehicle.tracking",
          method: "search_read",
          args: [domain],
          kwargs: {
            fields: [
              "id", "vehicle_id", "driver_id", "date", "number_plate", "start_km", "end_km", "start_trip", "end_trip", "source_id", "destination_id",
              "coolant_water", "oil_checking", "tyre_checking", "battery_checking", "fuel_checking", "daily_checks", "purpose_of_visit_id", "estimated_time",
              "start_latitude", "start_longitude", "trip_cancel"
            ],
            offset,
            limit,
            order: "date desc",
          },
        },
      },
      { headers }
    );
    if (response.data.error) {
      console.log("Odoo JSON-RPC error (vehicle.tracking):", response.data.error);
      throw new Error("Odoo JSON-RPC error");
    }
    const trips = response.data.result || [];
    
    // Filter out cancelled trips and properly handle many2one fields
    return trips
      .filter(trip => !trip.trip_cancel)
      .map(trip => ({
        estimated_time: trip.estimated_time || '',
        id: trip.id,
        // ✅ Fix: Handle many2one fields properly (they return [id, name] or false)
        vehicle_id: Array.isArray(trip.vehicle_id) ? trip.vehicle_id[0] : (trip.vehicle_id ? trip.vehicle_id : null),
        vehicle_name: Array.isArray(trip.vehicle_id) ? trip.vehicle_id[1] : '',
        driver_id: Array.isArray(trip.driver_id) ? trip.driver_id[0] : (trip.driver_id ? trip.driver_id : null),
        driver_name: Array.isArray(trip.driver_id) ? trip.driver_id[1] : '',
        date: trip.date,
        number_plate: trip.number_plate,
        start_km: trip.start_km,
        end_km: trip.end_km,
        start_trip: trip.start_trip,
        end_trip: trip.end_trip,
        source_id: Array.isArray(trip.source_id) ? trip.source_id[0] : (trip.source_id ? trip.source_id : null),
        source_name: Array.isArray(trip.source_id) ? trip.source_id[1] : '',
        destination_id: Array.isArray(trip.destination_id) ? trip.destination_id[0] : (trip.destination_id ? trip.destination_id : null),
        destination_name: Array.isArray(trip.destination_id) ? trip.destination_id[1] : '',
        vehicleChecklist: {
          coolentWater: trip.coolant_water || false,
          oilChecking: trip.oil_checking || false,
          tyreChecking: trip.tyre_checking || false,
          batteryChecking: trip.battery_checking || false,
          fuelChecking: trip.fuel_checking || false,
          dailyChecks: trip.daily_checks || false,
        },
        purpose_of_visit: Array.isArray(trip.purpose_of_visit_id) ? trip.purpose_of_visit_id[1] : '',
        pre_trip_litres: typeof trip.pre_trip_litres !== 'undefined' ? trip.pre_trip_litres : '',
        start_latitude: typeof trip.start_latitude !== 'undefined' ? trip.start_latitude : '',
        start_longitude: typeof trip.start_longitude !== 'undefined' ? trip.start_longitude : '',
        trip_cancel: trip.trip_cancel || false,
      }));
  } catch (error) {
    console.error("Error fetching vehicle tracking trips from Odoo:", error);
    throw error;
  }
};

// Fetch sources (locations) from Odoo using JSON-RPC (vehicle.location model)
export const fetchSourcesOdoo = async ({ offset = 0, limit = 50, searchText = "" } = {}) => {
  try {
    let domain = [];
    if (searchText && searchText.trim() !== "") {
      const term = searchText.trim();
      domain = [["name", "ilike", term]]; // Filter by location name
    }
    const headers = await getOdooAuthHeaders();
    const response = await axios.post(
      `${ODOO_BASE_URL}/web/dataset/call_kw`,
      {
        jsonrpc: "2.0",
        method: "call",
        params: {
          model: "vehicle.location",
          method: "search_read",
          args: [domain],
          kwargs: {
            fields: ["id", "name", "latitude", "longitude"],
            offset,
            limit,
            order: "name asc",
          },
        },
      },
      { headers }
    );
    if (response.data.error) {
      console.log("Odoo JSON-RPC error (sources):", response.data.error);
      throw new Error("Odoo JSON-RPC error");
    }
    const sources = response.data.result || [];
    return sources.map(source => ({
      _id: source.id,
      name: source.name || "",
      latitude: source.latitude || null,
      longitude: source.longitude || null,
    }));
  } catch (error) {
    console.error("Error fetching sources from Odoo:", error);
    throw error;
  }
};
// Create vehicle tracking trip in Odoo (test-vehicle DB) using JSON-RPC
// Create vehicle tracking trip in Odoo (test-vehicle DB) using JSON-RPC
export const createVehicleTrackingTripOdoo = async ({ payload, username = 'admin', password = 'admin', db = DEFAULT_VEHICLE_TRACKING_DB } = {}) => {
  const baseUrl = (VEHICLE_TRACKING_BASE_URL || '').replace(/\/$/, '');
  // Defensive: ensure payload is a valid object
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
    console.error('createVehicleTrackingTripOdoo: Invalid payload', payload);
    throw new Error('Trip payload is invalid (must be a non-null object)');
  }
  // Ensure vehicle_id is present for updates
  if (typeof payload.id !== 'undefined' && (typeof payload.vehicle_id === 'undefined' || payload.vehicle_id === null || payload.vehicle_id === '')) {
    console.warn('createVehicleTrackingTripOdoo: vehicle_id is missing in update payload. This will result in missing vehicle info for the trip.');
  }
  // Log payload before sending
  console.log('createVehicleTrackingTripOdoo: Sending payload to Odoo:', payload);
  try {
    // Step 1: Authenticate to Odoo
    const loginResp = await loginVehicleTrackingOdoo({ username, password, db });
    // Build trip payload by removing fields that belong to vehicle.fuel.log or are invalid for vehicle.tracking
    const tripPayload = { ...payload };
    
    // ✅ FIX: Convert many2one field IDs to integers BEFORE removing fuel fields
    if (tripPayload.vehicle_id) {
      tripPayload.vehicle_id = typeof tripPayload.vehicle_id === 'string' 
        ? parseInt(tripPayload.vehicle_id, 10) 
        : tripPayload.vehicle_id;
    }
    
    if (tripPayload.driver_id) {
      tripPayload.driver_id = typeof tripPayload.driver_id === 'string'
        ? parseInt(tripPayload.driver_id, 10)
        : tripPayload.driver_id;
    }
    
    if (tripPayload.source_id) {
      tripPayload.source_id = typeof tripPayload.source_id === 'string'
        ? parseInt(tripPayload.source_id, 10)
        : tripPayload.source_id;
    }
    
    if (tripPayload.destination_id) {
      tripPayload.destination_id = typeof tripPayload.destination_id === 'string'
        ? parseInt(tripPayload.destination_id, 10)
        : tripPayload.destination_id;
    }
    
    if (tripPayload.purpose_of_visit_id) {
      tripPayload.purpose_of_visit_id = typeof tripPayload.purpose_of_visit_id === 'string'
        ? parseInt(tripPayload.purpose_of_visit_id, 10)
        : tripPayload.purpose_of_visit_id;
    }
    
    const removeKeys = [
      'fuel_amount', 'fuel_liters', 'fuel_litres', 'invoice_number', 'odometer_image',
      'odometer_image_filename', 'odometer_image_uri', 'current_odometer',
      'post_trip_amount', 'post_trip_litres', 'end_fuel_document', 'pre_trip_litres'
    ];
    removeKeys.forEach(k => { if (k in tripPayload) delete tripPayload[k]; });
    // Debug: show sanitized trip payload that will be sent to Odoo (should include image_url if provided)
    console.log('createVehicleTrackingTripOdoo: Sanitized tripPayload:', JSON.stringify(tripPayload));

    // Step 2: Create or update trip record via JSON-RPC
    const headers = await getOdooAuthHeaders();
    if (loginResp && loginResp.cookies) headers.Cookie = loginResp.cookies;

    let tripId;
    
    // If payload includes an `id`, perform an update (write) on that record
    if (tripPayload && (typeof tripPayload.id !== 'undefined')) {
      const recordId = tripPayload.id;
      // Remove id from payload before sending write
      const { id: _remove, ...updatePayload } = tripPayload;
      
      // CRITICAL: Validate vehicle_id is present in update
      if (!updatePayload.vehicle_id) {
        console.error('[createVehicleTrackingTripOdoo] CRITICAL WARNING: vehicle_id is missing from update payload!', {
          payload_vehicle_id: payload.vehicle_id,
          tripPayload_vehicle_id: tripPayload.vehicle_id,
          updatePayload_vehicle_id: updatePayload.vehicle_id,
        });
      } else {
        console.log('[createVehicleTrackingTripOdoo] Update payload includes vehicle_id:', updatePayload.vehicle_id, 'type:', typeof updatePayload.vehicle_id);
      }
      
      try {
        const resp = await axios.post(
          `${baseUrl}/web/dataset/call_kw`,
          {
            jsonrpc: '2.0',
            method: 'call',
            params: {
              model: 'vehicle.tracking',
              method: 'write',
              args: [[recordId], updatePayload],
              kwargs: {},
            },
          },
          { headers, withCredentials: true, timeout: 15000 }
        );
        if (resp.data.error) {
          console.error('Odoo JSON-RPC error (update trip):', resp.data.error);
          throw new Error('Odoo JSON-RPC error');
        }
        // On success, return the id that was updated
        console.log('Odoo updateVehicleTrackingTripOdoo wrote id:', recordId);
        tripId = recordId;
      } catch (err) {
        console.error('Odoo updateVehicleTrackingTripOdoo error:', err);
        throw err;
      }
    } else {
      // Create new record
      const response = await axios.post(
        `${baseUrl}/web/dataset/call_kw`,
        {
          jsonrpc: '2.0',
          method: 'call',
          params: {
            model: 'vehicle.tracking',
            method: 'create',
            args: [[tripPayload]],
            kwargs: {},
          },
        },
        {
          headers,
          withCredentials: true,
          timeout: 15000,
        }
      );
      if (response.data.error) {
        console.error('Odoo JSON-RPC error (create trip):', response.data.error);
        throw new Error('Odoo JSON-RPC error');
      }
      const tripIdRaw = response.data.result;
      tripId = Array.isArray(tripIdRaw) ? tripIdRaw[0] : (Number.isFinite(Number(tripIdRaw)) ? Number(Number(tripIdRaw)) : tripIdRaw);
      console.log('Odoo createVehicleTrackingTripOdoo response tripIdRaw:', JSON.stringify(tripIdRaw), 'normalized tripId:', tripId);
    }

    // If payload included fuel details, map them to vehicle.fuel.log and create a record
    try {
      const hasFuel = payload && (payload.fuel_amount || payload.fuel_liters || payload.fuel_litres || payload.current_odometer);
      if (hasFuel) {
        const fuelPayload = {
          vehicle_tracking_id: tripId,
          vehicle_id: payload.vehicle_id ? (Number(payload.vehicle_id) || payload.vehicle_id) : undefined,
          driver_id: payload.driver_id ? (Number(payload.driver_id) || payload.driver_id) : undefined,
          name: payload.invoice_number || undefined,
          amount: payload.fuel_amount ? Number(payload.fuel_amount) : (payload.amount ? Number(payload.amount) : undefined),
          fuel_level: payload.fuel_liters ? Number(payload.fuel_liters) : (payload.fuel_litres ? Number(payload.fuel_litres) : undefined),
          odometer: payload.current_odometer ? Number(payload.current_odometer) : undefined,
          gps_lat: payload.start_latitude ?? payload.gps_lat ?? undefined,
          gps_long: payload.start_longitude ?? payload.gps_long ?? undefined,
        };
        // If an odometer image URI exists, set filename and try to include binary (base64)
        if (payload.odometer_image) {
          try {
            const parts = payload.odometer_image.split('/');
            fuelPayload.odometer_image_filename = parts[parts.length - 1];
            // Attempt to read the local file and include as base64 so Odoo saves the image
            try {
              const uri = payload.odometer_image;
              if (uri && (uri.startsWith('file://') || uri.startsWith('/'))) {
                const b64 = await FileSystem.readAsStringAsync(uri, { encoding: FileSystem.EncodingType.Base64 });
                if (b64 && b64.length > 0) {
                  fuelPayload.odometer_image = b64; // Odoo expects raw base64
                  console.log('Attached odometer image base64 length:', b64.length);
                }
              }
            } catch (readErr) {
              console.warn('Could not read odometer image file for upload:', readErr?.message || readErr);
            }
          } catch (e) {}
        }

        // Clean undefined keys
        Object.keys(fuelPayload).forEach(k => fuelPayload[k] === undefined && delete fuelPayload[k]);

        if (Object.keys(fuelPayload).length > 1) {
          // log payload for debugging
          console.log('Creating vehicle.fuel.log with payload:', JSON.stringify(fuelPayload));
          // create vehicle.fuel.log
          const fuelResp = await axios.post(
            `${baseUrl}/web/dataset/call_kw`,
            {
              jsonrpc: '2.0',
              method: 'call',
              params: {
                model: 'vehicle.fuel.log',
                method: 'create',
                args: [[fuelPayload]],
                kwargs: {},
              },
            },
            { headers, withCredentials: true, timeout: 15000 }
          );
          // Log full response for visibility
          try {
            console.log('vehicle.fuel.log create response:', JSON.stringify(fuelResp.data));
          } catch (e) {
            console.log('vehicle.fuel.log create response (non-json)');
          }
          if (fuelResp.data && fuelResp.data.result) {
            console.log('vehicle.fuel.log created id:', fuelResp.data.result);
          } else if (fuelResp.data && fuelResp.data.error) {
            console.warn('vehicle.fuel.log creation error:', fuelResp.data.error);
          }
        }
      }
    } catch (e) {
      console.warn('Failed to create vehicle.fuel.log:', e?.message || e);
    }

    // Read back the created trip record to verify fields like `image_url` and `vehicle_id` were saved
    try {
      const readResp = await axios.post(
        `${baseUrl}/web/dataset/call_kw`,
        {
          jsonrpc: '2.0',
          method: 'call',
          params: {
            model: 'vehicle.tracking',
            method: 'search_read',
            args: [[['id', '=', tripId]]],
            kwargs: { fields: ['id', 'image_url', 'number_plate', 'date', 'vehicle_id', 'driver_id'] },
          },
        },
        { headers, withCredentials: true, timeout: 15000 }
      );
      if (readResp.data && Array.isArray(readResp.data.result) && readResp.data.result.length > 0) {
        console.log('Readback vehicle.tracking record after create/update:', JSON.stringify(readResp.data.result[0]));
      } else {
        console.log('No readback result for created vehicle.tracking. Response:', JSON.stringify(readResp.data));
      }
    } catch (readErr) {
      console.warn('Failed to read back created vehicle.tracking record:', readErr?.message || readErr);
    }

    return tripId;
  } catch (error) {
    console.error('createVehicleTrackingTripOdoo error:', error?.message || error);
    if (error && error.response) {
      console.error('createVehicleTrackingTripOdoo response status:', error.response.status);
      try { console.error('createVehicleTrackingTripOdoo response data:', error.response.data); } catch (e) {}
    }
    throw error;
  }
  
};
// api/services/generalApi.js
import axios from "axios";
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system';
import ODOO_BASE_URL, { DEFAULT_ODOO_DB, DEFAULT_USERNAME, DEFAULT_PASSWORD } from '@api/config/odooConfig';
import VEHICLE_TRACKING_BASE_URL, { DEFAULT_VEHICLE_TRACKING_DB } from '@api/config/vehicleTrackingConfig';
// Helper: Authenticate to vehicle tracking Odoo DB and return session cookie
export const loginVehicleTrackingOdoo = async ({ username = 'admin', password = 'admin', db = DEFAULT_VEHICLE_TRACKING_DB } = {}) => {
  const baseUrl = (VEHICLE_TRACKING_BASE_URL || '').replace(/\/$/, '');
  // If a cookie for an already-logged-in Odoo session is stored, reuse it
  try {
    const stored = await AsyncStorage.getItem('odoo_cookie');
    if (stored) {
      return { session_id: null, cookies: stored };
    }
  } catch (e) {
    // ignore and continue to authenticate
  }
  try {
    const response = await axios.post(
      `${baseUrl}/web/session/authenticate`,
      {
        jsonrpc: '2.0',
        method: 'call',
        params: {
          db,
          login: username,
          password,
        },
      },
      { headers: { 'Content-Type': 'application/json' }, withCredentials: true }
    );
    if (response.data.error) {
      console.error('VehicleTracking Odoo login error:', response.data.error);
      throw new Error('VehicleTracking Odoo login error');
    }
    // Extract session cookie from response
    const setCookie = response.headers['set-cookie'] || response.headers['Set-Cookie'];
    // For React Native, axios may not expose cookies directly; use withCredentials and rely on cookie persistence
    // Return axios instance with cookie if possible
    try {
      if (setCookie) {
        const cookieStr = Array.isArray(setCookie) ? setCookie.join('; ') : String(setCookie);
        await AsyncStorage.setItem('odoo_cookie', cookieStr);
        return { session_id: response.data.result && response.data.result.session_id, cookies: cookieStr };
      }
    } catch (e) {
      console.warn('Unable to persist vehicle tracking login cookie:', e?.message || e);
    }
    return { session_id: response.data.result && response.data.result.session_id, cookies: setCookie };
  } catch (error) {
    console.error('loginVehicleTrackingOdoo error:', error);
    throw error;
  }
};

// Helper: read stored odoo_cookie and return headers object
const getOdooAuthHeaders = async () => {
  try {
    const cookie = await AsyncStorage.getItem('odoo_cookie');
    const headers = { 'Content-Type': 'application/json' };
    if (cookie) headers.Cookie = cookie;
    return headers;
  } catch (e) {
    return { 'Content-Type': 'application/json' };
  }
};


import { get } from "./utils";
import { API_ENDPOINTS } from "@api/endpoints";
import { useAuthStore } from '@stores/auth';
import handleApiError from "../utils/handleApiError";

// Debugging output for useAuthStore
export const fetchProducts = async ({ offset, limit, categoryId, searchText }) => {
  try {
    const queryParams = {
      ...(searchText !== undefined && { product_name: searchText }),
      offset,
      limit,
      ...(categoryId !== undefined && { category_id: categoryId }),
    };
    // Debugging output for queryParams
    const response = await get(API_ENDPOINTS.VIEW_PRODUCTS, queryParams);
    return response.data;
  } catch (error) {
    handleApiError(error);
    throw error;
  }
};



// 🔹 NEW: Fetch products directly from Odoo 19 via JSON-RPC
export const fetchProductsOdoo = async ({ offset, limit, searchText, categoryId } = {}) => {
  try {
    // Base domain: active salable products
    let domain = [["sale_ok", "=", true]];

    // Filter by category if provided
    if (categoryId) {
      domain = ["&", ["sale_ok", "=", true], ["categ_id", "=", Number(categoryId)]];
    }

    if (searchText && searchText.trim() !== "") {
      const term = searchText.trim();
      if (categoryId) {
        domain = ["&", "&", ["sale_ok", "=", true], ["categ_id", "=", Number(categoryId)], ["name", "ilike", term]];
      } else {
        domain = ["&", ["sale_ok", "=", true], ["name", "ilike", term]];
      }
    }

    const odooLimit = limit || 50;
    const headers = await getOdooAuthHeaders();
    const response = await axios.post(
      `${ODOO_BASE_URL}/web/dataset/call_kw`,  // same server as login
      {
        jsonrpc: "2.0",
        method: "call",
        params: {
          model: "product.product",
          method: "search_read",
          args: [],
          kwargs: {
            domain,
            fields: [
              "id",
              "name",
              "list_price",   // selling price
              "default_code", // internal reference
              "uom_id",       // many2one [id, name]
              "image_128",    // product image
            ],
            limit: odooLimit,
            order: "name asc",
          },
        },
      },
      { headers }
    );

    if (response.data.error) {
      console.log("Odoo JSON-RPC error (products):", response.data.error);
      throw new Error("Odoo JSON-RPC error");
    }

    const products = response.data.result || [];

    // 🔹 Shape to match existing ProductsList expectations
    return products.map((p) => {
      // If Odoo returned the image as base64 (image_128), prefer using a data URI
      const hasBase64 = p.image_128 && typeof p.image_128 === 'string' && p.image_128.length > 0;
      const baseUrl = (ODOO_BASE_URL || '').replace(/\/$/, '');
      const imageUrl = hasBase64
        ? `data:image/png;base64,${p.image_128}`
        : `${baseUrl}/web/image?model=product.product&id=${p.id}&field=image_128`;

      return {
        id: p.id,
        product_name: p.name || "",
        image_url: imageUrl,
        price: p.list_price || 0,
        code: p.default_code || "",
        uom: p.uom_id
          ? { uom_id: p.uom_id[0], uom_name: p.uom_id[1] }
          : null,
      };
    });
  } catch (error) {
    console.error("fetchProductsOdoo error:", error);
    throw error;
  }
};

// Fetch product by barcode from Odoo
export const fetchProductByBarcodeOdoo = async (barcode) => {
  try {
    const headers = await getOdooAuthHeaders();
    const response = await axios.post(
      `${ODOO_BASE_URL}/web/dataset/call_kw`,
      {
        jsonrpc: "2.0",
        method: "call",
        params: {
          model: "product.product",
          method: "search_read",
          args: [],
          kwargs: {
            domain: [["barcode", "=", barcode]],
            fields: [
              "id",
              "name",
              "list_price",
              "default_code",
              "barcode",
              "uom_id",
              "image_128",
              "categ_id",
            ],
            limit: 1,
          },
        },
      },
      { headers }
    );

    if (response.data.error) {
      throw new Error("Odoo JSON-RPC error");
    }

    const products = response.data.result || [];
    return products.map((p) => {
      const hasBase64 = p.image_128 && typeof p.image_128 === 'string' && p.image_128.length > 0;
      const baseUrl = (ODOO_BASE_URL || '').replace(/\/$/, '');
      const imageUrl = hasBase64
        ? `data:image/png;base64,${p.image_128}`
        : `${baseUrl}/web/image?model=product.product&id=${p.id}&field=image_128`;

      return {
        id: p.id,
        product_name: p.name || "",
        image_url: imageUrl,
        price: p.list_price || 0,
        code: p.default_code || "",
        barcode: p.barcode || "",
        category: p.categ_id ? p.categ_id[1] : "",
        uom: p.uom_id ? { uom_id: p.uom_id[0], uom_name: p.uom_id[1] } : null,
      };
    });
  } catch (error) {
    console.error("fetchProductByBarcodeOdoo error:", error);
    throw error;
  }
};

// Fetch users from Odoo using JSON-RPC (res.users model)
export const fetchUsersOdoo = async ({ offset = 0, limit = 50, searchText = "" } = {}) => {
  try {
    let domain = [["active", "=", true]];
    if (searchText && searchText.trim() !== "") {
      const term = searchText.trim();
      domain = ["&", ["active", "=", true], ["name", "ilike", term]];
    }

    const headers = await getOdooAuthHeaders();
    const response = await axios.post(
      `${ODOO_BASE_URL}/web/dataset/call_kw`,
      {
        jsonrpc: "2.0",
        method: "call",
        params: {
          model: "res.users",
          method: "search_read",
          args: [domain],
          kwargs: {
            fields: ["id", "name", "login", "email", "partner_id", "image_128"],
            offset,
            limit,
            order: "name asc",
          },
        },
      },
      { headers }
    );

    if (response.data.error) {
      console.log("Odoo JSON-RPC error (users):", response.data.error);
      throw new Error("Odoo JSON-RPC error");
    }

    const users = response.data.result || [];

    return users.map((u) => ({
      id: u.id,
      _id: u.id,
      name: u.name || "",
      login: u.login || "",
      email: u.email || "",
      partner_id: u.partner_id ? { id: u.partner_id[0], name: u.partner_id[1] } : null,
      image_url: u.image_128 && typeof u.image_128 === 'string' && u.image_128.length > 0
        ? `data:image/png;base64,${u.image_128}`
        : null,
    }));
  } catch (error) {
    console.error("fetchUsersOdoo error:", error);
    throw error;
  }
};

// src/api/services/generalApi.js
// Ensure this points to your Odoo URL

// Fetch categories directly from Odoo using JSON-RPC
export const fetchCategoriesOdoo = async ({ offset = 0, limit = 50, searchText = "" } = {}) => {
  try {
    let domain = [];
    if (searchText && searchText.trim() !== "") {
      const term = searchText.trim();
      domain = [["name", "ilike", term]];
    }

    const headers = await getOdooAuthHeaders();
    const response = await axios.post(
      `${ODOO_BASE_URL}/web/dataset/call_kw`,
      {
        jsonrpc: "2.0",
        method: "call",
        params: {
          model: "product.category",
          method: "search_read",
          args: [domain],
          kwargs: {
            fields: ["id", "name", "parent_id", "image_128", "sequence_no"],
            offset,
            limit,
            order: "name asc",
          },
        },
      },
      { headers }
    );

    if (response.data.error) {
      console.log("Odoo JSON-RPC error (categories):", response.data.error);
      throw new Error("Odoo JSON-RPC error");
    }

    const categories = response.data.result || [];

    const baseUrl = (ODOO_BASE_URL || '').replace(/\/$/, '');
    const mapped = categories.map((c) => {
      const hasBase64 = c.image_128 && typeof c.image_128 === 'string' && c.image_128.length > 0;
      const imageUrl = hasBase64
        ? `data:image/png;base64,${c.image_128}`
        : `${baseUrl}/web/image?model=product.category&id=${c.id}&field=image_128`;
      const seq = c.sequence_no && c.sequence_no !== false ? parseInt(c.sequence_no, 10) : null;
      return {
        _id: c.id,
        name: c.name || "",
        category_name: c.name || "",
        image_url: imageUrl,
        parent_id: c.parent_id ? { id: c.parent_id[0], name: c.parent_id[1] } : null,
        sequence_no: isNaN(seq) ? null : seq,
      };
    });
    // Sort: sequenced categories first (by sequence number), then unsequenced alphabetically
    mapped.sort((a, b) => {
      const aHas = a.sequence_no !== null;
      const bHas = b.sequence_no !== null;
      if (aHas && bHas) return a.sequence_no - b.sequence_no;
      if (aHas) return -1;
      if (bHas) return 1;
      return a.name.localeCompare(b.name);
    });
    return mapped;
  } catch (error) {
    console.error("fetchCategoriesOdoo error:", error);
    throw error;
  }
};

// Fetch detailed product information for a single Odoo product id
export const fetchProductDetailsOdoo = async (productId) => {
  try {
    if (!productId) return null;

    // 1. Fetch product details
    const headers = await getOdooAuthHeaders();
    const productResponse = await axios.post(
      `${ODOO_BASE_URL}/web/dataset/call_kw`,
      {
        jsonrpc: '2.0',
        method: 'call',
        params: {
          model: 'product.product',
          method: 'search_read',
          args: [[['id', '=', productId]]],
          kwargs: {
            fields: [
              'id', 'name', 'list_price', 'default_code', 'uom_id', 'image_128',
              'description_sale', 'categ_id', 'qty_available', 'virtual_available'
            ],
            limit: 1,
          },
        },
      },
      { headers }
    );

    if (productResponse.data.error) throw new Error('Odoo JSON-RPC error');
    const results = productResponse.data.result || [];
    const p = results[0];
    if (!p) return null;

    // 2. Fetch warehouse/stock info
    const quantHeaders = await getOdooAuthHeaders();
    const quantResponse = await axios.post(
      `${ODOO_BASE_URL}/web/dataset/call_kw`,
      {
        jsonrpc: '2.0',
        method: 'call',
        params: {
          model: 'stock.quant',
          method: 'search_read',
          args: [[['product_id', '=', productId]]],
          kwargs: {
            fields: ['location_id', 'quantity'],
          },
        },
      },
      { headers: quantHeaders }
    );

    let inventory_ledgers = [];
    if (quantResponse.data && quantResponse.data.result) {
      inventory_ledgers = quantResponse.data.result.map(q => ({
        warehouse_id: Array.isArray(q.location_id) ? q.location_id[0] : null,
        warehouse_name: Array.isArray(q.location_id) ? q.location_id[1] : '',
        total_warehouse_quantity: q.quantity,
      }));
    }

    // 3. Shape and return
    const hasBase64 = p.image_128 && typeof p.image_128 === 'string' && p.image_128.length > 0;
    const baseUrl = (ODOO_BASE_URL || '').replace(/\/$/, '');
    const imageUrl = hasBase64
      ? `data:image/png;base64,${p.image_128}`
      : `${baseUrl}/web/image?model=product.product&id=${p.id}&field=image_128`;

    return {
      id: p.id,
      product_name: p.name || '',
      image_url: imageUrl,
      price: p.list_price || 0,
      minimal_sales_price: p.list_price || null,
      inventory_ledgers,
      total_product_quantity: p.qty_available ?? p.virtual_available ?? 0,
      inventory_box_products_details: [],
      product_code: p.default_code || '',
      uom: p.uom_id ? { uom_id: p.uom_id[0], uom_name: p.uom_id[1] } : null,
      categ_id: p.categ_id || null,
      product_description: p.description_sale || '',
    };
  } catch (error) {
    console.error('fetchProductDetailsOdoo error:', error);
    throw error;
  }
};


export const fetchInventoryBoxRequest = async ({ offset, limit, searchText }) => {
  const currentUser = useAuthStore.getState().user; // Correct usage of useAuthStore
  const salesPersonId = currentUser.related_profile._id;

  // Debugging output for salesPersonId
  try {
    const queryParams = {
      offset,
      limit,
      ...(searchText !== undefined && { name: searchText }),
      ...(salesPersonId !== undefined && { sales_person_id: salesPersonId })
    };
    const response = await get(API_ENDPOINTS.VIEW_INVENTORY_BOX_REQUEST, queryParams);
    return response.data;
  } catch (error) {
    handleApiError(error);
    throw error;
  }
};

export const fetchAuditing = async ({ offset, limit }) => {
  // Try Odoo first, fall back to old backend
  try {
    const audits = await fetchAuditingOdoo({ offset, limit });
    return audits;
  } catch (e) {
    console.warn('fetchAuditing: Odoo fetch failed, falling back to old API', e?.message);
  }
  try {
    const queryParams = {
      offset,
      limit,
    };
    const response = await get(API_ENDPOINTS.VIEW_AUDITING, queryParams);
    return response.data;
  } catch (error) {
    handleApiError(error);
    throw error;
  }
};

// Fetch auditing records from Odoo via JSON-RPC
export const fetchAuditingOdoo = async ({ offset = 0, limit = 50 } = {}) => {
  const baseUrl = (ODOO_BASE_URL || '').replace(/\/$/, '');
  try {
    // Authenticate
    const loginResponse = await axios.post(
      `${baseUrl}/web/session/authenticate`,
      {
        jsonrpc: '2.0',
        method: 'call',
        params: {
          db: DEFAULT_ODOO_DB,
          login: DEFAULT_USERNAME,
          password: DEFAULT_PASSWORD,
        },
      },
      { headers: { 'Content-Type': 'application/json' }, withCredentials: true }
    );
    if (loginResponse.data.error) {
      throw new Error('Odoo authentication failed');
    }
    const setCookie = loginResponse.headers['set-cookie'] || loginResponse.headers['Set-Cookie'];
    const headers = { 'Content-Type': 'application/json' };
    if (setCookie) {
      headers.Cookie = Array.isArray(setCookie) ? setCookie.join('; ') : String(setCookie);
    }

    const response = await axios.post(
      `${baseUrl}/web/dataset/call_kw`,
      {
        jsonrpc: '2.0',
        method: 'call',
        params: {
          model: 'transaction.auditing',
          method: 'search_read',
          args: [[]],
          kwargs: {
            fields: [
              'id', 'sequence_no', 'date', 'customer_name', 'supplier_name',
              'inv_sequence_no', 'amount', 'collection_type_name',
              'warehouse_name', 'sales_person_name', 'chart_of_accounts_name',
            ],
            offset,
            limit,
            order: 'create_date desc',
          },
        },
      },
      { headers, withCredentials: true, timeout: 15000 }
    );

    if (response.data.error) {
      throw new Error(response.data.error.data?.message || 'Odoo JSON-RPC error');
    }

    const records = response.data.result || [];
    return records.map(r => ({
      _id: r.id,
      sequence_no: r.sequence_no || '',
      date: r.date || '',
      customer_name: r.customer_name || '',
      supplier_name: r.supplier_name || '',
      inv_sequence_no: r.inv_sequence_no || '',
      amount: r.amount || 0,
      collection_type_name: r.collection_type_name || '',
      chart_of_accounts_name: r.chart_of_accounts_name || '',
      warehouse_name: r.warehouse_name || '',
      sales_person_name: r.sales_person_name || '',
    }));
  } catch (error) {
    console.error('fetchAuditingOdoo error:', error?.message || error);
    throw error;
  }
};

// Create a Transaction Auditing record in Odoo via JSON-RPC
export const createAuditingOdoo = async (auditingData) => {
  const baseUrl = (ODOO_BASE_URL || '').replace(/\/$/, '');
  try {
    // Step 1: Authenticate
    const loginResponse = await axios.post(
      `${baseUrl}/web/session/authenticate`,
      {
        jsonrpc: '2.0',
        method: 'call',
        params: {
          db: DEFAULT_ODOO_DB,
          login: DEFAULT_USERNAME,
          password: DEFAULT_PASSWORD,
        },
      },
      { headers: { 'Content-Type': 'application/json' }, withCredentials: true }
    );
    if (loginResponse.data.error) {
      throw new Error('Odoo authentication failed');
    }
    const setCookie = loginResponse.headers['set-cookie'] || loginResponse.headers['Set-Cookie'];
    const headers = { 'Content-Type': 'application/json' };
    if (setCookie) {
      headers.Cookie = Array.isArray(setCookie) ? setCookie.join('; ') : String(setCookie);
    }

    // Step 2: Build vals from auditingData
    const vals = {
      date: auditingData.date || false,
      amount: auditingData.amount || 0,
      un_taxed_amount: auditingData.un_taxed_amount || 0,
      advance_paid_amount: auditingData.advance_paid_amount || 0,
      remarks: auditingData.remarks || false,
      customer_id: auditingData.customer_id || false,
      customer_name: auditingData.customer_name || false,
      supplier_id: auditingData.supplier_id || false,
      supplier_name: auditingData.supplier_name || false,
      invoice_id: auditingData.invoice_id || false,
      inv_sequence_no: auditingData.inv_sequence_no || false,
      register_payment_id: auditingData.register_payment_id || false,
      register_payment_sequence_no: auditingData.register_payment_sequence_no || false,
      collection_type_id: auditingData.collection_type_id || false,
      collection_type_name: auditingData.collection_type_name || false,
      bussiness_type_id: auditingData.bussiness_type_id || false,
      chq_no: auditingData.chq_no || false,
      chq_date: auditingData.chq_date || false,
      chq_type: auditingData.chq_type || false,
      cheque_transaction_type: auditingData.cheque_transaction_type || false,
      chart_of_accounts_id: auditingData.chart_of_accounts_id || false,
      chart_of_accounts_name: auditingData.chart_of_accounts_name || false,
      online_transaction_type: auditingData.online_transaction_type || false,
      online_status: auditingData.online_status || false,
      ledger_id: auditingData.ledger_id || false,
      ledger_name: auditingData.ledger_name || false,
      ledger_type: auditingData.ledger_type || false,
      ledger_display_name: auditingData.ledger_display_name || false,
      employee_ledger_id: auditingData.employee_ledger_id || false,
      employee_ledger_name: auditingData.employee_ledger_name || false,
      employee_ledger_display_name: auditingData.employee_ledger_display_name || false,
      warehouse_id: auditingData.warehouse_id || false,
      warehouse_name: auditingData.warehouse_name || false,
      scanned_warehouse_id: auditingData.scanned_warehouse_id || false,
      to_warehouse_id: auditingData.to_warehouse_id || false,
      to_warehouse_name: auditingData.to_warehouse_name || false,
      sales_person_id: auditingData.sales_person_id || false,
      sales_person_name: auditingData.sales_person_name || false,
      company_id_ref: auditingData.company_id || false,
      company_name: auditingData.company_name || false,
      service_amount: auditingData.service_amount || 0,
      service_product_amount: auditingData.service_product_amount || 0,
      service_product_cost: auditingData.service_product_cost || 0,
      is_estimation: auditingData.is_estimation || false,
    };

    // Handle customer/vendor signature (base64 data URI → raw base64)
    if (auditingData.customer_vendor_signature) {
      const sigMatch = auditingData.customer_vendor_signature.match(/^data:image\/[^;]+;base64,(.+)$/);
      vals.customer_vendor_signature = sigMatch ? sigMatch[1] : auditingData.customer_vendor_signature;
    }

    // Handle attachments
    const attachments = auditingData.attachments || [];
    if (attachments.length > 0) {
      vals.attachment_ids = attachments.map((imgUri, idx) => {
        const b64Match = imgUri.match(/^data:image\/[^;]+;base64,(.+)$/);
        if (b64Match) {
          return [0, 0, { attachment: b64Match[1], filename: `audit_image_${idx + 1}.jpg` }];
        }
        return [0, 0, { image_url: imgUri }];
      });
    }

    // Step 3: Create record
    const response = await axios.post(
      `${baseUrl}/web/dataset/call_kw`,
      {
        jsonrpc: '2.0',
        method: 'call',
        params: {
          model: 'transaction.auditing',
          method: 'create',
          args: [vals],
          kwargs: {},
        },
      },
      { headers, withCredentials: true, timeout: 15000 }
    );

    if (response.data.error) {
      console.error('Odoo JSON-RPC error (create auditing):', response.data.error);
      throw new Error(response.data.error.data?.message || 'Odoo JSON-RPC error');
    }

    console.log('[createAuditingOdoo] Created record ID:', response.data.result);
    return response.data.result;
  } catch (error) {
    console.error('createAuditingOdoo error:', error?.message || error);
    throw error;
  }
};

export const fetchCustomers = async ({ offset, limit, searchText }) => {
  try {
    const queryParams = {
      offset,
      limit,
      ...(searchText !== undefined && { name: searchText }),
    };
    const response = await get(API_ENDPOINTS.VIEW_CUSTOMERS, queryParams);
    return response.data;
  } catch (error) {
    handleApiError(error);
    throw error;
  }
};// 🔹 Fetch customers directly from Odoo 19 via JSON-RPC (no mobile field)
export const fetchCustomersOdoo = async ({ offset = 0, limit = 50, searchText } = {}) => {
  try {
    // 🔍 Domain for search (optional)
    let domain = [];

    if (searchText && searchText.trim() !== "") {
      const term = searchText.trim();
      domain = [
        "|",
        ["name", "ilike", term],
        ["phone", "ilike", term],
      ];
    }
    const headers = await getOdooAuthHeaders();
    const response = await axios.post(
      `${ODOO_BASE_URL}/web/dataset/call_kw`,
      {
        jsonrpc: "2.0",
        method: "call",
        params: {
          model: "res.partner",
          method: "search_read",
          args: [domain],
          kwargs: {
            fields: [
              "id", "name", "email", "phone",
              "street", "street2", "city", "zip", "country_id"
            ],
            offset,
            limit,
            order: "name asc",
          },
        },
      },
      { headers }
    );

    if (response.data.error) {
      console.log("Odoo JSON-RPC error:", response.data.error);
      throw new Error("Odoo JSON-RPC error");
    }

    const partners = response.data.result || [];

    // 🔙 Shape result for your CustomerScreen
    return partners.map((p) => ({
      id: p.id,
      name: p.name || "",
      email: p.email || "",
      phone: p.phone || "",
      address: [
        p.street,
        p.street2,
        p.city,
        p.zip,
        p.country_id && Array.isArray(p.country_id) ? p.country_id[1] : ""
      ].filter(Boolean).join(", "),
    }));
  } catch (error) {
    console.error("fetchCustomersOdoo error:", error);
    throw error;
  }
};


export const fetchPickup = async ({ offset, limit, loginEmployeeId }) => {
  try {
    const queryParams = {
      offset,
      limit,
      ...(loginEmployeeId !== undefined && { login_employee_id: loginEmployeeId }),
    };
    const response = await get(API_ENDPOINTS.VIEW_PICKUP, queryParams);
    return response.data;
  } catch (error) {
    handleApiError(error);
    throw error;
  }
};

export const fetchService = async ({ offset, limit, loginEmployeeId }) => {
  try {
    const queryParams = {
      offset,
      limit,
      ...(loginEmployeeId !== undefined && { login_employee_id: loginEmployeeId }),
    };
    const response = await get(API_ENDPOINTS.VIEW_SERVICE, queryParams);
    return response.data;
  } catch (error) {
    handleApiError(error);
    throw error;
  }
};

export const fetchSpareParts = async ({ offset, limit, loginEmployeeId }) => {
  try {
    const queryParams = {
      offset,
      limit,
      ...(loginEmployeeId !== undefined && { login_employee_id: loginEmployeeId }),
    };
    const response = await get(API_ENDPOINTS.VIEW_SPARE_PARTS, queryParams);
    return response.data;
  } catch (error) {
    handleApiError(error);
    throw error;
  }
};

export const fetchMarketStudy = async ({ offset, limit }) => {
  try {
    const queryParams = {
      offset,
      limit,
    };
    const response = await get(API_ENDPOINTS.VIEW_MARKET_STUDY, queryParams);
    return response.data;
  } catch (error) {
    handleApiError(error);
    throw error;
  }
};

export const fetchCustomerVisitList = async ({ offset, limit, fromDate, toDate, customerId, customerName, employeeName, loginEmployeeId }) => {
  try {
    const queryParams = {
      offset,
      limit,
      ...(loginEmployeeId !== undefined && { login_employee_id: loginEmployeeId }),
      ...(customerName !== undefined && { customer_name: customerName }),
      ...(customerId !== undefined && { customer_id: customerId }),
      ...(employeeName !== undefined && { employee_name: employeeName }),
      ...(fromDate !== undefined && { from_date: fromDate }),
      ...(toDate !== undefined && { to_date: toDate }),
    };
    const response = await get(API_ENDPOINTS.VIEW_CUSTOMER_VISIT_LIST, queryParams);
    return response.data;
  } catch (error) {
    handleApiError(error);
    throw error;
  }
};

export const fetchStaffTrackingList = async ({ offset, limit, fromDate, toDate, employeeIds, departmentIds, loginEmployeeId }) => {
  try {
    const queryParams = {
      offset,
      limit,
      ...(loginEmployeeId !== undefined && { login_employee_id: loginEmployeeId }),
      ...(employeeIds !== undefined && employeeIds.length > 0 && { employee_ids: employeeIds.join(',') }),
      ...(departmentIds !== undefined && departmentIds.length > 0 && { department_ids: departmentIds.join(',') }),
      ...(fromDate !== undefined && { from_date: fromDate }),
      ...(toDate !== undefined && { to_date: toDate }),
    };
    const response = await get(API_ENDPOINTS.VIEW_STAFF_TRACKING, queryParams);
    return response.data;
  } catch (error) {
    handleApiError(error);
    throw error;
  }
};

export const fetchEnquiryRegister = async ({ offset, limit, loginEmployeeId }) => {
  try {
    const queryParams = {
      offset,
      limit,
      ...(loginEmployeeId !== undefined && { login_employee_id: loginEmployeeId }),
    };
    const response = await get(API_ENDPOINTS.VIEW_ENQUIRY_REGISTER, queryParams);
    return response.data;
  } catch (error) {
    handleApiError(error);
    throw error;
  }
};

export const fetchPurchaseRequisition = async ({ offset, limit,searchText}) => {
  try {
    const queryParams = {
      offset,
      limit,
      ...(searchText !== undefined && { sequence_no: searchText }),
    };
    const response = await get(API_ENDPOINTS.VIEW_PURCHASE_REQUISITION,queryParams);
    return response.data;

  } catch(error){
    handleApiError(error);
    throw error;
  }
}

export const fetchPriceEnquiry = async ({ offset, limit,searchText}) => {
  try {
    const queryParams = {
      offset,
      limit,
      ...(searchText !== undefined && { sequence_no: searchText }),
    };
    const response = await get(API_ENDPOINTS.VIEW_PRICE,queryParams);
    return response.data;

  } catch(error){
    handleApiError(error);
    throw error;
  }
}

export const fetchPurchaseOrder = async ({ offset, limit,searchText}) => {
  try {
    const queryParams = {
      offset,
      limit,
      ...(searchText !== undefined && { sequence_no: searchText }),
    };
    const response = await get(API_ENDPOINTS.VIEW_PURCHASE_ORDER,queryParams);
    return response.data;

  } catch(error){
    handleApiError(error);
    throw error;
  }
}

export const fetchDeliveryNote = async ({ offset, limit,searchText}) => {
  try {
    const queryParams = {
      offset,
      limit,
      ...(searchText !== undefined && { sequence_no: searchText }),
    };
    const response = await get(API_ENDPOINTS.VIEW_DELIVERY_NOTE,queryParams);
    return response.data;

  } catch(error){
    handleApiError(error);
    throw error;
  }
}

export const fetchVendorBill = async ({ offset, limit,searchText}) => {
  try {
    const queryParams = {
      offset,
      limit,
      ...(searchText !== undefined && { sequence_no: searchText }),
    };
    const response = await get(API_ENDPOINTS.VIEW_VENDOR_BILL,queryParams);
    return response.data;

  } catch(error){
    handleApiError(error);
    throw error;
  }
}

export const fetchPaymentMade = async ({ offset, limit,searchText}) => {
  try {
    const queryParams = {
      offset,
      limit,
      ...(searchText !== undefined && { sequence_no: searchText }),
    };
    const response = await get(API_ENDPOINTS.VIEW_PAYMENT_MADE,queryParams);
    return response.data;

  } catch(error){
    handleApiError(error);
    throw error;
  }
}

// viewPaymentMade

export const fetchLead = async ({ offset, limit, loginEmployeeId }) => {
  try {
    const queryParams = {
      offset,
      limit,
      ...(loginEmployeeId !== undefined && { login_employee_id: loginEmployeeId }),
      // ...(sequenceNo !== undefined && { sequence_no: sequenceNo }),
    };
    const response = await get(API_ENDPOINTS.VIEW_LEAD, queryParams);
    return response.data;
  } catch (error) {
    handleApiError(error);
    throw error;
  }
};

export const fetchPipeline = async ({ offset, limit, date, source, opportunity, customer, loginEmployeeId }) => {
  try {
    const queryParams = {
      offset,
      limit,
      ...(date !== undefined && { date: date }),
      ...(source !== undefined && { source_name: source }),
      ...(opportunity !== undefined && { opportunity_name: opportunity }),
      ...(customer !== undefined && { customer_name: customer }),
      ...(loginEmployeeId !== undefined && { login_employee_id: loginEmployeeId }),
    };
    const response = await get(API_ENDPOINTS.VIEW_PIPELINE, queryParams);
    return response.data;
  } catch (error) {
    handleApiError(error);
    throw error;
  }
};

export const fetchVisitPlan = async ({ offset, limit, date, employeeId }) => {
  try {
    const queryParams = {
      offset,
      limit,
      date: date,
      ...(employeeId !== undefined && { employee_id: employeeId }),
    };
    const response = await get(API_ENDPOINTS.VIEW_VISIT_PLAN, queryParams);
    return response.data;
  } catch (error) {
    handleApiError(error);
    throw error;
  }
};

export const fetchBoxInspectionReport = async ({ offset, limit }) => {
  try {
    const queryParams = {
      offset,
      limit,
    };
    const response = await get(API_ENDPOINTS.VIEW_BOX_INSPECTION_REPORT, queryParams);
    return response.data;
  } catch (error) {
    handleApiError(error);
    throw error;
  }
};

export const fetchAttendance = async ({ userId, date }) => {
  try {
    const queryParams = {
      user_id: userId,
      date,
    };
    const response = await get(API_ENDPOINTS.VIEW_ATTENDANCE, queryParams);
    return response.data;
  } catch (error) {
    handleApiError(error);
    throw error;
  }
};

export const fetchKPIDashboard = async ({ userId }) => {
  try {
    const queryParams = { login_employee_id: userId };
    const response = await get(API_ENDPOINTS.VIEW_KPI, queryParams);
    return response.data;
  } catch (error) {
    handleApiError(error);
    throw error;
  }
}

export const fetchVehicles = async ({ offset, limit, searchText }) => {
  // Try Odoo JSON-RPC first (if configured), otherwise fall back to backend API
  try {
    if (ODOO_BASE_URL) {
      try {
        const vehicles = await fetchVehiclesOdoo({ offset, limit, searchText });
        return vehicles;
      } catch (e) {
        // If Odoo fetch fails, log and fall back to the existing API
        console.warn('fetchVehicles: Odoo JSON-RPC fetch failed, falling back to API', e);
      }
    }

    const queryParams = {
      offset,
      limit,
      ...(searchText !== undefined && { name: searchText }),
    };
    const response = await get(API_ENDPOINTS.VIEW_VEHICLES, queryParams);
    return response.data;
  } catch (error) {
    handleApiError(error);
    throw error;
  }
};

// Fetch full customer/partner details (address fields) by id from Odoo
export const fetchCustomerDetailsOdoo = async (partnerId) => {
  try {
    if (!partnerId) return null;
    const headers = await getOdooAuthHeaders();
    const response = await axios.post(
      `${ODOO_BASE_URL}/web/dataset/call_kw`,
      {
        jsonrpc: '2.0',
        method: 'call',
        params: {
          model: 'res.partner',
          method: 'search_read',
          args: [[['id', '=', partnerId]]],
          kwargs: {
            fields: ['id', 'name', 'street', 'street2', 'city', 'zip', 'country_id'],
            limit: 1,
          },
        },
      },
      { headers }
    );

    if (response.data.error) {
      console.log('Odoo JSON-RPC error (customer details):', response.data.error);
      throw new Error('Odoo JSON-RPC error');
    }

    const results = response.data.result || [];
    const p = results[0];
    if (!p) return null;

    const address = [p.street, p.street2, p.city, p.zip, p.country_id && Array.isArray(p.country_id) ? p.country_id[1] : '']
      .filter(Boolean)
      .join(', ');

    return {
      id: p.id,
      name: p.name || '',
      address: address || null,
    };
  } catch (error) {
    console.error('fetchCustomerDetailsOdoo error:', error);
    throw error;
  }
};

// Create Account Payment for Odoo
export const createAccountPaymentOdoo = async ({ partnerId, journalId, amount }) => {
  // Example: adjust endpoint and payload as needed for your backend
  try {
    const response = await fetch('http://103.42.198.95:8969/web/dataset/call_kw', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        jsonrpc: '2.0',
        method: 'createAccountPayment',
        params: {
          partner_id: partnerId,
          journal_id: journalId,
          amount,
        },
        id: new Date().getTime(),
      }),
    });
    const result = await response.json();
    return result;
  } catch (error) {
    return { error };
  }
};

// Fetch Payment Journals for Odoo
export const fetchPaymentJournalsOdoo = async () => {
  try {
    const response = await fetch('http://103.42.198.95:8969/web/dataset/call_kw', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        jsonrpc: '2.0',
        method: 'fetchPaymentJournals', // Adjust to your backend method name
        params: {},
        id: new Date().getTime(),
      }),
    });
    const result = await response.json();
    // Adjust result parsing as needed
    return result.result || result.data || [];
  } catch (error) {
    return [];
  }
};


// Fetch vehicles directly from Odoo using JSON-RPC
export const fetchVehiclesOdoo = async ({ offset = 0, limit = 50, searchText = "" } = {}) => {
  try {
    let domain = [];
    if (searchText && searchText.trim() !== "") {
      const term = searchText.trim();
      domain = [["name", "ilike", term]]; // Filter by vehicle name
    }

    const response = await axios.post(
      `${ODOO_BASE_URL}/web/dataset/call_kw`,
      {
        jsonrpc: "2.0",
        method: "call",
        params: {
          model: "fleet.vehicle",
          method: "search_read",
          args: [domain],
          kwargs: {
            fields: [
              "id",
              "name",
              "license_plate",
              "model_id",
              "driver_id",
              "image_128"
            ],
            offset,
            limit,
            order: "name asc",
          },
        },
      },
      {
        headers: { "Content-Type": "application/json" },
      }
    );

    if (response.data.error) {
      console.log("Odoo JSON-RPC error (vehicles):", response.data.error);
      throw new Error("Odoo JSON-RPC error");
    }

    const vehicles = response.data.result || [];
    return vehicles.map(v => ({
      id: v.id,
      name: v.name || "",
      license_plate: v.license_plate || "",
      model: v.model_id ? { id: v.model_id[0], name: v.model_id[1] } : null,
      driver: v.driver_id ? { id: v.driver_id[0], name: v.driver_id[1] } : null,
      image_url: v.image_128 && typeof v.image_128 === 'string' && v.image_128.length > 0
        ? `data:image/png;base64,${v.image_128}`
        : null,
    }));
  } catch (error) {
    console.error("fetchVehiclesOdoo error:", error);
    throw error;
  }
};

// Fetch vehicles from the vehicle-tracking Odoo endpoint (uses vehicleTrackingConfig)
export const fetchVehiclesVehicleTracking = async ({ offset = 0, limit = 50, searchText = "", username = "admin", password = "admin" } = {}) => {
  let domain = [];
  if (searchText && searchText.trim() !== "") {
    const term = searchText.trim();
    domain = [["name", "ilike", term]];
  }
  const baseUrl = (VEHICLE_TRACKING_BASE_URL || '').replace(/\/$/, '');
  try {
    // Step 1: Authenticate and get session cookie
    const loginResp = await loginVehicleTrackingOdoo({ username, password });
    // Step 2: Fetch vehicles with session
    const response = await axios.post(
      `${baseUrl}/web/dataset/call_kw`,
      {
        jsonrpc: "2.0",
        method: "call",
        params: {
          model: "fleet.vehicle",
          method: "search_read",
          args: [domain],
          kwargs: {
              fields: ["id", "name", "license_plate", "model_id", "driver_id", "image_128", "tank_capacity"],
            offset,
            limit,
            order: "name asc",
          },
        },
      },
      {
        headers: { "Content-Type": "application/json" },
        withCredentials: true,
        timeout: 15000,
        // If cookies available, set them
        ...(loginResp.cookies ? { headers: { Cookie: loginResp.cookies } } : {}),
      }
    );
    if (response.data.error) {
      console.log("VehicleTracking JSON-RPC error (vehicles):", response.data.error);
      throw new Error("VehicleTracking JSON-RPC error");
    }
    const vehicles = response.data.result || [];
      return vehicles.map(v => ({
        id: v.id,
        name: v.name || "",
        license_plate: v.license_plate || "",
        model: v.model_id ? { id: v.model_id[0], name: v.model_id[1] } : null,
        driver: v.driver_id ? { id: v.driver_id[0], name: v.driver_id[1] } : null,
        image_url: v.image_128 && typeof v.image_128 === 'string' && v.image_128.length > 0 ? `data:image/png;base64,${v.image_128}` : null,
        tank_capacity: v.tank_capacity ?? '',
      }));
  } catch (error) {
    console.error('fetchVehiclesVehicleTracking error:', error?.message || error);
    if (error && error.response) {
      console.error('fetchVehiclesVehicleTracking response status:', error.response.status);
      try { console.error('fetchVehiclesVehicleTracking response data:', error.response.data); } catch (e) {}
    }
    throw error;
  }
};

// Fetch invoice (account.move) by ID from Odoo via JSON-RPC
export const fetchInvoiceByIdOdoo = async (invoiceId) => {
  try {
    if (!invoiceId) return null;

    const headers = await getOdooAuthHeaders();
    const response = await axios.post(
      `${ODOO_BASE_URL}/web/dataset/call_kw`,
      {
        jsonrpc: '2.0',
        method: 'call',
        params: {
          model: 'account.move',
          method: 'search_read',
          args: [[['id', '=', Number(invoiceId)]]],
          kwargs: {
            fields: [
              'id', 'name', 'partner_id', 'invoice_date', 'invoice_date_due',
              'amount_total', 'amount_residual', 'amount_untaxed', 'amount_tax',
              'state', 'payment_state', 'move_type', 'currency_id',
              'invoice_line_ids', 'ref', 'narration',
            ],
            limit: 1,
          },
        },
      },
      { headers }
    );

    if (response.data.error) {
      console.log('Odoo JSON-RPC error (invoice):', response.data.error);
      throw new Error('Odoo JSON-RPC error');
    }

    const results = response.data.result || [];
    const inv = results[0];
    if (!inv) return null;

    // Fetch invoice lines
    let invoiceLines = [];
    if (inv.invoice_line_ids && inv.invoice_line_ids.length > 0) {
      const linesResponse = await axios.post(
        `${ODOO_BASE_URL}/web/dataset/call_kw`,
        {
          jsonrpc: '2.0',
          method: 'call',
          params: {
            model: 'account.move.line',
            method: 'search_read',
            args: [[['id', 'in', inv.invoice_line_ids]]],
            kwargs: {
              fields: ['id', 'name', 'product_id', 'quantity', 'price_unit', 'price_subtotal'],
            },
          },
        },
        { headers }
      );

      if (!linesResponse.data.error && linesResponse.data.result) {
        invoiceLines = linesResponse.data.result.map(line => ({
          id: line.id,
          description: line.name || '',
          product_name: Array.isArray(line.product_id) ? line.product_id[1] : '',
          quantity: line.quantity || 0,
          price_unit: line.price_unit || 0,
          price_subtotal: line.price_subtotal || 0,
        }));
      }
    }

    return {
      id: inv.id,
      name: inv.name || '',
      partner_name: Array.isArray(inv.partner_id) ? inv.partner_id[1] : '',
      invoice_date: inv.invoice_date || '',
      invoice_date_due: inv.invoice_date_due || '',
      amount_total: inv.amount_total || 0,
      amount_residual: inv.amount_residual || 0,
      amount_untaxed: inv.amount_untaxed || 0,
      amount_tax: inv.amount_tax || 0,
      state: inv.state || '',
      payment_state: inv.payment_state || '',
      move_type: inv.move_type || '',
      currency_name: Array.isArray(inv.currency_id) ? inv.currency_id[1] : '',
      ref: inv.ref || '',
      narration: inv.narration || '',
      invoice_lines: invoiceLines,
    };
  } catch (error) {
    console.error('fetchInvoiceByIdOdoo error:', error);
    throw error;
  }
};

// Create a Product Enquiry record in Odoo via JSON-RPC
export const createProductEnquiryOdoo = async ({
  date,
  type,
  customer_name,
  customer_no,
  sale_price,
  product_name,
  image_url,
  attachments = [],
}) => {
  const baseUrl = (ODOO_BASE_URL || '').replace(/\/$/, '');
  try {
    // Step 1: Authenticate to Odoo
    const loginResponse = await axios.post(
      `${baseUrl}/web/session/authenticate`,
      {
        jsonrpc: '2.0',
        method: 'call',
        params: {
          db: DEFAULT_ODOO_DB,
          login: DEFAULT_USERNAME,
          password: DEFAULT_PASSWORD,
        },
      },
      { headers: { 'Content-Type': 'application/json' }, withCredentials: true }
    );

    if (loginResponse.data.error) {
      throw new Error('Odoo authentication failed');
    }

    // Extract session cookie
    const setCookie = loginResponse.headers['set-cookie'] || loginResponse.headers['Set-Cookie'];
    const headers = { 'Content-Type': 'application/json' };
    if (setCookie) {
      headers.Cookie = Array.isArray(setCookie) ? setCookie.join('; ') : String(setCookie);
    }

    // Step 2: Create product.enquiry record
    const vals = {
      date: date || false,
      type: type || 'product_enquiry',
      customer_name: customer_name || false,
      customer_no: customer_no || false,
      sale_price: sale_price || 0,
      product_name: product_name || false,
      image_url: image_url || false,
    };

    // Handle image attachments — extract base64 from data URI for Odoo Binary field
    if (attachments.length > 0) {
      vals.attachment_ids = attachments.map((imgUri, idx) => {
        const b64Match = imgUri.match(/^data:image\/([^;]+);base64,(.+)$/);
        if (b64Match) {
          const ext = b64Match[1] === 'jpeg' ? 'jpg' : b64Match[1];
          return [0, 0, { attachment: b64Match[2], filename: `enquiry_image_${idx + 1}.${ext}` }];
        }
        return [0, 0, { image_url: imgUri }];
      });
    }

    console.log('[createProductEnquiryOdoo] Sending vals:', JSON.stringify({
      ...vals,
      image_url: vals.image_url ? '(base64 data...)' : false,
      attachment_ids: vals.attachment_ids ? `${vals.attachment_ids.length} attachments` : 'none',
    }));

    const response = await axios.post(
      `${baseUrl}/web/dataset/call_kw`,
      {
        jsonrpc: '2.0',
        method: 'call',
        params: {
          model: 'product.enquiry',
          method: 'create',
          args: [vals],
          kwargs: {},
        },
      },
      { headers, withCredentials: true, timeout: 30000 }
    );

    if (response.data.error) {
      console.error('Odoo JSON-RPC error (create product enquiry):', response.data.error);
      throw new Error(response.data.error.data?.message || 'Odoo JSON-RPC error');
    }

    console.log('[createProductEnquiryOdoo] Created record ID:', response.data.result);
    return response.data.result;
  } catch (error) {
    console.error('createProductEnquiryOdoo error:', error?.message || error);
    throw error;
  }
};

// Create account.payment with customer signature and GPS location in Odoo
export const createPaymentWithSignatureOdoo = async ({
  partnerId,
  amount,
  paymentType = 'inbound',
  journalId,
  ref = '',
  customerSignature = null,
  latitude = null,
  longitude = null,
  locationName = '',
}) => {
  const baseUrl = (ODOO_BASE_URL || '').replace(/\/$/, '');
  try {
    // Step 1: Authenticate
    const loginResponse = await axios.post(
      `${baseUrl}/web/session/authenticate`,
      {
        jsonrpc: '2.0',
        method: 'call',
        params: {
          db: DEFAULT_ODOO_DB,
          login: DEFAULT_USERNAME,
          password: DEFAULT_PASSWORD,
        },
      },
      { headers: { 'Content-Type': 'application/json' }, withCredentials: true }
    );
    if (loginResponse.data.error) throw new Error('Odoo authentication failed');
    const setCookie = loginResponse.headers['set-cookie'] || loginResponse.headers['Set-Cookie'];
    const headers = { 'Content-Type': 'application/json' };
    if (setCookie) {
      headers.Cookie = Array.isArray(setCookie) ? setCookie.join('; ') : String(setCookie);
    }

    // Step 2: Build vals
    const vals = {
      amount: amount || 0,
      payment_type: paymentType,
    };
    if (partnerId) vals.partner_id = partnerId;
    if (journalId) vals.journal_id = journalId;
    if (ref) vals.ref = ref;

    // Handle signature (base64 data URI → raw base64)
    if (customerSignature) {
      const sigMatch = customerSignature.match(/^data:image\/[^;]+;base64,(.+)$/);
      vals.customer_signature = sigMatch ? sigMatch[1] : customerSignature;
    }

    // Handle location
    if (latitude !== null) vals.latitude = latitude;
    if (longitude !== null) vals.longitude = longitude;
    if (locationName) vals.location_name = locationName;

    // Step 3: Create record
    const response = await axios.post(
      `${baseUrl}/web/dataset/call_kw`,
      {
        jsonrpc: '2.0',
        method: 'call',
        params: {
          model: 'account.payment',
          method: 'create',
          args: [vals],
          kwargs: {},
        },
      },
      { headers, withCredentials: true, timeout: 15000 }
    );

    if (response.data.error) {
      console.error('Odoo JSON-RPC error (create payment):', response.data.error);
      throw new Error(response.data.error.data?.message || 'Odoo JSON-RPC error');
    }

    console.log('[createPaymentWithSignatureOdoo] Created record ID:', response.data.result);
    return response.data.result;
  } catch (error) {
    console.error('createPaymentWithSignatureOdoo error:', error?.message || error);
    throw error;
  }
};