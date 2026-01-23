import React, { useState, useEffect, useCallback } from 'react';
import { useIsFocused, useFocusEffect } from '@react-navigation/native';
import { FlashList } from '@shopify/flash-list';
import { formatData } from '@utils/formatters';
import { RoundedContainer, SafeAreaView } from '@components/containers';
import { EmptyItem, EmptyState } from '@components/common/empty';
import { NavigationHeader } from '@components/Header';
import { FABButton, LoadingButton, PressableInput } from '@components/common/Button';
import { fetchStaffTrackingList, fetchUsersOdoo } from '@api/services/generalApi';
import { useDataFetching } from '@hooks';
import AnimatedLoader from '@components/Loader/AnimatedLoader';
import Text from '@components/Text';
import { TouchableOpacity, View, StyleSheet, Platform, Image } from 'react-native';
import { COLORS, FONT_FAMILY } from '@constants/theme';
import { FontAwesome, MaterialIcons } from '@expo/vector-icons';
import { DropdownSheet, MultiSelectDropdownSheet } from '@components/common/BottomSheets';
import DateTimePickerModal from 'react-native-modal-datetime-picker';
import moment from 'moment';
import { filterCalendar } from '@constants/dropdownConst';
import { useAuthStore } from '@stores/auth';
import { StaffTrackingList } from '@components/CRM';

