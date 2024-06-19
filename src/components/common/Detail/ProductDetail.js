import React, { useState, useEffect } from 'react';
import { View, Image, TouchableOpacity } from 'react-native';
import Text from '@components/Text';
import { RoundedScrollContainer, SafeAreaView } from '@components/containers';
import { NavigationHeader } from '@components/Header';
import { COLORS, FONT_FAMILY } from '@constants/theme';
import { fetchInventoryDetailsByName, fetchProductDetails } from '@api/details/detailApi';
import { showToastMessage } from '@components/Toast';
import useAuthStore from '@stores/auth/authStore';
import { OverlayLoader } from '@components/Loader';
import { CustomListModal, EmployeeListModal } from '@components/Modal';
import { reasons } from '@constants/dropdownConst';
import { fetchEmployeesDropdown } from '@api/dropdowns/dropdownApi';

const ProductDetail = ({ navigation, route }) => {
  const { detail = {} } = route?.params;
  const [details, setDetails] = useState({});
  const [loading, setLoading] = useState(false);
  const [getDetail, setGetDetail] = useState(null);
  const [isVisibleCustomListModal, setIsVisibleCustomListModal] =
    useState(false);
  const [isVisibleEmployeeListModal, setIsVisibleEmployeeListModal] =
    useState(false);
  const [employee, setEmployee] = useState([]);
  const currentUser = useAuthStore(state => state.user);
  const warehouseId = currentUser?.warehouse?.warehouse_id || '';

  const isResponsibleOrEmployee = (inventoryDetails) => {
    const responsiblePersonId = inventoryDetails?.responsible_person?._id;
    const employeeIds = inventoryDetails?.employees?.map((employee) => employee._id) || [];
    const tempAssigneeIds = inventoryDetails?.temp_assignee?.map((tempAssignee) => tempAssignee._id) || [];

    return (
      currentUser &&
      (currentUser.related_profile._id === responsiblePersonId ||
        employeeIds.includes(currentUser.related_profile._id) ||
        tempAssigneeIds.includes(currentUser.related_profile._id))
    );
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const employeeDropdown = await fetchEmployeesDropdown();
        const extract = employeeDropdown.map((employee) => ({
          id: employee._id,
          label: employee.name,
        }));
        setEmployee(extract);
      } catch (error) {
        console.error("Error fetching dropdown data:", error);
      }
    };

    fetchData();
  }, []);

  const handleBoxOpeningRequest = (value) => {
    if (value) {
      navigation.navigate("InventoryForm", {
        reason: value,
        inventoryDetails: getDetail,
      });
    }
  };

  const handleSelectTemporaryAssignee = (value) => {
    // console.log("🚀 ~ handleSelectTemporaryAssignee ~ value:", value);
  };

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
      const inventoryDetails = await fetchInventoryDetailsByName(
        boxName,
        warehouseId
      );
      if (inventoryDetails.length > 0) {
        const details = inventoryDetails[0];
        setGetDetail(details);
        if (isResponsibleOrEmployee(details)) {
          setIsVisibleCustomListModal(true);
        } else {
          navigation.navigate("InventoryDetails", {
            inventoryDetails: details,
          });
        }
      } else {
        showToastMessage("No inventory box found for this box no");
      }
    } catch (error) {
      console.error("Error fetching inventory details by name:", error);
      showToastMessage("Error fetching inventory details");
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
                style={{ marginTop: 10,  borderColor: COLORS.primaryThemeColor, padding:5, width:'40%', alignItems:'center', borderRadius:8,  backgroundColor: COLORS.lightGrey }}
                onPress={() => handleBoxNamePress(boxName)}
              >
                <Text style={{ fontFamily: FONT_FAMILY.urbanistBold, color: COLORS.orange, fontSize: 14 }}>Box Name: {boxName}</Text>
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
      <CustomListModal
        isVisible={isVisibleCustomListModal}
        items={reasons}
        title="Select Reason"
        onClose={() => setIsVisibleCustomListModal(false)}
        onValueChange={handleBoxOpeningRequest}
        onAdd={() => {
          setIsVisibleEmployeeListModal(true),
            setIsVisibleCustomListModal(false);
        }}
      />
      <EmployeeListModal
        isVisible={isVisibleEmployeeListModal}
        items={employee}
        boxId={getDetail?._id}
        title="Select Assignee"
        onClose={() => setIsVisibleEmployeeListModal(false)}
        onValueChange={handleSelectTemporaryAssignee}
      />

      {loading && <OverlayLoader visible={true} backgroundColor={true} />}
    </SafeAreaView>
  );
};

export default ProductDetail;
