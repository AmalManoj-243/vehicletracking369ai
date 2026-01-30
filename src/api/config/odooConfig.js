// src/api/odooConfig.js

// 🔹 Put your Odoo server URL here ONE time
// Current test server
const ODOO_BASE_URL = "http://192.168.29.219:8069/";

// Default DB to use for Odoo JSON-RPC login (change to your test DB)
const DEFAULT_ODOO_DB ="odoo19";

// Named export for default base URL for backward compatibility
const DEFAULT_ODOO_BASE_URL = ODOO_BASE_URL;

export { DEFAULT_ODOO_DB, DEFAULT_ODOO_BASE_URL };
export default ODOO_BASE_URL;
