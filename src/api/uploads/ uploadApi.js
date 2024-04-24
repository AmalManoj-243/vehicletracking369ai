import { post } from "@api/services/utils";

// Upload writing api
const uploadApi = async (fileUri) => {
console.log("🚀 ~ uploadApi ~ fileUri:", fileUri)


  try {
    const formData = new FormData();
    const contentType = 'image/png';
    
    formData.append('file', {
        uri: fileUri,
        type: contentType,
        name: fileUri.split('/').pop(),
    });
    const config = {
        headers: {
        'Content-Type': 'multipart/form-data',
      }
    }
    console.log("🚀 ~ uploadApi ~ formData:", formData)

    const response = await post('/fileUpload?folder_name=audit', formData, config);
    console.log("🚀 ~ uploadApi ~ response:", response.data)

    // Check if the response contains the expected data
    if (response && response.data) {
      const uploadUrl = response.data;
      console.log("🚀 ~ uploadApi ~ uploadUrl:", uploadUrl)
      return uploadUrl
    } else {
      console.log('Upload failed. Unexpected API response:', response.data);
      return null
    }
  } catch (error) {
    console.log('API error:', error);

    // Handle different error scenarios
    if (error.response) {
      console.log('Error response data:', error.response.data);
      console.log('Error response status:', error.response.status);
      console.log('Error response headers:', error.response.headers);
    } else if (error.request) {
      console.log('No response received:', error.request);
    } else {
      console.log('Error message:', error.message);
    }
  }
};

export default uploadApi;
