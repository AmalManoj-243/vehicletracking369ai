//src/api/services/endpoints.js

export const API_ENDPOINTS = {
    VIEW_PRODUCTS: '/viewProducts',
    VIEW_CATEGORIES: '/viewCategories',
    VIEW_WAREHOUSE: `/viewWarehouses`,
    VIEW_CUSTOMERS: '/viewCustomers',
    VIEW_QUOTATION: '/viewQuotation',
    VIEW_AUDITING: '/viewAuditing',
    VIEW_CUSTOMER_VISIT_LIST: '/viewCustomerVisitList',
    VIEW_MARKET_STUDY: '/viewMarketStudy',
    VIEW_INVENTORY_BOX_REQUEST: '/viewInventoryboxrequest',
    VIEW_ENQUIRY_REGISTER: '/viewEnquiryRegister',
    VIEW_LEAD: '/viewLead'
};

export const DROP_DOWN_API_ENDPOINTS = {
    INVOICE: '/viewInvoice/invoice/invoice_dropdown',
    SALES_RETURN: '/viewReturn/return/return_dropdown?type=sales_return',
    PURCHASE_RETURN: '/viewReturn/return/return_dropdown?type=purchase_return',
    SERVICE_RETURN: '/viewServiceReturn/service_return/service_return_dropdown',
    STOCK_TRANSFER: '/viewStockTransfer/stock_transaction/stock_transaction_dropdown',
    SERVICE: '/viewJobRegistration/job_registration/dropdown',
    VENDOR_BILL: '/viewVendorBill/vendor_bill/vendor_bill_drop_down',
    EMPLOYEE_DROPDOWN: '/viewEmployees/employee_list/employee_dropdown',
    CUSTOMER_DROPDOWN: '/viewCustomers/customer_list/drop_down',
    DEPARTMENT_DROPDOWN: '/viewDepartments/department_list/department_dropdown',
    BRAND_DROPDOWN: '/viewBrands/brand_list/brand_dropdown',
    PURPOSE_OF_VISIT_DROPDOWN: '/viewCustomerPurposeOfVisit/customer_purpose_of_vist/customer_purpose_of_visit_dropdown',
    SITE_LOCATION_DROPDOWN: '/viewSiteLocation/site_location_list/site_location_dropdown',
    VIEW_COUNTRY: "/viewCountry/country_list/country_dropdown",
    VIEW_STATE: "/viewState",
    VIEW_AREA: "/viewArea/area_list/drop_down",
    VIEW_SALESPERSON: "/viewEmployees/employee_list/employee_dropdown",
    VIEW_COLLECTIONAGENT: "/viewEmployees/employee_list/employee_dropdown",
    VIEW_LANGUAGE: "/viewLanguage/language_list/language_dropdown",
    VIEW_CURRENCY: "/viewCurrency/currency_list/currency_dropdown",
    SOURCE: "/viewSource/source_list/source_dropdown",
    OPPORTUNITY: "/viewOppertunityType/oppertunity_list/oppertunity_dropdown"
};

export const DETAIL_API_ENDPOINTS = {
    // Transaction Auditing ENDPOINTS
    GET_INVOICE_DETAILS: '/viewInvoice',
    GET_VENDOR_DETAILS: '/viewVendorBill',
    GET_SALES_RETURN_DETAILS: '/viewReturn',
    GET_PURCHASE_RETURN_DETAILS: '/viewReturn',
    GET_CAPITAL_PAYMENT_DETAILS: '/viewCapitalPayment',
    GET_JOB_INVOICE_DETAILS: '/viewJobInvoice',
    GET_SPARE_PARTS_ISSUE_DETAILS: '/viewSparePartsIssue',
    GET_SPARE_PARTS_ISSUE_AUDIT_DETAILS: '/viewSparePartsIssue/auditing/spare_parts_issue_details',
    GET_PETTY_CASH_ALLOTMENT_DETAILS: '/viewPettyCashAllotement',
    GET_PETTY_CASH_EXPENSE_DETAILS: '/viewPettyCashExpence',
    GET_PETTY_CASH_TRANSFER_DETAILS: '/viewPettyCashTransfer',
    GET_PETTY_CASH_RETURN_DETAILS: '/viewPettyCashReturn',
    GET_CAPITAL_RECEIPTS_DETAILS: '/viewCapital',
    GET_CUSTOMER_RECEIPTS_DETAILS: '/viewRegisterPayment',
    GET_CUSTOMER_PAYMENT_DETAILS: '/viewCustomerPayment',
    GET_CASH_RECEIPTS_DETAILS: '/viewCapital',
    GET_CASH_PAYMENTS_DETAILS: '/viewExpense',
    GET_EXPENSE_DETAILS: '/viewExpense',
    GET_SUPPLIER_RECEIPTS_DETAILS: '/viewSupplierReceipt',
    GET_SUPPLIER_PAYMENTS_DETAILS: '/viewPaymentMade',
    GET_LEDGER_TYPE_DETAILS: '/viewMasterLedger',
    GET_SALARY_PAYMENT_DETAILS: '/viewSalaryPayment',
    GET_SALARY_ADVANCE_PAYMENT_DETAILS: '/viewSalaryAdvance',
    GET_COLLECTION_TYPE_DETAILS: '/viewCollectionType',
    GET_CHEQUE_LEDGER: '/viewChequeLedger',
    // OTHERS DETAILS
    GET_INVENTORY_DETAILS: '/viewInventoryBox',
    GET_PRODUCT_DETAILS: '/viewProducts',
};