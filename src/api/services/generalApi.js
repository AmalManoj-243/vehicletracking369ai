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
    // Filter by date and vehicleId if provided (Odoo expects YYYY-MM-DD)
    let domain = [];
    if (date) {
      domain.push(["date", "=", date]);
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
              "pre_trip_litres", "start_latitude", "start_longitude"
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
    // Filter out cancelled trips from in-progress
    return trips
      .filter(trip => !trip.trip_cancel)
      .map(trip => ({
        estimated_time: trip.estimated_time || '',
        id: trip.id,
        vehicle_id: Array.isArray(trip.vehicle_id) ? trip.vehicle_id[0] : undefined,
        vehicle_name: Array.isArray(trip.vehicle_id) ? trip.vehicle_id[1] : '',
        driver_name: Array.isArray(trip.driver_id) ? trip.driver_id[1] : '',
        date: trip.date,
        number_plate: trip.number_plate,
        start_km: trip.start_km,
        end_km: trip.end_km,
        start_trip: trip.start_trip,
        end_trip: trip.end_trip,
        source_name: Array.isArray(trip.source_id) ? trip.source_id[1] : '',
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
export const createVehicleTrackingTripOdoo = async ({ payload, username = 'admin', password = 'admin', db = DEFAULT_VEHICLE_TRACKING_DB } = {}) => {
  const baseUrl = (VEHICLE_TRACKING_BASE_URL || '').replace(/\/$/, '');
  // Defensive: ensure payload is a valid object
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
    console.error('createVehicleTrackingTripOdoo: Invalid payload', payload);
    throw new Error('Trip payload is invalid (must be a non-null object)');
  }
  // Log payload before sending
  console.log('createVehicleTrackingTripOdoo: Sending payload to Odoo:', payload);
  try {
    // Step 1: Authenticate to Odoo
    const loginResp = await loginVehicleTrackingOdoo({ username, password, db });
    // Build trip payload by removing fields that belong to vehicle.fuel.log or are invalid for vehicle.tracking
    const tripPayload = { ...payload };
    const removeKeys = [
      'fuel_amount', 'fuel_liters', 'fuel_litres', 'invoice_number', 'odometer_image',
      'odometer_image_filename', 'odometer_image_uri', 'current_odometer',
      'post_trip_amount', 'post_trip_litres', 'end_fuel_document', 'pre_trip_litres'
    ];
    removeKeys.forEach(k => { if (k in tripPayload) delete tripPayload[k]; });
    // Debug: show sanitized trip payload that will be sent to Odoo (should include image_url if provided)
    console.log('createVehicleTrackingTripOdoo: Sanitized tripPayload:', JSON.stringify(tripPayload));

    // Step 2: Create trip record via JSON-RPC
    const headers = await getOdooAuthHeaders();
    if (loginResp && loginResp.cookies) headers.Cookie = loginResp.cookies;
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
    const tripId = Array.isArray(tripIdRaw) ? tripIdRaw[0] : (Number.isFinite(Number(tripIdRaw)) ? Number(tripIdRaw) : tripIdRaw);
    console.log('Odoo createVehicleTrackingTripOdoo response tripIdRaw:', JSON.stringify(tripIdRaw), 'normalized tripId:', tripId);

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

    // Read back the created trip record to verify fields like `image_url` were saved
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
            kwargs: { fields: ['id', 'image_url', 'number_plate', 'date'] },
          },
        },
        { headers, withCredentials: true, timeout: 15000 }
      );
      if (readResp.data && Array.isArray(readResp.data.result) && readResp.data.result.length > 0) {
        console.log('Readback vehicle.tracking record after create:', JSON.stringify(readResp.data.result[0]));
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
import ODOO_BASE_URL from '@api/config/odooConfig';
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
export const fetchProductsOdoo = async ({ offset, limit, searchText } = {}) => {
  try {
    // Base domain: active salable products
    let domain = [["sale_ok", "=", true]];

    if (searchText && searchText.trim() !== "") {
      const term = searchText.trim();
      domain = [
        "&",
        ["sale_ok", "=", true],
        ["name", "ilike", term],     // filter by product name
      ];
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
};// src/api/services/generalApi.js
// Ensure this points to your Odoo URL

// Fetch categories directly from Odoo using JSON-RPC
// NOTE: older code filtered by a non-existent `is_category` field which caused Odoo to raise
// "Invalid field product.category.is_category". Use a safe domain (empty) and apply
// `name ilike` only when a searchText is provided.
// fetchCategoriesOdoo removed: Odoo category fetch disabled as requested

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
      product_code: p.default_code || null,
      uom: p.uom_id ? { uom_id: p.uom_id[0], uom_name: p.uom_id[1] } : null,
      categ_id: p.categ_id || null,
      product_description: p.description_sale || null,
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