const StaffTrackingScreen = ({ navigation }) => {
  const isFocused = useIsFocused();
  const currentUser = useAuthStore((state) => state.user);
  const currentUserId = currentUser?.related_profile?._id || '';
  const [selectedType, setSelectedType] = useState(null);
  const [isVisible, setIsVisible] = useState(false);
  const [isDatePickerVisible, setDatePickerVisibility] = useState(false);
  const [datePickerMode, setDatePickerMode] = useState('from');
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [employeeList, setEmployeeList] = useState([]);
  const [employeeLoading, setEmployeeLoading] = useState(true);

  const [formData, setFormData] = useState({
    fromDate: '',
    toDate: '',
    employees: [],
    departments: [],
  });

  const [dropdown, setDropdown] = useState({
    employees: [],
    departments: [],
  });

  const { data, loading, fetchData, fetchMoreData } = useDataFetching(fetchStaffTrackingList);

  // Fetch users from Odoo on mount
  useEffect(() => {
    const fetchUsers = async () => {
      setEmployeeLoading(true);
      try {
        const users = await fetchUsersOdoo({ limit: 100 });

        setEmployeeList(users.map((user) => ({
          id: user.id,
          name: user.name,
          login: user.login || '',
          email: user.email || '',
          image_url: user.image_url,
        })));

        setDropdown({
          employees: users.map((user) => ({
            id: user.id,
            label: user.name,
          })),
          departments: [],
        });
      } catch (error) {
        console.error("Error fetching users from Odoo:", error);
      } finally {
        setEmployeeLoading(false);
      }
    };

    fetchUsers();
  }, []);

  // Fetch tracking data when employee is selected
  useFocusEffect(
    useCallback(() => {
      if (selectedEmployee) {
        fetchData({ employeeIds: [selectedEmployee.id] });
      }
    }, [selectedEmployee])
  );

  useEffect(() => {
    if (isFocused && selectedEmployee) {
      fetchData({ employeeIds: [selectedEmployee.id] });
    }
  }, [isFocused, selectedEmployee]);

  const handleLoadMore = () => {
    if (selectedEmployee) {
      fetchMoreData({ employeeIds: [selectedEmployee.id] });
    }
  };

  const handleEmployeeSelect = (employee) => {
    setSelectedEmployee(employee);
    fetchData({ employeeIds: [employee.id] });
  };

  const handleBackToEmployeeList = () => {
    setSelectedEmployee(null);
    setFormData({
      fromDate: '',
      toDate: '',
      employees: [],
      departments: [],
    });
  };

  // User List Item Component
  const EmployeeListItem = ({ item, onPress }) => (
    <TouchableOpacity activeOpacity={0.8} onPress={onPress} style={styles.employeeItem}>
      {item.image_url ? (
        <Image source={{ uri: item.image_url }} style={styles.employeeImage} />
      ) : (
        <View style={styles.employeeIconContainer}>
          <MaterialIcons name="person" size={28} color={COLORS.primaryThemeColor} />
        </View>
      )}
      <View style={styles.employeeInfo}>
        <Text style={styles.employeeName}>{item.name}</Text>
        {item.login && <Text style={styles.employeeDepartment}>{item.login}</Text>}
        {item.email && <Text style={styles.employeeEmail}>{item.email}</Text>}
      </View>
      <MaterialIcons name="chevron-right" size={24} color="#999" />
    </TouchableOpacity>
  );

  const renderEmployeeItem = ({ item }) => {
    if (item.empty) {
      return <EmptyItem />;
    }
    return <EmployeeListItem item={item} onPress={() => handleEmployeeSelect(item)} />;
  };

  const renderTrackingItem = ({ item }) => {
    if (item.empty) {
      return <EmptyItem />;
    }
    const { longitude, latitude, check_in_time, check_out_time, employee, location_name, remarks, _id } = item;
    const details = { longitude, latitude, check_in_time, check_out_time, employee, location_name, remarks, _id };
    return <StaffTrackingList item={item} onPress={() => navigation.navigate('StaffTrackingDetails', { trackingDetails: details })} />;
  };

  const renderEmptyState = (message) => (
    <EmptyState imageSource={require('@assets/images/EmptyData/empty_data.png')} message={message} />
  );

  const renderEmployeeList = () => {
    if (employeeLoading) {
      return (
        <View style={styles.loadingContainer}>
          <AnimatedLoader
            visible={true}
            animationSource={require('@assets/animations/loading.json')}
          />
        </View>
      );
    }

    if (employeeList.length === 0) {
      return renderEmptyState('No users found');
    }

    return (
      <FlashList
        data={formatData(employeeList, 1)}
        numColumns={1}
        renderItem={renderEmployeeItem}
        keyExtractor={(item, index) => index.toString()}
        contentContainerStyle={{ padding: 10, paddingBottom: 50 }}
        showsVerticalScrollIndicator={false}
        estimatedItemSize={80}
      />
    );
  };

  const renderTrackingContent = () => (
    <FlashList
      data={formatData(data, 1)}
      numColumns={1}
      renderItem={renderTrackingItem}
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

  const renderTrackingListing = () => {
    if (data.length === 0 && !loading) {
      return renderEmptyState('No tracking records found for this employee');
    }
    return renderTrackingContent();
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

  const handleDateConfirm = (date) => {
    const formattedDate = moment(date).format('DD-MM-YYYY');
    if (datePickerMode === 'from') {
      handleFieldChange('fromDate', formattedDate);
    } else {
      handleFieldChange('toDate', formattedDate);
    }
    setDatePickerVisibility(false);
  };

  const handleDateRangeSelection = (rangeType) => {
    let fromDate = moment();
    let toDate = moment();

    switch (rangeType.value) {
      case 'Yesterday':
        fromDate = fromDate.subtract(1, 'days');
        toDate = toDate.subtract(1, 'days');
        break;
      case 'Today':
        break;
      case 'Tomorrow':
        fromDate = fromDate.add(1, 'days');
        toDate = toDate.add(1, 'days');
        break;
      case 'This Month':
        fromDate = fromDate.startOf('month');
        toDate = toDate.endOf('month');
        break;
      case 'Last Month':
        fromDate = fromDate.subtract(1, 'months').startOf('month');
        toDate = toDate.subtract(1, 'months').endOf('month');
        break;
      case 'This Year':
        fromDate = fromDate.startOf('year');
        toDate = toDate.endOf('year');
        break;
      default:
        return;
    }

    handleFieldChange('fromDate', fromDate.format('DD-MM-YYYY'));
    handleFieldChange('toDate', toDate.format('DD-MM-YYYY'));
    setIsVisible(false);
  };

  const renderBottomSheet = () => {
    let items = [];
    let isMultiSelect = false;

    switch (selectedType) {
      case 'Select Durations':
        items = filterCalendar;
        isMultiSelect = false;
        break;
      default:
        return null;
    }

    return (
      <DropdownSheet
        isVisible={isVisible}
        items={items}
        title={selectedType}
        onClose={() => setIsVisible(false)}
        onValueChange={(value) => {
          if (selectedType === 'Select Durations') {
            handleDateRangeSelection(value);
          }
        }}
      />
    );
  };

  const applyFilters = () => {
    if (selectedEmployee) {
      fetchData({
        fromDate: formData.fromDate,
        toDate: formData.toDate,
        employeeIds: [selectedEmployee.id],
      });
    }
  };

  const clearFilters = () => {
    setFormData({
      fromDate: '',
      toDate: '',
      employees: [],
      departments: [],
    });
    if (selectedEmployee) {
      fetchData({ employeeIds: [selectedEmployee.id] });
    }
  };

  // Render Employee List View (default)
  if (!selectedEmployee) {
    return (
      <SafeAreaView>
        <NavigationHeader
          title="Staff Tracking"
          logo={false}
          onBackPress={() => navigation.goBack()}
        />
        <View style={styles.headerInfo}>
          <Text style={styles.headerInfoText}>Select a user to view their tracking records</Text>
        </View>
        <RoundedContainer>
          {renderEmployeeList()}
        </RoundedContainer>
      </SafeAreaView>
    );
  }

  // Render Tracking Records View (when employee selected)
  return (
    <SafeAreaView>
      <NavigationHeader
        title={selectedEmployee.name}
        logo={false}
        refreshPress={clearFilters}
        refreshIcon
        onBackPress={handleBackToEmployeeList}
      />
      <View style={{ paddingHorizontal: 25, marginBottom: 8 }}>
        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingBottom: 8 }}>
          <Text style={styles.label}>From</Text>
          <PressableInput
            placeholder='From Date'
            value={formData.fromDate}
            handlePress={() => {
              setDatePickerMode('from');
              setDatePickerVisibility(true);
            }}
          />
          <View style={{ width: 10 }} />
          <Text style={styles.label}>To</Text>
          <PressableInput
            placeholder='To Date'
            value={formData.toDate}
            handlePress={() => {
              setDatePickerMode('to');
              setDatePickerVisibility(true);
            }}
          />
          <View style={{ width: 10 }} />
          <TouchableOpacity onPress={() => toggleBottomSheet('Select Durations')}>
            <FontAwesome name="calendar" size={28} color="white" />
          </TouchableOpacity>
        </View>
        <View style={{ flexDirection: "row", justifyContent: "flex-end", paddingBottom: 8 }}>
          <LoadingButton
            width={100}
            onPress={applyFilters}
            marginVertical={0}
            height={35}
            borderRadius={6}
            title='Apply'
          />
        </View>
      </View>
      <RoundedContainer>
        {renderBottomSheet()}
        {renderTrackingListing()}
      </RoundedContainer>
      <DateTimePickerModal
        isVisible={isDatePickerVisible}
        mode="date"
        onConfirm={handleDateConfirm}
        onCancel={() => setDatePickerVisibility(false)}
      />
    </SafeAreaView>
  );
};

