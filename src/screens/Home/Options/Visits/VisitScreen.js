import React, { useEffect, useCallback, useState } from 'react';
import { useIsFocused, useFocusEffect } from '@react-navigation/native';
import { FlashList } from '@shopify/flash-list';
import { formatData } from '@utils/formatters';
import { RoundedContainer, SafeAreaView } from '@components/containers';
import { EmptyItem, EmptyState } from '@components/common/empty';
import { NavigationHeader } from '@components/Header';
import { FABButton, LoadingButton, PressableInput } from '@components/common/Button';
import { fetchCustomerVisitList } from '@api/services/generalApi';
import { useDataFetching } from '@hooks';
import AnimatedLoader from '@components/Loader/AnimatedLoader';
import Text from '@components/Text';
import { TouchableOpacity, View, StyleSheet } from 'react-native';
import { COLORS, FONT_FAMILY } from '@constants/theme';
import { FontAwesome } from '@expo/vector-icons';
import { fetchBrandsDropdown, fetchCustomersDropdown, fetchDepartmentsDropdown, fetchEmployeesDropdown } from '@api/dropdowns/dropdownApi';
import { DropdownSheet, MultiSelectDropdownSheet } from '@components/common/BottomSheets';

const VisitScreen = ({ navigation }) => {
  const isFocused = useIsFocused();
  const [selectedType, setSelectedType] = useState(null);
  const [isVisible, setIsVisible] = useState(false);

  const { data, loading, fetchData, fetchMoreData } = useDataFetching(fetchCustomerVisitList);

  useFocusEffect(
    useCallback(() => {
      fetchData();
    }, [])
  );

  useEffect(() => {
    if (isFocused) {
      fetchData();
    }
  }, [isFocused]);

  const [formData, setFormData] = useState({
    customer: '',
    employees: [],
    departments: [],
    brands: []
  });

  console.log("🚀 ~ VisitScreen ~ formData:", formData)
  const [dropdown, setDropdown] = useState({
    employees: [],
    departments: [],
    brands: [],
    customer: [],
  });


  useEffect(() => {
    const fetchData = async () => {
      try {
        const employeeDropdown = await fetchEmployeesDropdown();
        const departmentsDropdown = await fetchDepartmentsDropdown();
        const brandsDropdown = await fetchBrandsDropdown();
        const customersDropdown = await fetchCustomersDropdown();
        setDropdown({
          employees: employeeDropdown.map((data) => ({
            id: data._id,
            label: data.name,
          })),
          departments: departmentsDropdown.map((data) => ({
            id: data._id,
            label: data.department_name,
          })),
          brands: brandsDropdown.map((data) => ({
            id: data._id,
            label: data.brand_name,
          })),
          customer: customersDropdown.map((data) => ({
            id: data._id,
            label: data.name,
          })),
        });
      } catch (error) {
        console.error("Error fetching dropdown data:", error);
      }
    };

    fetchData();
  }, []);

  const handleLoadMore = () => {
    fetchMoreData();
  };

  const renderItem = ({ item }) => {
    if (item.empty) {
      return <EmptyItem />;
    }
    // return <AuditList item={item} />;
  };

  const renderEmptyState = () => (
    <EmptyState imageSource={require('@assets/images/EmptyData/transaction_empty.png')} message={''} />
  );

  const renderContent = () => (
    <FlashList
      data={formatData(data, 1)}
      numColumns={1}
      renderItem={renderItem}
      keyExtractor={(item, index) => index.toString()}
      contentContainerStyle={{ padding: 10, paddingBottom: 50 }}
      onEndReached={handleLoadMore}
      showsVerticalScrollIndicator={false}
      onEndReachedThreshold={0.2}
      ListFooterComponent={
        loading && (
          <AnimatedLoader
            visible={loading}
            animationSource={require('@assets/animations/loading.json')}
          />
        )
      }
      estimatedItemSize={100}
    />
  );

  const renderListing = () => {
    if (data.length === 0 && !loading) {
      return renderEmptyState();
    }
    return renderContent();
  };

  const toggleBottomSheet = (type) => {
    setSelectedType(type);
    setIsVisible(!isVisible);
  };

  const handleFieldChange = (fieldName, value) => {
    setFormData((prevState) => ({
      ...prevState,
      [fieldName]: value,
    }));
  };

  const renderBottomSheet = () => {
    let items = [];
    let isMultiSelect = true;

    switch (selectedType) {
      case "Employees":
        items = dropdown.employees;
        break;
      case "Departments":
        items = dropdown.departments;
        break;
      case "Brands":
        items = dropdown.brands;
        break;
      case "Customer":
        items = dropdown.customer;
        isMultiSelect = false;
        break;
      default:
        return null;
    }

    return isMultiSelect ? (
      <MultiSelectDropdownSheet
        isVisible={isVisible}
        items={items}
        title={selectedType}
        onClose={() => setIsVisible(false)}
        onValueChange={(value) => handleFieldChange(selectedType.toLowerCase(), value)}
      />
    ) : (
      <DropdownSheet
        isVisible={isVisible}
        items={items}
        title={selectedType}
        onClose={() => setIsVisible(false)}
        onValueChange={(value) => handleFieldChange("customer", value)}
      />
    );
  };

  return (
    <SafeAreaView>
      <NavigationHeader
        title="Customer Visits"
        logo={false}
        refreshPress={''}
        refreshIcon
        onBackPress={() => navigation.goBack()}
      />
      <View style={{ paddingHorizontal: 25, marginBottom: 8 }}>
        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingBottom: 8 }}>
          <Text style={styles.label} >From</Text>
          <PressableInput
            placeholder='From Date'
          />
          <View style={{ width: 10 }} />
          <Text style={styles.label}>To</Text>
          <PressableInput
            placeholder='To Date'
          />
          <View style={{ width: 10 }} />
          <TouchableOpacity onPress={() => toggleBottomSheet('filterCalendar')}>
            <FontAwesome name="calendar" size={28} color="white" />
          </TouchableOpacity>
        </View>
        <View style={{ flexDirection: "row", justifyContent: "space-between", paddingBottom: 8 }}>
          <PressableInput
            placeholder='Employee'
            dropIcon={"menu-down"}
            value={''}
            editable={false}
            handlePress={() => toggleBottomSheet('Employees')}
          />
          <View style={{ width: 3 }} />
          <PressableInput
            placeholder='Departments'
            dropIcon={"menu-down"}
            editable={false}
            handlePress={() => toggleBottomSheet('Departments')}
          />
          <View style={{ width: 3 }} />
          <PressableInput
            placeholder='Brands'
            dropIcon={"menu-down"}
            editable={false}
            handlePress={() => toggleBottomSheet('Brands')}
          />i
        </View>
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
          <Text style={styles.label} >Customers</Text>
          <View style={{ width: 3 }} />
          <PressableInput
            placeholder='Select Customer'
            dropIcon={"menu-down"}
            editable={false}
            handlePress={() => toggleBottomSheet('Customer')}
          />
          <View style={{ width: 3 }} />
          <LoadingButton
            width={100}
            marginVertical={0}
            height={35}
            borderRadius={6}
            title='Apply'
          />
        </View>
      </View>
      <RoundedContainer>
        {renderBottomSheet()}
        {/* {renderListing()} */}
        <FABButton onPress={() => navigation.navigate('AuditForm')} />
      </RoundedContainer>
    </SafeAreaView>
  );
};

export default VisitScreen;

const styles = StyleSheet.create({
  label: {
    fontFamily: FONT_FAMILY.urbanistSemiBold,
    color: COLORS.white,
    marginRight: 10
  }
});
