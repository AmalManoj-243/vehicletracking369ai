// api/services/generalApi.js
import { get } from "./utils";
import { API_ENDPOINTS } from "./endpoints";
import handleApiError from "../utils/handleApiError";

export const fetchProducts = async ({ offset, limit, categoryId, searchText }) => {
  try {
    const params = {
      product_name: searchText,
      offset,
      limit,
    };
    if (categoryId !== undefined) {
      params.category_id = categoryId;
    }
    const response = await get(API_ENDPOINTS.VIEW_PRODUCTS, params);
    return response.data;
  } catch (error) {
    handleApiError(error);
    throw error; 
  }
};