export default StaffTrackingScreen;

const styles = StyleSheet.create({
  label: {
    fontFamily: FONT_FAMILY.urbanistSemiBold,
    color: COLORS.white,
    marginRight: 10
  },
  headerInfo: {
    paddingHorizontal: 25,
    paddingVertical: 12,
  },
  headerInfoText: {
    fontFamily: FONT_FAMILY.urbanistMedium,
    color: COLORS.white,
    fontSize: 14,
    textAlign: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 50,
  },
  employeeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 5,
    marginVertical: 5,
    backgroundColor: 'white',
    borderRadius: 15,
    ...Platform.select({
      android: {
        elevation: 4,
      },
      ios: {
        shadowColor: 'black',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
      },
    }),
    padding: 16,
  },
  employeeIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#F0F0F0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  employeeImage: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginRight: 12,
  },
  employeeInfo: {
    flex: 1,
  },
  employeeName: {
    fontFamily: FONT_FAMILY.urbanistBold,
    fontSize: 16,
    color: COLORS.black,
    marginBottom: 2,
  },
  employeeDepartment: {
    fontFamily: FONT_FAMILY.urbanistMedium,
    fontSize: 13,
    color: '#666',
  },
  employeeEmail: {
    fontFamily: FONT_FAMILY.urbanistMedium,
    fontSize: 12,
    color: '#888',
  },
});
