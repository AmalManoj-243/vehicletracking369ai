// api/services/generalApi.js

import { get } from "./utils";
import { API_ENDPOINTS } from "@api/endpoints";
import useAuthStore from "@stores/auth/authStore";
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

export const fetchCategories = async ({ offset, limit, searchText }) => {
  try {
    const queryParams = {
      offset,
      limit,
      ...(searchText !== undefined && { category_name: searchText }),
    };
    const response = await get(API_ENDPOINTS.VIEW_CATEGORIES, queryParams);
    return response.data;
  } catch (error) {
    handleApiError(error);
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
      sales_person_id: salesPersonId,
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
};
