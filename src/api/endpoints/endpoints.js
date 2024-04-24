//src/api/services/endpoints.js

export const API_ENDPOINTS = {
    VIEW_PRODUCTS: '/viewProducts',
    VIEW_CATEGORIES: '/viewCategories',
    VIEW_WAREHOUSE: `/viewWarehouses`,
    VIEW_CUSTOMER: '/viewCustomers',
    VIEW_QUOTATION: '/viewQuotation'
};

export const DETAIL_API_ENDPOINTS = {
    // Transaction Auditing ENDPOINTS
    INVOICE_DETAILS: '/viewInvoice',
    VENDOR_DETAILS: '/viewVendorBill',
    SALES_RETURN_DETAILS: '/viewReturn',
    PURCHASE_RETURN_DETAILS: '/viewReturn',
    CAPITAL_PAYMENT_DETAILS: '/viewCapitalPayment',
    JOB_INVOICE_DETAILS: '/viewJobInvoice',
    SPARE_PARTS_ISSUE_DETAILS: '/viewSparePartsIssue',
    PETTY_CASH_ALLOTMENT_DETAILS: '/viewPettyCashAllotement',
    PETTY_CASH_EXPENSE_DETAILS: '/viewPettyCashExpence',
    PETTY_CASH_TRANSFER_DETAILS: '/viewPettyCashTransfer',
    PETTY_CASH_RETURN_DETAILS: '/viewPettyCashReturn',
    CAPITAL_RECEIPTS_DETAILS: '/viewCapital',
    CUSTOMER_RECEIPTS_DETAILS: '/viewRegisterPayment',
    CUSTOMER_PAYMENT_DETAILS: '/viewCustomerPayment',
    CASH_RECEIPTS_DETAILS: '/viewCapital',
    CASH_PAYMENTS_DETAILS: '/viewExpense',
    EXPENSE_DETAILS: '/viewExpense',
    SUPPLIER_RECEIPTS_DETAILS: '/viewSupplierReceipt',
    SUPPLIER_PAYMENTS_DETAILS: '/viewPaymentMade',
    LEDGER_TYPE_DETAILS: '/viewMasterLedger',
    SALARY_PAYMENT_DETAILS: '/viewSalaryAdvance',
    COLLECTION_TYPE_DETAILS: '/viewCollectionType'
};