import { get } from "../services/utils";
import handleApiError from "@api/utils/handleApiError";
import { DETAIL_API_ENDPOINTS } from "@api/endpoints";
import useAuthStore from "@stores/auth/authStore";

const {
  GET_INVOICE_DETAILS,
  GET_VENDOR_DETAILS,
  GET_SALES_RETURN_DETAILS,
  GET_PURCHASE_RETURN_DETAILS,
  GET_CAPITAL_PAYMENT_DETAILS,
  GET_JOB_INVOICE_DETAILS,
  GET_SPARE_PARTS_ISSUE_DETAILS,
  GET_SPARE_PARTS_ISSUE_AUDIT_DETAILS,
  GET_PETTY_CASH_ALLOTMENT_DETAILS,
  GET_PETTY_CASH_EXPENSE_DETAILS,
  GET_PETTY_CASH_TRANSFER_DETAILS,
  GET_PETTY_CASH_RETURN_DETAILS,
  GET_CAPITAL_RECEIPTS_DETAILS,
  GET_CUSTOMER_RECEIPTS_DETAILS,
  GET_CUSTOMER_PAYMENT_DETAILS,
  GET_CASH_RECEIPTS_DETAILS,
  GET_CASH_PAYMENTS_DETAILS,
  GET_EXPENSE_DETAILS,
  GET_SUPPLIER_RECEIPTS_DETAILS,
  GET_SUPPLIER_PAYMENTS_DETAILS,
  GET_LEDGER_TYPE_DETAILS,
  GET_SALARY_PAYMENT_DETAILS,
  GET_SALARY_ADVANCE_PAYMENT_DETAILS,
  GET_COLLECTION_TYPE_DETAILS,
  GET_CHEQUE_LEDGER,
  GET_INVENTORY_DETAILS,
  GET_PRODUCT_DETAILS
} = DETAIL_API_ENDPOINTS;


// Fetches details for a given endpoint and sequence number.
const fetchAuditDetails = async (endpoint, sequenceNo) => {
  try {
    const response = await get(`${endpoint}?sequence_no=${sequenceNo}`);
    return response.data;
  } catch (error) {
    handleApiError(error);
    throw error;
  }
};

// Fetches details for a given endpoint and detail ID.
const fetchDetails = async (endpoint, detailId) => {
  try {
    const response = await get(`${endpoint}/${detailId}`)
    return response.data;
  } catch (error) {
    handleApiError(error);
    throw error;
  }
}

// Fetches details for a given endpoint and search.
const fetchDetailBySearch = async (endpoint, search, warehouseId) => {
  console.log("🚀 ~ fetchDetailBySearch ~ warehouseId:", warehouseId)
  try {
    const response = await get(`${endpoint}?name=${search}&warehouse_id=${warehouseId}`);
    return response.data;
  } catch (error) {
    handleApiError(error);
    throw error;
  }
}

// Function to fetch collection type details
const fetchCollectionType = async (businessTypeId, paymentMethodId) => {
  try {
    const response = await get(`${GET_COLLECTION_TYPE_DETAILS}?bussiness_type_id=${businessTypeId}&payment_method_id=${paymentMethodId}`);
    return response.data;
  } catch (error) {
    handleApiError(error);
    throw error;
  }
}
// Function to fetch collection type details
const fetchLedgerDetail = async (ledgerId) => {
  try {
    const response = await get(`${GET_LEDGER_TYPE_DETAILS}?ledger_id=${ledgerId}`);
    return response.data;
  } catch (error) {
    handleApiError(error);
    throw error;
  }
}

