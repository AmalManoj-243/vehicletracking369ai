// src/api/utils.js
import axios from 'axios';
import { API_BASE_URL } from '@api/config';
import handleApiError from '../utils/handleApiError';


export const get = async (endpoint, params = {}) => {
  try {
    const url = `${API_BASE_URL}${endpoint}`;
    // console.log('API request:', url, 'with params:', params);
    const response = await axios.get(url, { params });
    return response.data;
  } catch (error) {
    handleApiError(error)
  }
};

export const post = async (endpoint, data = {}, config ={}) => {
  try {
    const url = `${API_BASE_URL}${endpoint}`;
    // console.log('API request:', url, 'with data:', data); 
    const response = await axios.post(url, data, config);
    return response.data;
  } catch (error) {
    handleApiError(error)
  }
};


export const put = async (endpoint, data = {}, config ={}) => {
  try {
    const url = `${API_BASE_URL}${endpoint}`;
    // console.log('API request:', url, 'with data:', data); 
    const response = await axios.put(url, data, config);
    return response.data;
  } catch (error) {
    handleApiError(error)
  }
};
