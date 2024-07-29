import { DROP_DOWN_API_ENDPOINTS } from "@api/endpoints";
import { get } from "@api/services/utils";
import handleApiError from "@api/utils/handleApiError";
import { DropdownSheet } from "@components/common/BottomSheets";

const fetchData = async (endpoint) => {
  try {
    const response = await get(endpoint);
    return response.data;
  } catch (error) {
    handleApiError(error);
    throw error;
  }
};

export const fetchInvoiceDropdown = async () => {
  return fetchData(DROP_DOWN_API_ENDPOINTS.INVOICE);
};

export const fetchSalesReturnDropdown = async () => {
  return fetchData(DROP_DOWN_API_ENDPOINTS.SALES_RETURN);
};

export const fetchPurchaseReturnDropdown = async () => {
  return fetchData(DROP_DOWN_API_ENDPOINTS.PURCHASE_RETURN);
};

export const fetchServiceReturnDropdown = async () => {
  return fetchData(DROP_DOWN_API_ENDPOINTS.SERVICE_RETURN);
};

export const fetchStockTransferDropdown = async () => {
  return fetchData(DROP_DOWN_API_ENDPOINTS.STOCK_TRANSFER);
};

export const fetchServiceDropdown = async () => {
  return fetchData(DROP_DOWN_API_ENDPOINTS.SERVICE);
};

export const fetchVendorBillDropdown = async () => {
  return fetchData(DROP_DOWN_API_ENDPOINTS.VENDOR_BILL);
};

export const fetchEmployeesDropdown = async () => {
  return fetchData(DROP_DOWN_API_ENDPOINTS.EMPLOYEE_DROPDOWN);
};

export const fetchCustomersDropdown = async () => {
  return fetchData(DROP_DOWN_API_ENDPOINTS.CUSTOMER_DROPDOWN);
};

export const fetchDepartmentsDropdown = async () => {
  return fetchData(DROP_DOWN_API_ENDPOINTS.DEPARTMENT_DROPDOWN);
};

export const fetchBrandsDropdown = async () => {
  return fetchData(DROP_DOWN_API_ENDPOINTS.BRAND_DROPDOWN);
};

export const fetchPurposeofVisitDropdown = async () => {
  return fetchData(DROP_DOWN_API_ENDPOINTS.PURPOSE_OF_VISIT_DROPDOWN);
}

export const fetchSiteLocationDropdown = async (customerId) => {
  return fetchData(`${DROP_DOWN_API_ENDPOINTS.SITE_LOCATION_DROPDOWN}?customer_id=${customerId}`);
}

export const fetchCountryDropdown = async () => {
  return fetchData(DROP_DOWN_API_ENDPOINTS.VIEW_COUNTRY);
}

export const fetchStateDropdown = async (countryId) => {
  return fetchData(`${DROP_DOWN_API_ENDPOINTS.VIEW_STATE}?country_id=${countryId}`);
}

export const fetchAreaDropdown = async (stateId) => {
  return fetchData(`${DROP_DOWN_API_ENDPOINTS.VIEW_AREA}?state_id=${stateId}`);
};

export const fetchsalesPersonDropdown = async () => {
  return fetchData(DROP_DOWN_API_ENDPOINTS.VIEW_SALESPERSON);
}

export const fetchcollectionAgentDropdown = async () => {
  return fetchData(DROP_DOWN_API_ENDPOINTS.VIEW_COLLECTIONAGENT);
}

export const fetchCustomerBehaviourDropdown = async () => {
  return fetchData(DROP_DOWN_API_ENDPOINTS.VIEW_CUSTOMERBEHAVIOUR);
}

export const fetchLanguageDropdown = async () => {
  return fetchData(DROP_DOWN_API_ENDPOINTS.VIEW_LANGUAGE);
}

export const fetchCurrencyDropdown = async () => {
  return fetchData(DROP_DOWN_API_ENDPOINTS.VIEW_CURRENCY);
}

export const fetchSourceDropdown = async () => {
  return fetchData(DROP_DOWN_API_ENDPOINTS.SOURCE);
}

export const fetchOpportunityDropdown = async () => {
  return fetchData(DROP_DOWN_API_ENDPOINTS.OPPORTUNITY);
}

