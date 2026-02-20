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

    const { headers, baseUrl } = await authenticateOdoo();
    const response = await axios.post(
      `${baseUrl}/web/dataset/call_kw`,
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
            fields: ["id", "name", "parent_id", "sequence_no"],
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
      const imageUrl = `${baseUrl}/web/image?model=product.category&id=${c.id}&field=image_1920`;
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

// Create Account Payment in Odoo via JSON-RPC
export const createAccountPaymentOdoo = async ({ partnerId, journalId, amount, paymentType = 'inbound', ref = '' }) => {
  try {
    const headers = await getOdooAuthHeaders();
    const vals = {
      amount: amount || 0,
      payment_type: paymentType,
    };
    if (partnerId) vals.partner_id = partnerId;
    if (journalId) vals.journal_id = journalId;
    if (ref) vals.ref = ref;

    const response = await axios.post(
      `${ODOO_BASE_URL}/web/dataset/call_kw`,
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
      console.error('Odoo JSON-RPC error (create account payment):', response.data.error);
      throw new Error(response.data.error.data?.message || 'Failed to create account payment');
    }
    return { result: response.data.result };
  } catch (error) {
    console.error('createAccountPaymentOdoo error:', error?.message || error);
    return { error: error?.message || error };
  }
};

// Fetch Payment Journals from Odoo via JSON-RPC
export const fetchPaymentJournalsOdoo = async () => {
  try {
    const headers = await getOdooAuthHeaders();
    const response = await axios.post(
      `${ODOO_BASE_URL}/web/dataset/call_kw`,
      {
        jsonrpc: '2.0',
        method: 'call',
        params: {
          model: 'account.journal',
          method: 'search_read',
          args: [[["type", "in", ["cash", "bank"]]]],
          kwargs: {
            fields: ["id", "name", "type", "code"],
            limit: 50,
          },
        },
      },
      { headers }
    );
    if (response.data.error) {
      console.error('Odoo JSON-RPC error (payment journals):', response.data.error);
      return [];
    }
    return (response.data.result || []).map(j => ({
      id: j.id,
      name: j.name || '',
      type: j.type || '',
      code: j.code || '',
    }));
  } catch (error) {
    console.error('fetchPaymentJournalsOdoo error:', error?.message || error);
    return [];
  }
};


// Fetch warehouses from Odoo
export const fetchWarehousesOdoo = async () => {
  try {
    const { headers, baseUrl } = await authenticateOdoo();
    const response = await axios.post(
      `${baseUrl}/web/dataset/call_kw`,
      {
        jsonrpc: '2.0',
        method: 'call',
        params: {
          model: 'stock.warehouse',
          method: 'search_read',
          args: [[]],
          kwargs: { fields: ['id', 'name', 'code'], limit: 50 },
        },
      },
      { headers }
    );
    if (response.data.error) {
      console.error('fetchWarehousesOdoo error:', response.data.error);
      return [];
    }
    return (response.data.result || []).map(w => ({ id: w.id, name: w.name, code: w.code, label: w.name }));
  } catch (error) {
    console.error('fetchWarehousesOdoo error:', error?.message || error);
    return [];
  }
};

// Fetch company currency from Odoo
export const fetchCompanyCurrencyOdoo = async () => {
  try {
    const { headers, baseUrl } = await authenticateOdoo();

    // Helper to fetch symbol from res.currency by ID
    const fetchCurrencySymbol = async (currencyId, currencyCode) => {
      try {
        const res = await axios.post(
          `${baseUrl}/web/dataset/call_kw`,
          {
            jsonrpc: '2.0',
            method: 'call',
            params: {
              model: 'res.currency',
              method: 'search_read',
              args: [[['id', '=', currencyId]]],
              kwargs: { fields: [], limit: 1 },
            },
          },
          { headers }
        );
        if (!res.data.error) {
          const currencies = res.data.result || [];
          if (currencies.length > 0) {
            const rec = currencies[0];
            const symbol = rec.symbol || rec.currency_unit_label || currencyCode || '$';
            const code = rec.name || currencyCode;
            console.log('[Currency] Resolved:', code, 'Symbol:', symbol);
            return { code, symbol };
          }
        }
      } catch (e) { /* fall through */ }
      return currencyCode ? { code: currencyCode, symbol: currencyCode } : null;
    };

    // Step 1: Try reading currency from an existing easy.sales record
    try {
      const esRes = await axios.post(
        `${baseUrl}/web/dataset/call_kw`,
        {
          jsonrpc: '2.0',
          method: 'call',
          params: {
            model: 'easy.sales',
            method: 'search_read',
            args: [[]],
            kwargs: { fields: [], limit: 1 },
          },
        },
        { headers }
      );
      if (!esRes.data.error) {
        const records = esRes.data.result || [];
        if (records.length > 0) {
          const rec = records[0];
          // Find a currency_id field (could be currency_id, x_currency_id, etc.)
          const currencyField = Object.keys(rec).find(k => k.includes('currency') && Array.isArray(rec[k]) && rec[k].length === 2);
          if (currencyField) {
            const cId = rec[currencyField][0];
            const cCode = rec[currencyField][1];
            console.log('[Currency] Found currency from easy.sales:', cCode, 'field:', currencyField);
            const result = await fetchCurrencySymbol(cId, cCode);
            if (result) return result;
          }
        }
      }
    } catch (e) {
      console.warn('[Currency] easy.sales currency read failed:', e?.message);
    }

    // Step 2: Try reading from the default pricelist
    try {
      const plRes = await axios.post(
        `${baseUrl}/web/dataset/call_kw`,
        {
          jsonrpc: '2.0',
          method: 'call',
          params: {
            model: 'product.pricelist',
            method: 'search_read',
            args: [[]],
            kwargs: { fields: [], limit: 1 },
          },
        },
        { headers }
      );
      if (!plRes.data.error) {
        const pricelists = plRes.data.result || [];
        if (pricelists.length > 0 && pricelists[0].currency_id) {
          const cId = Array.isArray(pricelists[0].currency_id) ? pricelists[0].currency_id[0] : pricelists[0].currency_id;
          const cCode = Array.isArray(pricelists[0].currency_id) ? pricelists[0].currency_id[1] : null;
          console.log('[Currency] Found currency from pricelist:', cCode);
          const result = await fetchCurrencySymbol(cId, cCode);
          if (result) return result;
        }
      }
    } catch (e) {
      console.warn('[Currency] pricelist currency read failed:', e?.message);
    }

    // Step 3: Fallback to company currency
    const companyRes = await axios.post(
      `${baseUrl}/web/dataset/call_kw`,
      {
        jsonrpc: '2.0',
        method: 'call',
        params: {
          model: 'res.company',
          method: 'search_read',
          args: [[]],
          kwargs: { fields: ['id', 'name', 'currency_id'], limit: 1 },
        },
      },
      { headers }
    );
    if (!companyRes.data.error) {
      const companies = companyRes.data.result || [];
      if (companies.length > 0 && companies[0].currency_id) {
        const cId = Array.isArray(companies[0].currency_id) ? companies[0].currency_id[0] : companies[0].currency_id;
        const cCode = Array.isArray(companies[0].currency_id) ? companies[0].currency_id[1] : null;
        console.log('[Currency] Fallback to company currency:', cCode);
        return await fetchCurrencySymbol(cId, cCode);
      }
    }
    return null;
  } catch (error) {
    console.error('[Currency] fetchCompanyCurrency error:', error?.message || error);
    return null;
  }
};

// ============================================================
// Easy Sales (custom easy.sales model)
// ============================================================

// Fetch list of easy.sales records
export const fetchEasySalesOdoo = async ({ offset = 0, limit = 50, searchText = '' } = {}) => {
  try {
    const { headers, baseUrl } = await authenticateOdoo();
    let domain = [];
    if (searchText) {
      domain = ['|', ['name', 'ilike', searchText], ['partner_id.name', 'ilike', searchText]];
    }
    const response = await axios.post(
      `${baseUrl}/web/dataset/call_kw`,
      {
        jsonrpc: '2.0',
        method: 'call',
        params: {
          model: 'easy.sales',
          method: 'search_read',
          args: [domain],
          kwargs: { fields: [], offset, limit, order: 'id desc' },
        },
      },
      { headers }
    );
    if (response.data.error) {
      console.error('[EasySales] list error:', response.data.error?.data?.message || response.data.error);
      return [];
    }
    const records = response.data.result || [];
    console.log('[EasySales] Fetched', records.length, 'records');
    return records;
  } catch (error) {
    console.error('[EasySales] fetchEasySales error:', error?.message || error);
    return [];
  }
};

// Fetch a single easy.sales record by ID
export const fetchEasySaleDetailOdoo = async (saleId) => {
  try {
    const { headers, baseUrl } = await authenticateOdoo();
    const response = await axios.post(
      `${baseUrl}/web/dataset/call_kw`,
      {
        jsonrpc: '2.0',
        method: 'call',
        params: {
          model: 'easy.sales',
          method: 'read',
          args: [[saleId]],
          kwargs: { fields: [] },
        },
      },
      { headers }
    );
    if (response.data.error) {
      console.error('[EasySales] detail error:', response.data.error?.data?.message || response.data.error);
      return null;
    }
    const records = response.data.result || [];
    console.log('[EasySales] Detail record:', records.length > 0 ? records[0].name : 'not found');
    return records.length > 0 ? records[0] : null;
  } catch (error) {
    console.error('[EasySales] fetchEasySaleDetail error:', error?.message || error);
    return null;
  }
};

// Fetch easy.sales payment methods
export const fetchEasySalesPaymentMethodsOdoo = async () => {
  try {
    const { headers, baseUrl } = await authenticateOdoo();
    const response = await axios.post(
      `${baseUrl}/web/dataset/call_kw`,
      {
        jsonrpc: '2.0',
        method: 'call',
        params: {
          model: 'easy.sales.payment.method',
          method: 'search_read',
          args: [[]],
          kwargs: { fields: ['id', 'name', 'sequence', 'journal_id', 'is_default', 'is_customer_account'], limit: 50, order: 'sequence asc' },
        },
      },
      { headers }
    );
    if (response.data.error) {
      console.error('[EasySales] Payment methods error:', response.data.error?.data?.message || response.data.error);
      return [];
    }
    const records = response.data.result || [];
    console.log('[EasySales] Payment methods:', records.length);
    return records.map(r => ({
      id: r.id,
      name: r.name,
      label: r.name,
      journal_id: r.journal_id ? r.journal_id[0] : null,
      journal_name: r.journal_id ? r.journal_id[1] : '',
      is_default: r.is_default || false,
      is_customer_account: r.is_customer_account || false,
    }));
  } catch (error) {
    console.error('[EasySales] fetchPaymentMethods error:', error?.message || error);
    return [];
  }
};

// Discover easy.sales model fields
export const discoverEasySalesFieldsOdoo = async () => {
  try {
    const { headers, baseUrl } = await authenticateOdoo();
    const response = await axios.post(
      `${baseUrl}/web/dataset/call_kw`,
      {
        jsonrpc: '2.0',
        method: 'call',
        params: {
          model: 'easy.sales',
          method: 'fields_get',
          args: [],
          kwargs: { attributes: ['string', 'type', 'relation'] },
        },
      },
      { headers }
    );
    if (response.data.error) {
      console.error('[EasySales] fields_get error:', response.data.error?.data?.message);
      return null;
    }
    const fields = response.data.result || {};
    console.log('[EasySales] Model fields:', Object.keys(fields).join(', '));
    return fields;
  } catch (error) {
    console.error('[EasySales] discoverFields error:', error?.message || error);
    return null;
  }
};

// Create an easy.sales record
export const createEasySaleOdoo = async ({ partnerId, warehouseId, paymentMethodId, customerRef, orderLines }) => {
  try {
    const { headers, baseUrl } = await authenticateOdoo();

    // Discover field names first
    const fields = await discoverEasySalesFieldsOdoo();
    if (!fields) throw new Error('Could not discover easy.sales fields');

    const fieldNames = Object.keys(fields);
    console.log('[EasySales] Available fields:', fieldNames.filter(f => !f.startsWith('__')).join(', '));

    // Find the line relation field (one2many to easy.sales.line or similar)
    const lineField = fieldNames.find(f => fields[f].type === 'one2many' && (f.includes('line') || f.includes('order_line')));
    // Find payment method field
    const paymentField = fieldNames.find(f => f.includes('payment_method') && fields[f].type === 'many2one');
    // Find customer ref field
    const refField = fieldNames.find(f => f.includes('client_order_ref') || f.includes('customer_ref') || f.includes('reference'));

    console.log('[EasySales] Detected: lineField=', lineField, 'paymentField=', paymentField, 'refField=', refField);

    // Build vals
    const vals = { partner_id: partnerId };
    if (warehouseId && fieldNames.includes('warehouse_id')) vals.warehouse_id = warehouseId;
    if (paymentMethodId && paymentField) vals[paymentField] = paymentMethodId;
    if (customerRef && refField) vals[refField] = customerRef;

    // Build order lines
    if (lineField && orderLines && orderLines.length > 0) {
      // Discover line model fields
      const lineModel = fields[lineField].relation;
      let lineFieldDefs = null;
      if (lineModel) {
        try {
          const lfResp = await axios.post(
            `${baseUrl}/web/dataset/call_kw`,
            {
              jsonrpc: '2.0', method: 'call',
              params: { model: lineModel, method: 'fields_get', args: [], kwargs: { attributes: ['string', 'type'] } },
            },
            { headers }
          );
          lineFieldDefs = lfResp.data?.result || {};
          console.log('[EasySales] Line model:', lineModel, 'fields:', Object.keys(lineFieldDefs).join(', '));
        } catch (e) { console.warn('[EasySales] Could not get line fields:', e?.message); }
      }

      const lf = lineFieldDefs ? Object.keys(lineFieldDefs) : [];
      const qtyField = lf.find(f => f === 'product_uom_qty' || f === 'quantity' || f === 'qty') || 'product_uom_qty';
      const priceField = lf.find(f => f === 'price_unit' || f === 'unit_price') || 'price_unit';

      vals[lineField] = orderLines.map(line => [0, 0, {
        product_id: line.product_id,
        [qtyField]: line.qty || line.quantity || 1,
        [priceField]: line.price_unit || line.price || 0,
      }]);
    }

    console.log('[EasySales] Creating with vals:', JSON.stringify(vals).substring(0, 500));

    const response = await axios.post(
      `${baseUrl}/web/dataset/call_kw`,
      {
        jsonrpc: '2.0',
        method: 'call',
        params: {
          model: 'easy.sales',
          method: 'create',
          args: [vals],
          kwargs: {},
        },
      },
      { headers, withCredentials: true, timeout: 15000 }
    );

    if (response.data.error) {
      console.error('[EasySales] Create error:', response.data.error?.data?.message || response.data.error);
      throw new Error(response.data.error.data?.message || 'Failed to create easy sale');
    }

    const saleId = response.data.result;
    console.log('[EasySales] Created ID:', saleId);
    return saleId;
  } catch (error) {
    console.error('[EasySales] createEasySale error:', error?.message || error);
    throw error;
  }
};

// Confirm an easy.sales record
export const confirmEasySaleOdoo = async (saleId) => {
  try {
    const { headers, baseUrl } = await authenticateOdoo();
    const response = await axios.post(
      `${baseUrl}/web/dataset/call_kw`,
      {
        jsonrpc: '2.0',
        method: 'call',
        params: {
          model: 'easy.sales',
          method: 'action_confirm',
          args: [[saleId]],
          kwargs: {},
        },
      },
      { headers, withCredentials: true, timeout: 15000 }
    );
    if (response.data.error) {
      console.error('[EasySales] Confirm error:', response.data.error?.data?.message || response.data.error);
      throw new Error(response.data.error.data?.message || 'Failed to confirm easy sale');
    }
    console.log('[EasySales] Confirmed ID:', saleId);
    return response.data.result;
  } catch (error) {
    console.error('[EasySales] confirmEasySale error:', error?.message || error);
    throw error;
  }
};

// Fetch account.payment records from Odoo (customer or vendor)
export const fetchAccountPaymentsOdoo = async ({ paymentType = 'inbound', offset = 0, limit = 20, searchText = '' } = {}) => {
  try {
    const { headers, baseUrl } = await authenticateOdoo();
    console.log('[fetchAccountPayments] auth OK, paymentType:', paymentType);

    // Use empty domain first to see ALL payments, then filter by payment_type
    let domain = [['payment_type', '=', paymentType]];
    if (searchText) {
      domain = ['&', ['payment_type', '=', paymentType], '|', ['partner_id.name', 'ilike', searchText], ['name', 'ilike', searchText]];
    }

    // Use fields: [] to fetch ALL fields (avoids field name errors across Odoo versions)
    const response = await axios.post(
      `${baseUrl}/web/dataset/call_kw`,
      {
        jsonrpc: '2.0',
        method: 'call',
        params: {
          model: 'account.payment',
          method: 'search_read',
          args: [domain],
          kwargs: {
            fields: [],
            offset,
            limit,
            order: 'date desc, id desc',
          },
        },
      },
      { headers }
    );

    if (response.data.error) {
      console.error('[fetchAccountPayments] Odoo error:', JSON.stringify(response.data.error).substring(0, 500));
      return [];
    }

    const records = response.data.result || [];
    console.log('[fetchAccountPayments] Got', records.length, 'records for paymentType:', paymentType);

    if (records.length > 0) {
      console.log('[fetchAccountPayments] Sample keys:', Object.keys(records[0]).join(', '));
      console.log('[fetchAccountPayments] Sample:', JSON.stringify({
        id: records[0].id, name: records[0].name, payment_type: records[0].payment_type,
        state: records[0].state, amount: records[0].amount, partner_id: records[0].partner_id,
      }));
    } else {
      // Debug: try without domain filter to see if ANY payments exist
      console.log('[fetchAccountPayments] No records found. Trying without filter...');
      const debugResp = await axios.post(
        `${baseUrl}/web/dataset/call_kw`,
        {
          jsonrpc: '2.0',
          method: 'call',
          params: {
            model: 'account.payment',
            method: 'search_read',
            args: [[]],
            kwargs: { fields: ['id', 'name', 'payment_type', 'state', 'amount'], offset: 0, limit: 5 },
          },
        },
        { headers }
      );
      const debugRecords = debugResp.data?.result || [];
      console.log('[fetchAccountPayments] DEBUG all payments:', debugRecords.length, 'records');
      if (debugRecords.length > 0) {
        console.log('[fetchAccountPayments] DEBUG payment_types found:', debugRecords.map(r => r.payment_type));
        console.log('[fetchAccountPayments] DEBUG sample:', JSON.stringify(debugRecords[0]));
      }
    }

    return records.map(p => ({
      id: p.id,
      name: p.name || p.display_name || '',
      partner_name: p.partner_id ? p.partner_id[1] : '',
      partner_id: p.partner_id ? p.partner_id[0] : null,
      amount: p.amount || 0,
      date: p.date || '',
      state: p.state || '',
      payment_type: p.payment_type || '',
      journal_name: p.journal_id ? p.journal_id[1] : '',
      ref: p.ref || p.memo || '',
      location_name: p.location_name || '',
      latitude: p.latitude || null,
      longitude: p.longitude || null,
    }));
  } catch (error) {
    console.error('[fetchAccountPayments] FATAL error:', error?.message || error);
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
  employeeSignature = null,
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

    // Step 2: Build vals (amount must always be positive in Odoo)
    const vals = {
      amount: Math.abs(amount) || 0,
      payment_type: paymentType,
      partner_type: paymentType === 'inbound' ? 'customer' : 'supplier',
    };
    if (partnerId) vals.partner_id = partnerId;
    if (journalId) vals.journal_id = journalId;
    if (ref) vals.memo = ref;

    // Handle customer/vendor signature (base64 data URI → raw base64)
    if (customerSignature) {
      const sigMatch = customerSignature.match(/^data:image\/[^;]+;base64,(.+)$/);
      vals.customer_signature = sigMatch ? sigMatch[1] : customerSignature;
    }

    // Handle employee signature
    if (employeeSignature) {
      const empSigMatch = employeeSignature.match(/^data:image\/[^;]+;base64,(.+)$/);
      vals.employee_signature = empSigMatch ? empSigMatch[1] : employeeSignature;
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

// ============================================================
// POS API Functions
// ============================================================

// Helper: Full Odoo authentication (returns headers with session cookie)
const authenticateOdoo = async () => {
  const baseUrl = (ODOO_BASE_URL || '').replace(/\/$/, '');
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
  return { headers, baseUrl };
};

// Fetch POS configurations from Odoo
export const fetchPosConfigsOdoo = async () => {
  try {
    const headers = await getOdooAuthHeaders();
    const response = await axios.post(
      `${ODOO_BASE_URL}/web/dataset/call_kw`,
      {
        jsonrpc: '2.0',
        method: 'call',
        params: {
          model: 'pos.config',
          method: 'search_read',
          args: [[]],
          kwargs: {
            fields: ['id', 'name', 'current_session_id', 'current_session_state'],
            limit: 50,
          },
        },
      },
      { headers }
    );
    if (response.data.error) {
      console.error('Odoo JSON-RPC error (pos.config):', response.data.error);
      return [];
    }
    return (response.data.result || []).map(c => ({
      id: c.id,
      name: c.name || '',
      current_session_id: c.current_session_id ? c.current_session_id[0] : null,
      current_session_state: c.current_session_state || null,
    }));
  } catch (error) {
    console.error('fetchPosConfigsOdoo error:', error?.message || error);
    return [];
  }
};

// Open a POS session in Odoo
export const openPosSessionOdoo = async ({ posConfigId, openingBalance = 0 }) => {
  try {
    const { headers, baseUrl } = await authenticateOdoo();
    // Use open_ui on pos.config which opens/creates a session
    const response = await axios.post(
      `${baseUrl}/web/dataset/call_kw`,
      {
        jsonrpc: '2.0',
        method: 'call',
        params: {
          model: 'pos.config',
          method: 'open_ui',
          args: [[posConfigId]],
          kwargs: {},
        },
      },
      { headers, withCredentials: true, timeout: 15000 }
    );
    if (response.data.error) {
      console.error('Odoo JSON-RPC error (open POS session):', response.data.error);
      throw new Error(response.data.error.data?.message || 'Failed to open POS session');
    }
    // After open_ui, fetch the newly opened session
    const sessionResp = await axios.post(
      `${baseUrl}/web/dataset/call_kw`,
      {
        jsonrpc: '2.0',
        method: 'call',
        params: {
          model: 'pos.session',
          method: 'search_read',
          args: [[['config_id', '=', posConfigId], ['state', '=', 'opened']]],
          kwargs: {
            fields: ['id', 'name', 'config_id', 'state', 'start_at'],
            limit: 1,
          },
        },
      },
      { headers, withCredentials: true }
    );
    const sessions = sessionResp.data.result || [];
    if (sessions.length > 0) {
      return {
        id: sessions[0].id,
        name: sessions[0].name,
        config_id: sessions[0].config_id ? sessions[0].config_id[0] : posConfigId,
        state: sessions[0].state,
      };
    }
    return response.data.result;
  } catch (error) {
    console.error('openPosSessionOdoo error:', error?.message || error);
    throw error;
  }
};

// Close a POS session in Odoo
export const closePosSessionOdoo = async ({ sessionId }) => {
  try {
    const { headers, baseUrl } = await authenticateOdoo();
    const response = await axios.post(
      `${baseUrl}/web/dataset/call_kw`,
      {
        jsonrpc: '2.0',
        method: 'call',
        params: {
          model: 'pos.session',
          method: 'action_pos_session_closing_control',
          args: [[sessionId]],
          kwargs: {},
        },
      },
      { headers, withCredentials: true, timeout: 15000 }
    );
    if (response.data.error) {
      console.error('Odoo JSON-RPC error (close POS session):', response.data.error);
      throw new Error(response.data.error.data?.message || 'Failed to close POS session');
    }
    return response.data.result;
  } catch (error) {
    console.error('closePosSessionOdoo error:', error?.message || error);
    throw error;
  }
};

// Fetch open POS sessions from Odoo
export const fetchOpenPosSessionOdoo = async () => {
  try {
    const headers = await getOdooAuthHeaders();
    const response = await axios.post(
      `${ODOO_BASE_URL}/web/dataset/call_kw`,
      {
        jsonrpc: '2.0',
        method: 'call',
        params: {
          model: 'pos.session',
          method: 'search_read',
          args: [[['state', '=', 'opened']]],
          kwargs: {
            fields: ['id', 'name', 'config_id', 'state', 'start_at', 'cash_register_balance_start'],
            limit: 10,
          },
        },
      },
      { headers }
    );
    if (response.data.error) {
      console.error('Odoo JSON-RPC error (open POS sessions):', response.data.error);
      return [];
    }
    return (response.data.result || []).map(s => ({
      id: s.id,
      name: s.name || '',
      config_id: s.config_id ? s.config_id[0] : null,
      config_name: s.config_id ? s.config_id[1] : '',
      state: s.state,
      start_at: s.start_at || '',
      opening_balance: s.cash_register_balance_start || 0,
    }));
  } catch (error) {
    console.error('fetchOpenPosSessionOdoo error:', error?.message || error);
    return [];
  }
};

// Create a POS order in Odoo
export const createPosOrderOdoo = async ({ sessionId, partnerId, lines }) => {
  try {
    const { headers, baseUrl } = await authenticateOdoo();

    // Calculate totals from lines
    let amountTotal = 0;
    let amountTax = 0;
    const orderLines = lines.map(line => {
      const qty = line.qty || line.quantity || 1;
      const priceUnit = line.price || line.price_unit || 0;
      const subtotal = qty * priceUnit;
      amountTotal += subtotal;
      return [0, 0, {
        product_id: line.product_id || line.id,
        qty: qty,
        price_unit: priceUnit,
        price_subtotal: subtotal,
        price_subtotal_incl: subtotal,
      }];
    });

    const vals = {
      session_id: sessionId,
      amount_total: amountTotal,
      amount_tax: amountTax,
      amount_paid: 0,
      amount_return: 0,
      lines: orderLines,
    };
    if (partnerId) vals.partner_id = partnerId;

    const response = await axios.post(
      `${baseUrl}/web/dataset/call_kw`,
      {
        jsonrpc: '2.0',
        method: 'call',
        params: {
          model: 'pos.order',
          method: 'create',
          args: [vals],
          kwargs: {},
        },
      },
      { headers, withCredentials: true, timeout: 15000 }
    );

    if (response.data.error) {
      console.error('Odoo JSON-RPC error (create POS order):', response.data.error);
      throw new Error(response.data.error.data?.message || 'Failed to create POS order');
    }

    console.log('[createPosOrderOdoo] Created order ID:', response.data.result);
    return { result: response.data.result };
  } catch (error) {
    console.error('createPosOrderOdoo error:', error?.message || error);
    throw error;
  }
};

// Create a POS payment in Odoo
export const createPosPaymentOdoo = async ({ orderId, amount, paymentMethodId }) => {
  try {
    const { headers, baseUrl } = await authenticateOdoo();

    const vals = {
      pos_order_id: orderId,
      amount: amount,
      payment_method_id: paymentMethodId,
    };

    const response = await axios.post(
      `${baseUrl}/web/dataset/call_kw`,
      {
        jsonrpc: '2.0',
        method: 'call',
        params: {
          model: 'pos.payment',
          method: 'create',
          args: [vals],
          kwargs: {},
        },
      },
      { headers, withCredentials: true, timeout: 15000 }
    );

    if (response.data.error) {
      console.error('Odoo JSON-RPC error (create POS payment):', response.data.error);
      throw new Error(response.data.error.data?.message || 'Failed to create POS payment');
    }

    // Mark the order as paid
    try {
      await axios.post(
        `${baseUrl}/web/dataset/call_kw`,
        {
          jsonrpc: '2.0',
          method: 'call',
          params: {
            model: 'pos.order',
            method: 'action_pos_order_paid',
            args: [[orderId]],
            kwargs: {},
          },
        },
        { headers, withCredentials: true, timeout: 15000 }
      );
    } catch (paidErr) {
      console.warn('action_pos_order_paid failed (non-critical):', paidErr?.message);
    }

    console.log('[createPosPaymentOdoo] Created payment ID:', response.data.result);
    return { result: response.data.result };
  } catch (error) {
    console.error('createPosPaymentOdoo error:', error?.message || error);
    throw error;
  }
};

// Fetch POS payment methods from Odoo
export const fetchPosPaymentMethodsOdoo = async () => {
  try {
    const headers = await getOdooAuthHeaders();
    const response = await axios.post(
      `${ODOO_BASE_URL}/web/dataset/call_kw`,
      {
        jsonrpc: '2.0',
        method: 'call',
        params: {
          model: 'pos.payment.method',
          method: 'search_read',
          args: [[]],
          kwargs: {
            fields: ['id', 'name', 'type'],
            limit: 50,
          },
        },
      },
      { headers }
    );
    if (response.data.error) {
      console.error('Odoo JSON-RPC error (pos.payment.method):', response.data.error);
      return [];
    }
    return (response.data.result || []).map(m => ({
      id: m.id,
      name: m.name || '',
      type: m.type || '',
    }));
  } catch (error) {
    console.error('fetchPosPaymentMethodsOdoo error:', error?.message || error);
    return [];
  }
};

// Fetch taxes from Odoo (sale taxes)
export const fetchTaxesOdoo = async () => {
  try {
    const headers = await getOdooAuthHeaders();
    const response = await axios.post(
      `${ODOO_BASE_URL}/web/dataset/call_kw`,
      {
        jsonrpc: '2.0',
        method: 'call',
        params: {
          model: 'account.tax',
          method: 'search_read',
          args: [[['type_tax_use', '=', 'sale']]],
          kwargs: {
            fields: ['id', 'name', 'amount', 'type_tax_use', 'price_include'],
            limit: 50,
          },
        },
      },
      { headers }
    );
    if (response.data.error) {
      console.error('Odoo JSON-RPC error (account.tax):', response.data.error);
      return [];
    }
    return (response.data.result || []).map(t => ({
      id: t.id,
      name: t.name || '',
      amount: t.amount || 0,
      type_tax_use: t.type_tax_use || '',
      price_include: t.price_include || false,
    }));
  } catch (error) {
    console.error('fetchTaxesOdoo error:', error?.message || error);
    return [];
  }
};

// ============================================================
// Sales Order API Functions
// ============================================================

// Create a Sale Order (Quotation) in Odoo
export const createSaleOrderOdoo = async ({ partnerId, orderLines, warehouseId }) => {
  try {
    const { headers, baseUrl } = await authenticateOdoo();

    const lines = orderLines.map(line => [0, 0, {
      product_id: line.product_id || line.id,
      product_uom_qty: line.qty || line.quantity || line.product_uom_qty || 1,
      price_unit: line.price_unit || line.price || line.unit_price || 0,
      discount: line.discount || line.discount_percentage || 0,
    }]);

    const vals = {
      partner_id: partnerId,
      order_line: lines,
    };
    if (warehouseId) vals.warehouse_id = warehouseId;

    const response = await axios.post(
      `${baseUrl}/web/dataset/call_kw`,
      {
        jsonrpc: '2.0',
        method: 'call',
        params: {
          model: 'sale.order',
          method: 'create',
          args: [vals],
          kwargs: {},
        },
      },
      { headers, withCredentials: true, timeout: 15000 }
    );

    if (response.data.error) {
      console.error('Odoo JSON-RPC error (create sale order):', response.data.error);
      throw new Error(response.data.error.data?.message || 'Failed to create sale order');
    }

    console.log('[createSaleOrderOdoo] Created sale order ID:', response.data.result);
    return response.data.result;
  } catch (error) {
    console.error('createSaleOrderOdoo error:', error?.message || error);
    throw error;
  }
};

// Confirm a Sale Order (Quotation → Sale Order) in Odoo
export const confirmSaleOrderOdoo = async (orderId) => {
  try {
    const { headers, baseUrl } = await authenticateOdoo();
    const response = await axios.post(
      `${baseUrl}/web/dataset/call_kw`,
      {
        jsonrpc: '2.0',
        method: 'call',
        params: {
          model: 'sale.order',
          method: 'action_confirm',
          args: [[orderId]],
          kwargs: {},
        },
      },
      { headers, withCredentials: true, timeout: 15000 }
    );
    if (response.data.error) {
      console.error('Odoo JSON-RPC error (confirm sale order):', response.data.error);
      throw new Error(response.data.error.data?.message || 'Failed to confirm sale order');
    }
    console.log('[confirmSaleOrderOdoo] Confirmed order ID:', orderId);
    return response.data.result;
  } catch (error) {
    console.error('confirmSaleOrderOdoo error:', error?.message || error);
    throw error;
  }
};

// Create Invoice from a confirmed Sale Order in Odoo
export const createInvoiceFromQuotationOdoo = async (orderId) => {
  try {
    const { headers, baseUrl } = await authenticateOdoo();

    // First confirm the order if not already confirmed
    try {
      await axios.post(
        `${baseUrl}/web/dataset/call_kw`,
        {
          jsonrpc: '2.0',
          method: 'call',
          params: {
            model: 'sale.order',
            method: 'action_confirm',
            args: [[orderId]],
            kwargs: {},
          },
        },
        { headers, withCredentials: true, timeout: 15000 }
      );
      console.log('[createInvoice] Order confirmed:', orderId);
    } catch (confirmErr) {
      console.warn('[createInvoice] Order confirm skipped (may already be confirmed):', confirmErr?.message);
    }

    // Create invoice via sale.advance.payment.inv wizard (works in Odoo 17/18/19)
    // Step 1: Create the wizard
    const wizardResp = await axios.post(
      `${baseUrl}/web/dataset/call_kw`,
      {
        jsonrpc: '2.0',
        method: 'call',
        params: {
          model: 'sale.advance.payment.inv',
          method: 'create',
          args: [{ advance_payment_method: 'delivered' }],
          kwargs: { context: { active_ids: [orderId], active_model: 'sale.order', active_id: orderId } },
        },
      },
      { headers, withCredentials: true, timeout: 15000 }
    );

    if (wizardResp.data.error) {
      console.error('[createInvoice] Wizard create error:', wizardResp.data.error?.data?.message || wizardResp.data.error);
      throw new Error(wizardResp.data.error.data?.message || 'Failed to create invoice wizard');
    }

    const wizardId = wizardResp.data.result;
    console.log('[createInvoice] Wizard created:', wizardId);

    // Step 2: Execute the wizard to create the invoice
    const invoiceResp = await axios.post(
      `${baseUrl}/web/dataset/call_kw`,
      {
        jsonrpc: '2.0',
        method: 'call',
        params: {
          model: 'sale.advance.payment.inv',
          method: 'create_invoices',
          args: [[wizardId]],
          kwargs: { context: { active_ids: [orderId], active_model: 'sale.order', active_id: orderId } },
        },
      },
      { headers, withCredentials: true, timeout: 15000 }
    );

    if (invoiceResp.data.error) {
      console.error('[createInvoice] Invoice create error:', invoiceResp.data.error?.data?.message || invoiceResp.data.error);
      throw new Error(invoiceResp.data.error.data?.message || 'Failed to create invoice');
    }

    console.log('[createInvoice] Invoice result:', JSON.stringify(invoiceResp.data.result).substring(0, 300));

    // The wizard returns an action; try to extract invoice ID from the sale order
    let invoiceId = null;
    try {
      const soResp = await axios.post(
        `${baseUrl}/web/dataset/call_kw`,
        {
          jsonrpc: '2.0',
          method: 'call',
          params: {
            model: 'sale.order',
            method: 'read',
            args: [[orderId], ['invoice_ids']],
            kwargs: {},
          },
        },
        { headers, withCredentials: true, timeout: 15000 }
      );
      const invoiceIds = soResp.data?.result?.[0]?.invoice_ids || [];
      invoiceId = invoiceIds.length > 0 ? invoiceIds[invoiceIds.length - 1] : null;
      console.log('[createInvoice] Invoice IDs on SO:', invoiceIds, 'using:', invoiceId);
    } catch (readErr) {
      console.warn('[createInvoice] Could not read invoice_ids:', readErr?.message);
    }

    return { result: invoiceId || true };
  } catch (error) {
    console.error('[createInvoice] Error:', error?.message || error);
    throw error;
  }
};

// Fetch Customer Invoices from Odoo
export const fetchCustomerInvoicesOdoo = async ({ partnerId, offset = 0, limit = 50 } = {}) => {
  try {
    const headers = await getOdooAuthHeaders();
    let domain = [['move_type', '=', 'out_invoice']];
    if (partnerId) {
      domain = [['move_type', '=', 'out_invoice'], ['partner_id', '=', partnerId]];
    }
    const response = await axios.post(
      `${ODOO_BASE_URL}/web/dataset/call_kw`,
      {
        jsonrpc: '2.0',
        method: 'call',
        params: {
          model: 'account.move',
          method: 'search_read',
          args: [domain],
          kwargs: {
            fields: ['id', 'name', 'partner_id', 'invoice_date', 'amount_total', 'amount_residual', 'state', 'payment_state', 'currency_id'],
            offset,
            limit,
            order: 'invoice_date desc',
          },
        },
      },
      { headers }
    );
    if (response.data.error) {
      console.error('Odoo JSON-RPC error (customer invoices):', response.data.error);
      return [];
    }
    return (response.data.result || []).map(inv => ({
      id: inv.id,
      name: inv.name || '',
      partner_id: inv.partner_id ? inv.partner_id[0] : null,
      partner_name: inv.partner_id ? inv.partner_id[1] : '',
      invoice_date: inv.invoice_date || '',
      amount_total: inv.amount_total || 0,
      amount_residual: inv.amount_residual || 0,
      state: inv.state || '',
      payment_state: inv.payment_state || '',
      currency_name: inv.currency_id ? inv.currency_id[1] : '',
    }));
  } catch (error) {
    console.error('fetchCustomerInvoicesOdoo error:', error?.message || error);
    return [];
  }
};

// ============================================================
// Spare Management API Functions (mobile.repair module in Odoo)
// ============================================================

// Fetch spare part requests from Odoo
export const fetchSparePartRequestsOdoo = async ({ offset = 0, limit = 20, searchText = '' } = {}) => {
  try {
    const { headers, baseUrl } = await authenticateOdoo();
    let domain = [];
    if (searchText) {
      domain = [['name', 'ilike', searchText]];
    }
    const response = await axios.post(
      `${baseUrl}/web/dataset/call_kw`,
      {
        jsonrpc: '2.0',
        method: 'call',
        params: {
          model: 'spare.part.request',
          method: 'search_read',
          args: [domain],
          kwargs: {
            fields: [],
            offset,
            limit,
            order: 'create_date desc',
          },
        },
      },
      { headers }
    );
    if (response.data.error) {
      console.error('Odoo JSON-RPC error (spare.part.request):', response.data.error);
      return [];
    }
    const records = response.data.result || [];
    if (records.length > 0) {
      console.log('spare.part.request fields:', Object.keys(records[0]));
    }
    return records.map(r => ({
      id: r.id,
      name: r.name || r.display_name || '',
      job_card_id: r.job_card_id ? r.job_card_id[0] : null,
      job_card_name: r.job_card_id ? r.job_card_id[1] : '',
      partner_id: r.partner_id ? r.partner_id[0] : (r.customer_id ? r.customer_id[0] : null),
      partner_name: r.partner_id ? r.partner_id[1] : (r.customer_id ? r.customer_id[1] : ''),
      state: r.state || r.stage || '',
      requested_by: r.requested_by ? r.requested_by[1] : (r.request_by ? r.request_by[1] : ''),
      requested_to: r.requested_to ? r.requested_to[1] : (r.request_to ? r.request_to[1] : ''),
      request_date: r.request_date || r.date || r.create_date || '',
      notes: r.notes || r.note || '',
      line_count: Array.isArray(r.spare_parts_line) ? r.spare_parts_line.length : (Array.isArray(r.line_ids) ? r.line_ids.length : (Array.isArray(r.spare_line_ids) ? r.spare_line_ids.length : 0)),
    }));
  } catch (error) {
    console.error('fetchSparePartRequestsOdoo error:', error?.message || error);
    return [];
  }
};

// Fetch spare part request details from Odoo
export const fetchSparePartRequestDetailsOdoo = async (requestId) => {
  try {
    const { headers, baseUrl } = await authenticateOdoo();
    // Read all fields (empty array = all) to handle varying field names
    const response = await axios.post(
      `${baseUrl}/web/dataset/call_kw`,
      {
        jsonrpc: '2.0',
        method: 'call',
        params: {
          model: 'spare.part.request',
          method: 'read',
          args: [[requestId]],
          kwargs: { fields: [] },
        },
      },
      { headers }
    );
    if (response.data.error) {
      console.error('Odoo JSON-RPC error (spare part request detail):', response.data.error);
      return null;
    }
    const r = (response.data.result || [])[0];
    if (!r) return null;

    console.log('SpareRequestDetails all fields:', Object.keys(r));

    // Helper to extract Many2one display name
    const m2oName = (val) => {
      if (!val || val === false) return '';
      if (Array.isArray(val)) return val[1] || '';
      return String(val);
    };
    const m2oId = (val) => {
      if (!val || val === false) return null;
      if (Array.isArray(val)) return val[0];
      return val;
    };

    // Helper to find first truthy value from multiple field candidates
    const findVal = (candidates) => {
      for (const f of candidates) {
        if (r[f] !== undefined && r[f] !== false) return r[f];
      }
      return null;
    };

    // Find line IDs from multiple possible field names
    const lineIds = findVal(['spare_parts_line', 'line_ids', 'spare_line_ids', 'order_line']) || [];

    // Fetch spare parts line details if line IDs exist
    let spareLines = [];
    if (lineIds.length > 0) {
      try {
        const lineResponse = await axios.post(
          `${baseUrl}/web/dataset/call_kw`,
          {
            jsonrpc: '2.0',
            method: 'call',
            params: {
              model: 'spare.part.request.line',
              method: 'read',
              args: [lineIds],
              kwargs: { fields: [] },
            },
          },
          { headers }
        );
        if (!lineResponse.data.error) {
          const lineResults = lineResponse.data.result || [];

          // Helper for line qty fields
          const getLineField = (l, candidates, def = 0) => {
            for (const f of candidates) {
              if (l[f] !== undefined && l[f] !== false) return l[f];
            }
            return def;
          };

          spareLines = lineResults.map(l => ({
            id: l.id,
            product_id: l.product_id ? l.product_id[0] : null,
            product_name: l.product_id ? l.product_id[1] : '',
            description: l.description || l.name || '',
            requested_qty: getLineField(l, ['requested_qty', 'qty_requested', 'qty', 'product_qty', 'quantity', 'product_uom_qty'], 0),
            uom: m2oName(l.uom_id || l.product_uom) || l.uom || 'Units',
            issued_qty: getLineField(l, ['issued_qty', 'qty_issued', 'issue_qty'], 0),
            returned_qty: getLineField(l, ['returned_qty', 'qty_returned', 'return_qty'], 0),
          }));
        }
      } catch (lineErr) {
        console.warn('Failed to fetch spare part lines:', lineErr?.message);
      }
    }

    const requestedBy = findVal(['requested_by', 'requested_by_id', 'request_by', 'request_user_id', 'user_id']);
    const requestedTo = findVal(['requested_to', 'requested_to_id', 'request_to', 'assigned_to']);
    const approvedBy = findVal(['approved_by', 'approved_by_id', 'approve_by']);
    const approvedDate = findVal(['approved_date', 'approve_date', 'date_approved']);

    return {
      id: r.id,
      name: r.name || r.display_name || '',
      job_card_id: m2oId(r.job_card_id),
      job_card_name: m2oName(r.job_card_id),
      partner_id: m2oId(r.partner_id || r.customer_id),
      partner_name: m2oName(r.partner_id || r.customer_id),
      state: r.state || r.stage || '',
      requested_by: m2oName(requestedBy),
      requested_by_id: m2oId(requestedBy),
      requested_to: m2oName(requestedTo),
      requested_to_id: m2oId(requestedTo),
      request_date: r.request_date || r.date_request || r.create_date || '',
      notes: r.notes || r.note || r.description || '',
      approved_by: m2oName(approvedBy),
      approved_date: approvedDate || '',
      spare_lines: spareLines,
    };
  } catch (error) {
    console.error('fetchSparePartRequestDetailsOdoo error:', error?.message || error);
    return null;
  }
};

// Create a spare part request in Odoo
export const createSparePartRequestOdoo = async ({
  jobCardId,
  customerId,
  requestedById,
  requestedToId,
  requestDate,
  notes,
  lines = [],
}) => {
  try {
    const { headers, baseUrl } = await authenticateOdoo();

    // Step 1: Discover actual field names via fields_get
    const fieldsResponse = await axios.post(
      `${baseUrl}/web/dataset/call_kw`,
      {
        jsonrpc: '2.0',
        method: 'call',
        params: {
          model: 'spare.part.request',
          method: 'fields_get',
          args: [],
          kwargs: { attributes: ['string', 'type', 'relation'] },
        },
      },
      { headers, withCredentials: true, timeout: 15000 }
    );

    const fieldDefs = fieldsResponse.data?.result || {};
    const fieldNames = Object.keys(fieldDefs);
    console.log('spare.part.request all fields:', fieldNames);

    // Find the One2many line field
    const one2manyFields = fieldNames.filter(f => fieldDefs[f].type === 'one2many');
    console.log('spare.part.request One2many fields:', one2manyFields);

    // Find the line relation model name
    const lineFieldName = one2manyFields.find(f =>
      f.includes('line') || f.includes('spare') || f.includes('part')
    ) || one2manyFields[0] || null;
    const lineModel = lineFieldName ? fieldDefs[lineFieldName].relation : null;
    console.log('Line field:', lineFieldName, '-> model:', lineModel);

    // Step 2: Build vals with discovered field names
    const vals = {};

    // Map header fields - try known field names
    const trySet = (possible, value) => {
      for (const f of possible) {
        if (fieldNames.includes(f)) { vals[f] = value; return; }
      }
    };

    if (jobCardId) trySet(['job_card_id', 'jobcard_id', 'job_card'], jobCardId);
    if (customerId) trySet(['partner_id', 'customer_id', 'client_id'], customerId);
    if (requestedById) trySet(['requested_by', 'request_by', 'requester_id', 'user_id'], requestedById);
    if (requestedToId) trySet(['requested_to', 'request_to', 'assigned_to', 'responsible_id'], requestedToId);
    if (requestDate) trySet(['request_date', 'date', 'date_request', 'date_requested'], requestDate);
    if (notes) trySet(['notes', 'note', 'description', 'internal_notes'], notes);

    // Step 3: Build One2many lines if we found the field
    if (lines.length > 0 && lineFieldName && lineModel) {
      // Discover line model fields too
      const lineFieldsResp = await axios.post(
        `${baseUrl}/web/dataset/call_kw`,
        {
          jsonrpc: '2.0',
          method: 'call',
          params: {
            model: lineModel,
            method: 'fields_get',
            args: [],
            kwargs: { attributes: ['string', 'type'] },
          },
        },
        { headers, withCredentials: true, timeout: 15000 }
      );
      const lineFields = Object.keys(lineFieldsResp.data?.result || {});
      console.log(`${lineModel} fields:`, lineFields);

      const findLineField = (possible) => possible.find(f => lineFields.includes(f)) || null;
      const prodField = findLineField(['product_id', 'spare_part_id', 'part_id']);
      const descField = findLineField(['description', 'name', 'desc', 'note']);
      const qtyField = findLineField(['requested_qty', 'quantity', 'qty', 'product_qty', 'req_qty']);

      vals[lineFieldName] = lines.map(l => {
        const lineVals = {};
        if (prodField && l.product_id) lineVals[prodField] = l.product_id;
        if (descField && l.description) lineVals[descField] = l.description;
        if (qtyField) lineVals[qtyField] = l.requested_qty || 1;
        return [0, 0, lineVals];
      });
    }

    console.log('Creating spare.part.request with vals:', JSON.stringify(vals));

    // Step 4: Create the record
    const response = await axios.post(
      `${baseUrl}/web/dataset/call_kw`,
      {
        jsonrpc: '2.0',
        method: 'call',
        params: {
          model: 'spare.part.request',
          method: 'create',
          args: [vals],
          kwargs: {},
        },
      },
      { headers, withCredentials: true, timeout: 15000 }
    );
    if (response.data.error) {
      throw new Error(response.data.error.data?.message || 'Failed to create spare part request');
    }
    const newId = response.data.result;

    // Step 5: Transition from draft to requested
    if (newId) {
      const submitMethods = ['action_request', 'action_submit', 'action_confirm', 'button_request', 'button_submit'];
      for (const method of submitMethods) {
        try {
          const submitResp = await axios.post(
            `${baseUrl}/web/dataset/call_kw`,
            {
              jsonrpc: '2.0',
              method: 'call',
              params: {
                model: 'spare.part.request',
                method: method,
                args: [[newId]],
                kwargs: {},
              },
            },
            { headers, withCredentials: true, timeout: 10000 }
          );
          if (!submitResp.data.error) {
            console.log(`State transition success using method: ${method}`);
            break;
          }
        } catch (e) {
          console.warn(`Method ${method} failed:`, e?.message);
        }
      }
    }

    return newId;
  } catch (error) {
    console.error('createSparePartRequestOdoo error:', error?.message || error);
    throw error;
  }
};

// Fetch spare part products from Odoo
export const fetchSparePartProductsOdoo = async ({ offset = 0, limit = 20, searchText = '' } = {}) => {
  try {
    const headers = await getOdooAuthHeaders();
    let domain = [];
    if (searchText) {
      domain.push(['name', 'ilike', searchText]);
    }
    const response = await axios.post(
      `${ODOO_BASE_URL}/web/dataset/call_kw`,
      {
        jsonrpc: '2.0',
        method: 'call',
        params: {
          model: 'product.product',
          method: 'search_read',
          args: [domain],
          kwargs: {
            fields: ['id', 'name', 'default_code', 'list_price', 'qty_available'],
            offset,
            limit,
            order: 'name asc',
          },
        },
      },
      { headers }
    );
    if (response.data.error) {
      console.error('Odoo JSON-RPC error (spare part products):', response.data.error);
      return [];
    }
    return (response.data.result || []).map(p => ({
      id: p.id,
      name: p.name || p.display_name || '',
      default_code: p.default_code || '',
      list_price: p.list_price || 0,
      qty_available: p.qty_available || 0,
    }));
  } catch (error) {
    console.error('fetchSparePartProductsOdoo error:', error?.message || error);
    return [];
  }
};

// Fetch job cards from Odoo
export const fetchJobCardsOdoo = async ({ offset = 0, limit = 20, searchText = '' } = {}) => {
  try {
    const headers = await getOdooAuthHeaders();
    let domain = [];
    if (searchText) {
      domain = [['name', 'ilike', searchText]];
    }

    // Try multiple possible model names
    const modelNames = ['mobile.repair.job.card', 'job.card', 'repair.order'];
    let lastError = null;

    for (const modelName of modelNames) {
      try {
        const response = await axios.post(
          `${ODOO_BASE_URL}/web/dataset/call_kw`,
          {
            jsonrpc: '2.0',
            method: 'call',
            params: {
              model: modelName,
              method: 'search_read',
              args: [domain],
              kwargs: {
                fields: [],
                offset,
                limit,
                order: 'create_date desc',
              },
            },
          },
          { headers }
        );
        if (response.data.error) {
          console.warn(`Job card model "${modelName}" failed:`, response.data.error?.data?.message || response.data.error);
          lastError = response.data.error;
          continue;
        }
        const records = response.data.result || [];
        console.log(`Job card model "${modelName}" found ${records.length} records. Fields:`, records.length > 0 ? Object.keys(records[0]) : 'none');
        return records.map(jc => ({
          id: jc.id,
          name: jc.name || jc.display_name || '',
          partner_id: jc.partner_id ? jc.partner_id[0] : (jc.customer_id ? jc.customer_id[0] : null),
          partner_name: jc.partner_id ? jc.partner_id[1] : (jc.customer_id ? jc.customer_id[1] : ''),
          stage: jc.stage_id ? jc.stage_id[1] : (jc.state || ''),
          create_date: jc.create_date || '',
        }));
      } catch (innerErr) {
        console.warn(`Job card model "${modelName}" threw:`, innerErr?.message);
        lastError = innerErr;
        continue;
      }
    }
    console.error('fetchJobCardsOdoo: No valid model found. Last error:', lastError);
    return [];
  } catch (error) {
    console.error('fetchJobCardsOdoo error:', error?.message || error);
    return [];
  }
};

// Approve a spare part request in Odoo
export const approveSparePartRequestOdoo = async (requestId) => {
  try {
    const { headers, baseUrl } = await authenticateOdoo();

    // Try multiple action method names
    const methodsToTry = ['action_approve', 'action_approved', 'button_approve', 'action_confirm', 'button_confirm'];
    for (const method of methodsToTry) {
      try {
        const r = await axios.post(`${baseUrl}/web/dataset/call_kw`, {
          jsonrpc: '2.0', method: 'call',
          params: { model: 'spare.part.request', method, args: [[requestId]], kwargs: {} },
        }, { headers, withCredentials: true, timeout: 15000 });
        if (!r.data.error) {
          console.log(`Approve success via method: ${method}`);
          return r.data.result;
        }
      } catch (e) {
        console.warn(`Approve method ${method} failed`);
      }
    }

    // Fallback: direct state write to 'approved'
    console.log('Trying direct state write to approved');
    const r = await axios.post(`${baseUrl}/web/dataset/call_kw`, {
      jsonrpc: '2.0', method: 'call',
      params: { model: 'spare.part.request', method: 'write', args: [[requestId], { state: 'approved' }], kwargs: {} },
    }, { headers, withCredentials: true, timeout: 15000 });
    if (!r.data.error) {
      console.log('Direct state write to approved success');
      return r.data.result;
    }

    throw new Error('Failed to approve request - all methods failed');
  } catch (error) {
    console.error('approveSparePartRequestOdoo error:', error?.message || error);
    throw error;
  }
};

// Fetch approved spare part requests for issue linking
export const fetchApprovedSpareRequestsOdoo = async ({ limit = 50 } = {}) => {
  try {
    const { headers, baseUrl } = await authenticateOdoo();
    // Fetch all requests (not filtered by state) since state values vary across Odoo setups
    const response = await axios.post(
      `${baseUrl}/web/dataset/call_kw`,
      {
        jsonrpc: '2.0',
        method: 'call',
        params: {
          model: 'spare.part.request',
          method: 'search_read',
          args: [[]],
          kwargs: { fields: [], offset: 0, limit, order: 'create_date desc' },
        },
      },
      { headers }
    );
    if (response.data.error) {
      console.error('fetchApprovedSpareRequestsOdoo error:', response.data.error);
      return [];
    }
    const records = response.data.result || [];
    if (records.length > 0) {
      console.log('Spare request states found:', [...new Set(records.map(r => r.state))]);
      console.log('Spare request all field keys:', Object.keys(records[0]));
    }

    // Helper to extract Many2one user field { id, name } from multiple possible field names
    const extractUser = (r, candidates) => {
      for (const f of candidates) {
        if (r[f] && r[f] !== false) {
          if (Array.isArray(r[f])) return { id: r[f][0], name: r[f][1] };
          if (typeof r[f] === 'number') return { id: r[f], name: '' };
        }
      }
      return null;
    };

    return records.map(r => {
      const state = r.state || r.stage || 'draft';
      const name = r.name || r.display_name || '';

      const requestedBy = extractUser(r, ['requested_by', 'requested_by_id', 'request_by', 'request_user_id', 'user_id']);
      const requestedTo = extractUser(r, ['requested_to', 'requested_to_id', 'request_to', 'request_to_id', 'assigned_to']);

      return {
        id: r.id,
        name,
        label: `${name} [${state.toUpperCase()}]${r.partner_id ? ' - ' + r.partner_id[1] : (r.customer_id ? ' - ' + r.customer_id[1] : '')}`,
        state,
        job_card_id: r.job_card_id ? r.job_card_id[0] : null,
        job_card_name: r.job_card_id ? r.job_card_id[1] : '',
        partner_name: r.partner_id ? r.partner_id[1] : (r.customer_id ? r.customer_id[1] : ''),
        line_ids: r.spare_parts_line || r.line_ids || r.spare_line_ids || [],
        requested_by: requestedBy,
        requested_to: requestedTo,
      };
    });
  } catch (error) {
    console.error('fetchApprovedSpareRequestsOdoo error:', error?.message || error);
    return [];
  }
};

// Fetch spare part request lines by IDs (with all fields for issue/return tracking)
export const fetchSpareRequestLinesOdoo = async (lineIds) => {
  try {
    if (!lineIds || lineIds.length === 0) return [];
    const { headers, baseUrl } = await authenticateOdoo();

    // Step 1: Discover actual field names via fields_get
    const fieldsResp = await axios.post(
      `${baseUrl}/web/dataset/call_kw`,
      {
        jsonrpc: '2.0', method: 'call',
        params: { model: 'spare.part.request.line', method: 'fields_get', args: [], kwargs: { attributes: ['string', 'type'] } },
      },
      { headers }
    );
    const allFieldDefs = fieldsResp.data?.result || {};
    const allFieldNames = Object.keys(allFieldDefs);

    // Find the actual field names by checking candidates
    const findField = (candidates) => candidates.find(f => allFieldNames.includes(f));

    const reqQtyField = findField(['requested_qty', 'qty_requested', 'qty', 'product_qty', 'request_qty', 'quantity', 'product_uom_qty']);
    const issQtyField = findField(['issued_qty', 'qty_issued', 'issue_qty', 'issued_quantity', 'quantity_issued']);
    const retQtyField = findField(['returned_qty', 'qty_returned', 'return_qty', 'returned_quantity', 'quantity_returned']);

    // Also try to find by field label/string if candidates don't match
    const findByLabel = (labels) => {
      for (const [fname, fdef] of Object.entries(allFieldDefs)) {
        const str = (fdef.string || '').toLowerCase();
        for (const lbl of labels) {
          if (str === lbl.toLowerCase()) return fname;
        }
      }
      return null;
    };

    const actualReqField = reqQtyField || findByLabel(['Requested Qty', 'Requested Quantity', 'Quantity Requested', 'Qty']);
    const actualIssField = issQtyField || findByLabel(['Issued Qty', 'Issued Quantity', 'Quantity Issued']);
    const actualRetField = retQtyField || findByLabel(['Returned Qty', 'Returned Quantity', 'Quantity Returned']);

    console.log('spare.part.request.line field discovery:', {
      requestedQty: actualReqField || 'NOT FOUND',
      issuedQty: actualIssField || 'NOT FOUND',
      returnedQty: actualRetField || 'NOT FOUND',
      allQtyRelatedFields: allFieldNames.filter(f =>
        f.includes('qty') || f.includes('quantity') || f.includes('issue') || f.includes('return') || f.includes('request')
      ),
    });

    // Step 2: Read the line records
    const response = await axios.post(
      `${baseUrl}/web/dataset/call_kw`,
      {
        jsonrpc: '2.0',
        method: 'call',
        params: {
          model: 'spare.part.request.line',
          method: 'read',
          args: [lineIds],
          kwargs: { fields: [] },
        },
      },
      { headers }
    );
    if (response.data.error) return [];
    const results = response.data.result || [];

    return results.map(l => {
      const reqQty = actualReqField ? (l[actualReqField] || 0) : 1;
      const issQty = actualIssField ? (l[actualIssField] || 0) : 0;
      const retQty = actualRetField ? (l[actualRetField] || 0) : 0;
      console.log(`Line ${l.id} [${l.product_id ? l.product_id[1] : ''}]: requested=${reqQty} (${actualReqField}=${l[actualReqField]}), issued=${issQty} (${actualIssField}=${l[actualIssField]}), returned=${retQty} (${actualRetField}=${l[actualRetField]})`);
      return {
        id: l.id,
        product_id: l.product_id ? l.product_id[0] : null,
        product_name: l.product_id ? l.product_id[1] : '',
        description: l.description || '',
        requested_qty: reqQty,
        issued_qty: issQty,
        returned_qty: retQty,
      };
    });
  } catch (error) {
    console.error('fetchSpareRequestLinesOdoo error:', error?.message || error);
    return [];
  }
};

// Update issued_qty on a spare part request line
export const updateSpareLineIssuedQtyOdoo = async (lineId, issuedQty) => {
  try {
    const { headers, baseUrl } = await authenticateOdoo();

    // Discover actual field names on the line model
    const fieldsResp = await axios.post(
      `${baseUrl}/web/dataset/call_kw`,
      {
        jsonrpc: '2.0', method: 'call',
        params: { model: 'spare.part.request.line', method: 'fields_get', args: [], kwargs: { attributes: ['string', 'type'] } },
      },
      { headers, withCredentials: true, timeout: 10000 }
    );
    const fieldNames = Object.keys(fieldsResp.data?.result || {});
    console.log('spare.part.request.line all fields:', fieldNames);

    // Find the issued_qty field name
    const qtyField = ['issued_qty', 'qty_issued', 'issue_qty'].find(f => fieldNames.includes(f));
    if (!qtyField) {
      throw new Error('Cannot find issued quantity field on spare.part.request.line. Available fields: ' + fieldNames.filter(f => f.includes('qty') || f.includes('issue')).join(', '));
    }

    // Read current value before writing
    const readResp = await axios.post(
      `${baseUrl}/web/dataset/call_kw`,
      {
        jsonrpc: '2.0', method: 'call',
        params: { model: 'spare.part.request.line', method: 'read', args: [[lineId]], kwargs: { fields: [qtyField] } },
      },
      { headers, withCredentials: true, timeout: 10000 }
    );
    const currentVal = readResp.data?.result?.[0]?.[qtyField];
    console.log(`updateSpareLineIssuedQty: lineId=${lineId}, field=${qtyField}, currentValue=${currentVal}, writingValue=${issuedQty}`);

    const response = await axios.post(
      `${baseUrl}/web/dataset/call_kw`,
      {
        jsonrpc: '2.0', method: 'call',
        params: {
          model: 'spare.part.request.line',
          method: 'write',
          args: [[lineId], { [qtyField]: issuedQty }],
          kwargs: {},
        },
      },
      { headers, withCredentials: true, timeout: 10000 }
    );
    if (response.data.error) {
      throw new Error(response.data.error.data?.message || 'Failed to update issued qty');
    }

    // Verify the value was written correctly
    const verifyResp = await axios.post(
      `${baseUrl}/web/dataset/call_kw`,
      {
        jsonrpc: '2.0', method: 'call',
        params: { model: 'spare.part.request.line', method: 'read', args: [[lineId]], kwargs: { fields: [qtyField] } },
      },
      { headers, withCredentials: true, timeout: 10000 }
    );
    const afterVal = verifyResp.data?.result?.[0]?.[qtyField];
    console.log(`updateSpareLineIssuedQty VERIFY: lineId=${lineId}, expected=${issuedQty}, actual=${afterVal}`);

    return response.data.result;
  } catch (error) {
    console.error('updateSpareLineIssuedQtyOdoo error:', error?.message || error);
    throw error;
  }
};

// Update returned_qty on a spare part request line
export const updateSpareLineReturnedQtyOdoo = async (lineId, returnedQty) => {
  try {
    const { headers, baseUrl } = await authenticateOdoo();

    const fieldsResp = await axios.post(
      `${baseUrl}/web/dataset/call_kw`,
      {
        jsonrpc: '2.0', method: 'call',
        params: { model: 'spare.part.request.line', method: 'fields_get', args: [], kwargs: { attributes: ['string', 'type'] } },
      },
      { headers, withCredentials: true, timeout: 10000 }
    );
    const fieldNames = Object.keys(fieldsResp.data?.result || {});

    const qtyField = ['returned_qty', 'qty_returned', 'return_qty'].find(f => fieldNames.includes(f));
    if (!qtyField) {
      throw new Error('Cannot find returned quantity field on spare.part.request.line. Available fields: ' + fieldNames.filter(f => f.includes('qty') || f.includes('return')).join(', '));
    }

    const response = await axios.post(
      `${baseUrl}/web/dataset/call_kw`,
      {
        jsonrpc: '2.0', method: 'call',
        params: {
          model: 'spare.part.request.line',
          method: 'write',
          args: [[lineId], { [qtyField]: returnedQty }],
          kwargs: {},
        },
      },
      { headers, withCredentials: true, timeout: 10000 }
    );
    if (response.data.error) {
      throw new Error(response.data.error.data?.message || 'Failed to update returned qty');
    }
    return response.data.result;
  } catch (error) {
    console.error('updateSpareLineReturnedQtyOdoo error:', error?.message || error);
    throw error;
  }
};

// Transition spare.part.request state (e.g., to 'issued' or 'returned')
// extraFields: { userId, toUserId, date, reason } - optional metadata to write alongside state
export const transitionSpareRequestStateOdoo = async (requestId, targetState, extraFields = {}) => {
  try {
    const { headers, baseUrl } = await authenticateOdoo();

    // First, discover actual field names on spare.part.request
    let fieldNames = [];
    try {
      const fieldsResp = await axios.post(`${baseUrl}/web/dataset/call_kw`, {
        jsonrpc: '2.0', method: 'call',
        params: { model: 'spare.part.request', method: 'fields_get', args: [], kwargs: { attributes: ['string', 'type'] } },
      }, { headers, withCredentials: true, timeout: 10000 });
      fieldNames = Object.keys(fieldsResp.data?.result || {});
      console.log('spare.part.request fields for state transition:', fieldNames.filter(f =>
        f.includes('issue') || f.includes('return') || f.includes('date') || f.includes('by') || f.includes('to_') || f.includes('user')
      ));
    } catch (e) {
      console.warn('Failed to fetch spare.part.request fields:', e?.message);
    }

    // Build metadata values to write alongside state
    const metaVals = {};
    const findField = (candidates) => candidates.find(f => fieldNames.includes(f));

    if (targetState === 'issued') {
      // Issued By field
      if (extraFields.userId) {
        const byField = findField(['issued_by', 'issued_by_id', 'issue_by', 'issue_user_id']);
        if (byField) metaVals[byField] = extraFields.userId;
      }
      // Issued To field
      if (extraFields.toUserId) {
        const toField = findField(['issued_to', 'issued_to_id', 'issue_to', 'issue_to_id']);
        if (toField) metaVals[toField] = extraFields.toUserId;
      }
      // Issue Date field
      const dateField = findField(['issue_date', 'issued_date', 'date_issue', 'date_issued']);
      if (dateField) {
        metaVals[dateField] = extraFields.date || new Date().toISOString().split('T')[0];
      }
    } else if (targetState === 'returned') {
      // Returned By field
      if (extraFields.userId) {
        const byField = findField(['returned_by', 'returned_by_id', 'return_by', 'return_user_id']);
        if (byField) metaVals[byField] = extraFields.userId;
      }
      // Returned To field
      if (extraFields.toUserId) {
        const toField = findField(['returned_to', 'returned_to_id', 'return_to', 'return_to_id']);
        if (toField) metaVals[toField] = extraFields.toUserId;
      }
      // Return Date field
      const dateField = findField(['return_date', 'returned_date', 'date_return', 'date_returned']);
      if (dateField) {
        metaVals[dateField] = extraFields.date || new Date().toISOString().split('T')[0];
      }
      // Return Reason field
      if (extraFields.reason) {
        const reasonField = findField(['return_reason', 'reason', 'returned_reason', 'note', 'notes', 'return_notes', 'description', 'return_description']);
        if (reasonField) metaVals[reasonField] = extraFields.reason;
      }
    }

    console.log('Metadata fields to write:', metaVals);

    // Try common action methods for the target state
    const methodsToTry = targetState === 'issued'
      ? ['action_issue', 'action_issued', 'button_issue', 'action_done', 'action_confirm']
      : ['action_return', 'action_returned', 'button_return', 'action_done'];

    for (const method of methodsToTry) {
      try {
        const r = await axios.post(`${baseUrl}/web/dataset/call_kw`, {
          jsonrpc: '2.0', method: 'call',
          params: { model: 'spare.part.request', method, args: [[requestId]], kwargs: {} },
        }, { headers, withCredentials: true, timeout: 10000 });
        if (!r.data.error) {
          console.log(`Request state transition success: ${method}`);
          // Write metadata fields after successful action
          if (Object.keys(metaVals).length > 0) {
            await axios.post(`${baseUrl}/web/dataset/call_kw`, {
              jsonrpc: '2.0', method: 'call',
              params: { model: 'spare.part.request', method: 'write', args: [[requestId], metaVals], kwargs: {} },
            }, { headers, withCredentials: true, timeout: 10000 });
            console.log('Metadata fields written successfully');
          }
          return true;
        }
      } catch (e) {
        console.warn(`Request method ${method} failed`);
      }
    }

    // If action methods fail, try direct write on state field + metadata
    try {
      const writeVals = { state: targetState, ...metaVals };
      console.log(`Trying direct state write with metadata:`, writeVals);
      const r = await axios.post(`${baseUrl}/web/dataset/call_kw`, {
        jsonrpc: '2.0', method: 'call',
        params: {
          model: 'spare.part.request',
          method: 'write',
          args: [[requestId], writeVals],
          kwargs: {},
        },
      }, { headers, withCredentials: true, timeout: 10000 });
      if (!r.data.error) {
        console.log(`Direct state write with metadata success: ${targetState}`);
        return true;
      }
    } catch (e) {
      console.warn('Direct state write failed:', e?.message);
    }

    console.warn('All state transition methods failed for request', requestId);
    return false;
  } catch (error) {
    console.error('transitionSpareRequestStateOdoo error:', error?.message || error);
    return false;
  }
};

// Fetch issued spare parts (for return linking)
export const fetchIssuedSparePartsOdoo = async ({ limit = 50 } = {}) => {
  try {
    const headers = await getOdooAuthHeaders();
    const possibleModels = ['spare.part.issue', 'spare.issue', 'spare.part.issued'];

    for (const model of possibleModels) {
      try {
        const response = await axios.post(
          `${ODOO_BASE_URL}/web/dataset/call_kw`,
          {
            jsonrpc: '2.0',
            method: 'call',
            params: {
              model,
              method: 'search_read',
              args: [[]],
              kwargs: { fields: [], offset: 0, limit, order: 'create_date desc' },
            },
          },
          { headers }
        );
        if (!response.data.error) {
          const records = response.data.result || [];
          console.log(`fetchIssuedSparePartsOdoo: found ${records.length} records using model ${model}`);
          if (records.length > 0) {
            console.log('Issue record fields:', Object.keys(records[0]));
          }
          return records.map(r => ({
            id: r.id,
            name: r.name || r.display_name || '',
            job_card_id: r.job_card_id ? r.job_card_id[0] : null,
            job_card_name: r.job_card_id ? r.job_card_id[1] : '',
            product_id: r.product_id ? r.product_id[0] : (r.spare_part_id ? r.spare_part_id[0] : null),
            product_name: r.product_id ? r.product_id[1] : (r.spare_part_id ? r.spare_part_id[1] : ''),
            quantity: r.quantity || r.qty || r.issued_qty || 0,
          }));
        }
      } catch (e) {
        console.warn(`fetchIssuedSparePartsOdoo: model ${model} failed`);
      }
    }
    console.warn('fetchIssuedSparePartsOdoo: no issue model found');
    return [];
  } catch (error) {
    console.error('fetchIssuedSparePartsOdoo error:', error?.message || error);
    return [];
  }
};

// Create a spare part issue in Odoo
export const createSparePartIssueOdoo = async ({ jobCardId, productId, quantity, issuedById, issueDate, notes, requestId }) => {
  try {
    const { headers, baseUrl } = await authenticateOdoo();

    // Try multiple possible model names
    const possibleModels = ['spare.part.issue', 'spare.issue', 'spare.part.issued', 'stock.picking'];
    let modelName = null;
    let fieldNames = [];

    for (const model of possibleModels) {
      try {
        console.log(`Trying model: ${model}`);
        const fieldsResp = await axios.post(
          `${baseUrl}/web/dataset/call_kw`,
          {
            jsonrpc: '2.0', method: 'call',
            params: { model, method: 'fields_get', args: [], kwargs: { attributes: ['string', 'type'] } },
          },
          { headers, withCredentials: true, timeout: 10000 }
        );
        if (!fieldsResp.data?.error && fieldsResp.data?.result) {
          fieldNames = Object.keys(fieldsResp.data.result);
          if (fieldNames.length > 0) {
            modelName = model;
            console.log(`Found model: ${model}, fields:`, fieldNames);
            break;
          }
        }
      } catch (e) {
        console.warn(`Model ${model} not found, trying next...`);
      }
    }

    if (!modelName) {
      throw new Error('Spare part issue model not found in Odoo. Tried: ' + possibleModels.join(', '));
    }

    const tryField = (possible) => possible.find(f => fieldNames.includes(f)) || null;
    const vals = {};

    const jcField = tryField(['job_card_id', 'jobcard_id', 'job_card']);
    const prodField = tryField(['product_id', 'spare_part_id', 'part_id']);
    const qtyField = tryField(['quantity', 'qty', 'issued_qty', 'product_qty']);
    const issuedByField = tryField(['issued_by', 'issue_by', 'user_id', 'responsible_id']);
    const dateField = tryField(['issue_date', 'date', 'date_issue']);
    const notesField = tryField(['notes', 'note', 'reason', 'description']);
    const reqField = tryField(['request_id', 'spare_request_id', 'spare_part_request_id']);

    if (jcField && jobCardId) vals[jcField] = jobCardId;
    if (prodField && productId) vals[prodField] = productId;
    if (qtyField && quantity) vals[qtyField] = quantity;
    if (issuedByField && issuedById) vals[issuedByField] = issuedById;
    if (dateField && issueDate) vals[dateField] = issueDate;
    if (notesField && notes) vals[notesField] = notes;
    if (reqField && requestId) vals[reqField] = requestId;

    console.log(`Creating ${modelName} with vals:`, JSON.stringify(vals));

    const response = await axios.post(
      `${baseUrl}/web/dataset/call_kw`,
      {
        jsonrpc: '2.0', method: 'call',
        params: { model: modelName, method: 'create', args: [vals], kwargs: {} },
      },
      { headers, withCredentials: true, timeout: 15000 }
    );
    if (response.data.error) {
      throw new Error(response.data.error.data?.message || 'Failed to create spare part issue');
    }
    const newId = response.data.result;

    // Try to confirm/done the issue
    if (newId) {
      for (const method of ['action_done', 'action_issue', 'action_confirm', 'button_done']) {
        try {
          const r = await axios.post(`${baseUrl}/web/dataset/call_kw`, {
            jsonrpc: '2.0', method: 'call',
            params: { model: modelName, method, args: [[newId]], kwargs: {} },
          }, { headers, withCredentials: true, timeout: 10000 });
          if (!r.data.error) { console.log(`Issue state transition success: ${method}`); break; }
        } catch (e) { console.warn(`Issue method ${method} failed`); }
      }
    }
    return newId;
  } catch (error) {
    console.error('createSparePartIssueOdoo error:', error?.message || error);
    throw error;
  }
};

// Create a spare part return in Odoo
export const createSparePartReturnOdoo = async ({ jobCardId, productId, quantity, returnedById, returnDate, reason, issueId }) => {
  try {
    const { headers, baseUrl } = await authenticateOdoo();

    // Try multiple possible model names
    const possibleModels = ['spare.part.return', 'spare.return', 'spare.part.returned'];
    let modelName = null;
    let fieldNames = [];

    for (const model of possibleModels) {
      try {
        console.log(`Trying return model: ${model}`);
        const fieldsResp = await axios.post(
          `${baseUrl}/web/dataset/call_kw`,
          {
            jsonrpc: '2.0', method: 'call',
            params: { model, method: 'fields_get', args: [], kwargs: { attributes: ['string', 'type'] } },
          },
          { headers, withCredentials: true, timeout: 10000 }
        );
        if (!fieldsResp.data?.error && fieldsResp.data?.result) {
          fieldNames = Object.keys(fieldsResp.data.result);
          if (fieldNames.length > 0) {
            modelName = model;
            console.log(`Found return model: ${model}, fields:`, fieldNames);
            break;
          }
        }
      } catch (e) {
        console.warn(`Model ${model} not found, trying next...`);
      }
    }

    if (!modelName) {
      throw new Error('Spare part return model not found in Odoo. Tried: ' + possibleModels.join(', '));
    }

    const tryField = (possible) => possible.find(f => fieldNames.includes(f)) || null;
    const vals = {};

    const jcField = tryField(['job_card_id', 'jobcard_id', 'job_card']);
    const prodField = tryField(['product_id', 'spare_part_id', 'part_id']);
    const qtyField = tryField(['quantity', 'qty', 'returned_qty', 'product_qty']);
    const retByField = tryField(['returned_by', 'return_by', 'user_id', 'responsible_id']);
    const dateField = tryField(['return_date', 'date', 'date_return']);
    const reasonField = tryField(['reason', 'notes', 'note', 'description']);
    const issField = tryField(['issue_id', 'spare_issue_id', 'spare_part_issue_id']);

    if (jcField && jobCardId) vals[jcField] = jobCardId;
    if (prodField && productId) vals[prodField] = productId;
    if (qtyField && quantity) vals[qtyField] = quantity;
    if (retByField && returnedById) vals[retByField] = returnedById;
    if (dateField && returnDate) vals[dateField] = returnDate;
    if (reasonField && reason) vals[reasonField] = reason;
    if (issField && issueId) vals[issField] = issueId;

    console.log(`Creating ${modelName} with vals:`, JSON.stringify(vals));

    const response = await axios.post(
      `${baseUrl}/web/dataset/call_kw`,
      {
        jsonrpc: '2.0', method: 'call',
        params: { model: modelName, method: 'create', args: [vals], kwargs: {} },
      },
      { headers, withCredentials: true, timeout: 15000 }
    );
    if (response.data.error) {
      throw new Error(response.data.error.data?.message || 'Failed to create spare part return');
    }
    const newId = response.data.result;

    // Try to confirm the return
    if (newId) {
      for (const method of ['action_done', 'action_return', 'action_confirm', 'button_done']) {
        try {
          const r = await axios.post(`${baseUrl}/web/dataset/call_kw`, {
            jsonrpc: '2.0', method: 'call',
            params: { model: modelName, method, args: [[newId]], kwargs: {} },
          }, { headers, withCredentials: true, timeout: 10000 });
          if (!r.data.error) { console.log(`Return state transition success: ${method}`); break; }
        } catch (e) { console.warn(`Return method ${method} failed`); }
      }
    }
    return newId;
  } catch (error) {
    console.error('createSparePartReturnOdoo error:', error?.message || error);
    throw error;
  }
};