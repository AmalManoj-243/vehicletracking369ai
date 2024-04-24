// api/services/generalApi.js

import { get } from "./utils";
import { API_ENDPOINTS } from "@api/endpoints";
import handleApiError from "../utils/handleApiError";

export const fetchProducts = async ({ offset, limit, categoryId, searchText }) => {
  try {
    const queryParams = {
      product_name: searchText,
      offset,
      limit,
      ...(categoryId !== undefined && { category_id: categoryId }),
    };
    // console.log("🚀 ~ fetchProducts ~ queryParams:", queryParams)
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
      category_name: searchText,
      offset,
      limit,
    };
    const response = await get(API_ENDPOINTS.VIEW_CATEGORIES, queryParams);
    return response.data;
  } catch (error) {
    handleApiError(error);
    throw error;
  }
};
