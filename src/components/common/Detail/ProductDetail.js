import React, { useState, useEffect } from 'react';
import { View, Image, TouchableOpacity } from 'react-native';
import Text from '@components/Text';
import { RoundedScrollContainer, SafeAreaView } from '@components/containers';
import { NavigationHeader } from '@components/Header';
import { FONT_FAMILY } from '@constants/theme';
import { fetchInventoryDetailsByName, fetchProductDetails } from '@api/details/detailApi';
import { showToastMessage } from '@components/Toast';
import useAuthStore from '@stores/auth/authStore';
import { OverlayLoader } from '@components/Loader';

const ProductDetail = ({ navigation, route }) => {
  const { detail = {} } = route?.params;
  const [details, setDetails] = useState({});
  const [loading, setLoading] = useState(false);
  const currentUser = useAuthStore(state => state.user);
  const warehouseId = currentUser?.warehouse?.warehouse_id || '';

  const productDetails = async () => {
    const response = await fetchProductDetails(detail?._id);
    setDetails(response[0]);
  };

  useEffect(() => {
    productDetails();
  }, [detail]);

  const handleBoxNamePress = async (boxName) => {
    setLoading(true);
    try {
      const inventoryDetails = await fetchInventoryDetailsByName(boxName, warehouseId);
      if (inventoryDetails.length > 0) {
        navigation.navigate('InventoryDetails', { inventoryDetails: inventoryDetails[0] });
      } else {
        showToastMessage('No inventory box found for this box no');
      }
    } catch (error) {
      console.error('Error fetching inventory details by name:', error);
      showToastMessage('Error fetching inventory details');
    } finally {
      setLoading(false);
    }
  };

  const renderStockDetails = () => {
    return (
      <View style={{ marginTop: 10, marginLeft: 10 }}>
        {details.total_product_quantity > 0 ? (
          <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
            <Text style={{ width: '50%', fontFamily: FONT_FAMILY.urbanistSemiBold }}>Stock On Hand:</Text>
            <Text style={{ width: '50%', fontFamily: FONT_FAMILY.urbanistSemiBold }}>{details.total_product_quantity}</Text>
          </View>
        ) : (
          <Text style={{ color: 'red', fontFamily: FONT_FAMILY.urbanistSemiBold }}>Out of Stock</Text>
        )}
      </View>
    );
  };

  const renderInventoryBoxDetails = () => {
    if (details.inventory_box_products_details?.length > 0) {
      return (
        <View style={{ marginTop: 10, marginLeft: 10 }}>
          <Text style={{ fontFamily: FONT_FAMILY.urbanistBold, fontSize: 16 }}>Inventory Box Details:</Text>
          {details.inventory_box_products_details.map((boxDetail, index) => (
            boxDetail.box_name.map((boxName, idx) => (
              <TouchableOpacity
                key={`${index}-${idx}`}
                style={{ marginTop: 10 }}
                onPress={() => handleBoxNamePress(boxName)}
              >
                <Text style={{ fontFamily: FONT_FAMILY.urbanistSemiBold }}>Box Name: {boxName}</Text>
              </TouchableOpacity>
            ))
          ))}
        </View>
      );
    } else {
      return (
        <View style={{ marginTop: 10, marginLeft: 10 }}>
          <Text style={{ fontFamily: FONT_FAMILY.urbanistSemiBold }}>No Inventory Box Details Available</Text>
        </View>
      );
    }
  };

  return (
    <SafeAreaView>
      <NavigationHeader title="Product Details" onBackPress={() => navigation.goBack()} />
      <RoundedScrollContainer>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
          <View style={{ width: '50%' }}>
            <Image source={{ uri: details.image_url }} style={{ width: '100%', height: 200 }} />
          </View>
          <View style={{ width: '50%', padding: 10 }}>
            <Text style={{ fontSize: 18, fontFamily: FONT_FAMILY.urbanistBold }}>{details?.product_name?.trim()}</Text>
            {details.product_description && (
              <Text style={{ marginTop: 10, fontFamily: FONT_FAMILY.urbanistSemiBold }}>
                {details.product_description}
              </Text>
            )}
            {details.alternate_products?.length > 0 && (
              <View style={{ marginTop: 10 }}>
                <Text style={{ fontFamily: FONT_FAMILY.urbanistSemiBold }}>Alternate Products:</Text>
                {details.alternate_products.map(product => (
                  <Text key={product._id} style={{ fontFamily: FONT_FAMILY.urbanistSemiBold }}>
                    {product.product_name}
                  </Text>
                ))}
              </View>
            )}
          </View>
        </View>
        <View style={{ padding: 10, marginTop: 20 }}>
          <Text style={{ fontFamily: FONT_FAMILY.urbanistBold, fontSize: 16 }}>Details:</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginTop: 10 }}>
            <Text style={{ width: '50%', fontFamily: FONT_FAMILY.urbanistSemiBold }}>Product Code:</Text>
            <Text style={{ width: '50%', fontFamily: FONT_FAMILY.urbanistSemiBold }}>{details.product_code || 'N/A'}</Text>
          </View>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginTop: 10 }}>
            <Text style={{ width: '50%', fontFamily: FONT_FAMILY.urbanistSemiBold }}>Category:</Text>
            <Text style={{ width: '50%', fontFamily: FONT_FAMILY.urbanistSemiBold }}>{details.category?.category_name || 'N/A'}</Text>
          </View>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginTop: 10 }}>
            <Text style={{ width: '50%', fontFamily: FONT_FAMILY.urbanistSemiBold }}>Area:</Text>
            <Text style={{ width: '50%', fontFamily: FONT_FAMILY.urbanistSemiBold }}>{details.area?.[0]?.area_name || 'N/A'}</Text>
          </View>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginTop: 10 }}>
            <Text style={{ width: '50%', fontFamily: FONT_FAMILY.urbanistSemiBold }}>Product Location:</Text>
            <Text style={{ width: '50%', fontFamily: FONT_FAMILY.urbanistSemiBold }}>{details.product_location?.[0]?.location_name || 'N/A'}</Text>
          </View>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginTop: 10 }}>
            <Text style={{ width: '50%', fontFamily: FONT_FAMILY.urbanistSemiBold }}>Price:</Text>
            <Text style={{ width: '50%', fontFamily: FONT_FAMILY.urbanistSemiBold }}>{details.cost || 'N/A'} AED</Text>
          </View>
        </View>
        {renderStockDetails()}
        {renderInventoryBoxDetails()}
      </RoundedScrollContainer>
      {loading && <OverlayLoader visible={true} backgroundColor={true} />}
    </SafeAreaView>
  );
};

export default ProductDetail;