// Object containing functions to fetch transaction auditing details
export const fetchBills = {
  invoiceDetails: async (sequenceNo) => fetchAuditDetails(GET_INVOICE_DETAILS, sequenceNo),
  vendorDetails: async (sequenceNo) => fetchAuditDetails(GET_VENDOR_DETAILS, sequenceNo),
  salesReturnDetails: async (sequenceNo) => fetchAuditDetails(GET_SALES_RETURN_DETAILS, sequenceNo),
  purchaseReturnDetails: async (sequenceNo) => fetchAuditDetails(GET_PURCHASE_RETURN_DETAILS, sequenceNo),
  capitalPaymentDetails: async (sequenceNo) => fetchAuditDetails(GET_CAPITAL_PAYMENT_DETAILS, sequenceNo),
  jobInvoiceDetails: async (sequenceNo) => fetchAuditDetails(GET_JOB_INVOICE_DETAILS, sequenceNo),
  sparePartsIssueDetails: async (sequenceNo) => fetchAuditDetails(GET_SPARE_PARTS_ISSUE_DETAILS, sequenceNo),
  sparePartsIssueAuditDetails: async (issueId) => fetchDetails(GET_SPARE_PARTS_ISSUE_AUDIT_DETAILS, issueId),
  pettyCashAllotmentDetails: async (sequenceNo) => fetchAuditDetails(GET_PETTY_CASH_ALLOTMENT_DETAILS, sequenceNo),
  pettyCashExpenseDetails: async (sequenceNo) => fetchAuditDetails(GET_PETTY_CASH_EXPENSE_DETAILS, sequenceNo),
  salaryPaymentDetails: async (sequenceNo) => fetchAuditDetails(GET_SALARY_PAYMENT_DETAILS, sequenceNo),
  salaryAdvancePaymentDetails: async (sequenceNo) => fetchAuditDetails(GET_SALARY_ADVANCE_PAYMENT_DETAILS, sequenceNo),
  pettyCashTransferDetails: async (sequenceNo) => fetchAuditDetails(GET_PETTY_CASH_TRANSFER_DETAILS, sequenceNo),
  pettyCashReturnDetails: async (sequenceNo) => fetchAuditDetails(GET_PETTY_CASH_RETURN_DETAILS, sequenceNo),
  capitalRecieptsDetails: async (sequenceNo) => fetchAuditDetails(GET_CAPITAL_RECEIPTS_DETAILS, sequenceNo),
  customerReceiptsDetails: async (sequenceNo) => fetchAuditDetails(GET_CUSTOMER_RECEIPTS_DETAILS, sequenceNo),
  customerPaymentDetails: async (sequenceNo) => fetchAuditDetails(GET_CUSTOMER_PAYMENT_DETAILS, sequenceNo),
  cashReceiptsDetails: async (sequenceNo) => fetchAuditDetails(GET_CASH_RECEIPTS_DETAILS, sequenceNo),
  cashPaymentsDetails: async (sequenceNo) => fetchAuditDetails(GET_CASH_PAYMENTS_DETAILS, sequenceNo),
  expenseDetails: async (sequenceNo) => fetchAuditDetails(GET_EXPENSE_DETAILS, sequenceNo),
  supplierRecieptsDetails: async (sequenceNo) => fetchAuditDetails(GET_SUPPLIER_RECEIPTS_DETAILS, sequenceNo),
  supplierPaymentsDetails: async (sequenceNo) => fetchAuditDetails(GET_SUPPLIER_PAYMENTS_DETAILS, sequenceNo),
  ledgerTypeDetails: async (sequenceNo) => fetchAuditDetails(GET_LEDGER_TYPE_DETAILS, sequenceNo),
  chequeLedgerDetails: async (sequenceNo) => fetchAuditDetails(GET_CHEQUE_LEDGER, sequenceNo),
  collectionTypeDetails: async (businessTypeId, paymentMethodId) => fetchCollectionType(businessTypeId, paymentMethodId),
  ledgerTypeDetails: async (ledgerId) => fetchLedgerDetail(ledgerId),
};

export const fetchInventoryDetails = async (detailId) => {
  return fetchDetails(GET_INVENTORY_DETAILS, detailId);
};

export const fetchProductDetails = async (detailId) => {
  return fetchDetails(GET_PRODUCT_DETAILS, detailId);
};

export const fetchInventoryDetailsByName = async (name, warehouseId) => {
  return fetchDetailBySearch(GET_INVENTORY_DETAILS, name, warehouseId);
};