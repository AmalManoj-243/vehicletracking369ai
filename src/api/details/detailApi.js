import { get } from "../services/utils";
import handleApiError from "@api/utils/handleApiError";
import { DETAIL_API_ENDPOINTS } from "@api/endpoints";

// Function to fetch details for a given endpoint
const fetchDetails = async (endpoint, sequenceNo) => {
  try {
    const response = await get(`${endpoint}?sequence_no=${sequenceNo}`);
    return response.data;
  } catch (error) {
    handleApiError(error);
    throw error;
  }
};

// Function to fetch collection type details
const fetchCollectionType = async (businessTypeId, paymentMethodId) => {
  try {
    const response = await get(`${DETAIL_API_ENDPOINTS.COLLECTION_TYPE_DETAILS}?bussiness_type_id=${businessTypeId}&payment_method_id=${paymentMethodId}`);
    return response.data;
  } catch (error) {
    handleApiError(error);
    throw error;
  }
}
// Function to fetch collection type details
const fetchLedgerDetail = async (ledgerId) => {
  try {
    const response = await get(`${DETAIL_API_ENDPOINTS.LEDGER_TYPE_DETAILS}?ledger_id=${ledgerId}`);
    return response.data;
  } catch (error) {
    handleApiError(error);
    throw error;
  }
}

// Function to fetch collection type details
const fetchSparePartsIssueAuditDetail = async (issueId) => {
  try {
    const response = await get(`${DETAIL_API_ENDPOINTS.SPARE_PARTS_ISSUE_AUDIT_DETAILS}/${issueId}`);
    return response.data;
  } catch (error) {
    handleApiError(error);
    throw error;
  }
}

// Object containing functions to fetch transaction auditing details
export const fetchBills = {

  invoiceDetails: async (sequenceNo) => {
    return fetchDetails(DETAIL_API_ENDPOINTS.INVOICE_DETAILS, sequenceNo);
  },

  vendorDetails: async (sequenceNo) => {
    return fetchDetails(DETAIL_API_ENDPOINTS.VENDOR_DETAILS, sequenceNo);
  },

  salesReturnDetails: async (sequenceNo) => {
    return fetchDetails(DETAIL_API_ENDPOINTS.SALES_RETURN_DETAILS, sequenceNo);
  },

  purchaseReturnDetails: async (sequenceNo) => {
    return fetchDetails(DETAIL_API_ENDPOINTS.PURCHASE_RETURN_DETAILS, sequenceNo);
  },

  capitalPaymentDetails: async (sequenceNo) => {
    return fetchDetails(DETAIL_API_ENDPOINTS.CAPITAL_PAYMENT_DETAILS, sequenceNo);
  },

  jobInvoiceDetails: async (sequenceNo) => {
    return fetchDetails(DETAIL_API_ENDPOINTS.JOB_INVOICE_DETAILS, sequenceNo);
  },

  sparePartsIssueDetails: async (sequenceNo) => {
    return fetchDetails(DETAIL_API_ENDPOINTS.SPARE_PARTS_ISSUE_DETAILS, sequenceNo);
  },

  sparePartsIssueAuditDetails: async (issueId) => {
    return fetchSparePartsIssueAuditDetail(issueId);
  },

  pettyCashAllotmentDetails: async (sequenceNo) => {
    return fetchDetails(DETAIL_API_ENDPOINTS.PETTY_CASH_ALLOTMENT_DETAILS, sequenceNo);
  },

  pettyCashExpenseDetails: async (sequenceNo) => {
    return fetchDetails(DETAIL_API_ENDPOINTS.PETTY_CASH_EXPENSE_DETAILS, sequenceNo);
  },

  salaryPaymentDetails: async (sequenceNo) => {
    return fetchDetails(DETAIL_API_ENDPOINTS.SALARY_PAYMENT_DETAILS, sequenceNo);
  },


  pettyCashTransferDetails: async (sequenceNo) => {
    return fetchDetails(DETAIL_API_ENDPOINTS.PETTY_CASH_TRANSFER_DETAILS, sequenceNo);
  },
  pettyCashReturnDetails: async (sequenceNo) => {
    return fetchDetails(DETAIL_API_ENDPOINTS.PETTY_CASH_RETURN_DETAILS, sequenceNo);
  },

  capitalRecieptsDetails: async (sequenceNo) => {
    return fetchDetails(DETAIL_API_ENDPOINTS.CAPITAL_RECEIPTS_DETAILS, sequenceNo);
  },

  customerReceiptsDetails: async (sequenceNo) => {
    return fetchDetails(DETAIL_API_ENDPOINTS.CUSTOMER_RECEIPTS_DETAILS, sequenceNo);
  },

  customerPaymentDetails: async (sequenceNo) => {
    return fetchDetails(DETAIL_API_ENDPOINTS.CUSTOMER_PAYMENT_DETAILS, sequenceNo);
  },

  cashReceiptsDetails: async (sequenceNo) => {
    return fetchDetails(DETAIL_API_ENDPOINTS.CASH_RECEIPTS_DETAILS, sequenceNo);
  },

  cashPaymentsDetails: async (sequenceNo) => {
    return fetchDetails(DETAIL_API_ENDPOINTS.CASH_PAYMENTS_DETAILS, sequenceNo);
  },

  expenseDetails: async (sequenceNo) => {
    return fetchDetails(DETAIL_API_ENDPOINTS.EXPENSE_DETAILS, sequenceNo);
  },

  supplierRecieptsDetails: async (sequenceNo) => {
    return fetchDetails(DETAIL_API_ENDPOINTS.SUPPLIER_RECEIPTS_DETAILS, sequenceNo);
  },

  supplierPaymentsDetails: async (sequenceNo) => {
    return fetchDetails(DETAIL_API_ENDPOINTS.SUPPLIER_PAYMENTS_DETAILS, sequenceNo);
  },

  ledgerTypeDetails: async (sequenceNo) => {
    return fetchDetails(DETAIL_API_ENDPOINTS.LEDGER_TYPE_DETAILS, sequenceNo);
  },

  collectionTypeDetails: async (businessTypeId, paymentMethodId) => {
    return fetchCollectionType(businessTypeId, paymentMethodId);
  },

  ledgerTypeDetails: async (ledgerId) => {
    return fetchLedgerDetail(ledgerId);
  },

};
