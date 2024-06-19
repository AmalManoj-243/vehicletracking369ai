import React, { useState, useEffect, useCallback } from "react";
import { FAB, Portal } from "react-native-paper";
import { RoundedContainer, SafeAreaView } from "@components/containers";
import { NavigationHeader } from "@components/Header";
import { OverlayLoader } from "@components/Loader";
import { EmptyItem, EmptyState } from "@components/common/empty";
import { FlashList } from "@shopify/flash-list";
import {
  InputModal,
  CustomListModal,
  EmployeeListModal,
} from "@components/Modal";
import { useFocusEffect, useIsFocused } from "@react-navigation/native";
import { showToastMessage } from "@components/Toast";
import InventoryList from "./InventoryList";
import { fetchInventoryBoxRequest } from "@api/services/generalApi";
import {
  fetchInventoryDetails,
  fetchInventoryDetailsByName,
} from "@api/details/detailApi";
import { useDataFetching } from "@hooks";
import { formatData } from "@utils/formatters";
import { COLORS, FONT_FAMILY } from "@constants/theme";
import useAuthStore from "@stores/auth/authStore";
import { reasons } from "@constants/dropdownConst";
import { fetchEmployeesDropdown } from "@api/dropdowns/dropdownApi";

const InventoryScreen = ({ navigation }) => {
  const isFocused = useIsFocused();
  const [isVisibleModal, setIsVisibleModal] = useState(false);
  const [isFabOpen, setIsFabOpen] = useState(false);
  const [scanLoading, setScanLoading] = useState(false);
  const [modalLoading, setModalLoading] = useState(false);
  const [getDetail, setGetDetail] = useState(null);
  const [employee, setEmployee] = useState([]);
  const [isVisibleCustomListModal, setIsVisibleCustomListModal] =
    useState(false);
  const [isVisibleEmployeeListModal, setIsVisibleEmployeeListModal] =
    useState(false);
  const { data, loading, fetchData, fetchMoreData } = useDataFetching(
    fetchInventoryBoxRequest
  );

  const currentUser = useAuthStore((state) => state.user);
  const warehouseId = currentUser?.warehouse?.warehouse_id || "";

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

  const handleLoadMore = () => {
    fetchMoreData();
  };

  const handleScan = async (scannedData) => {
    setScanLoading(true);
    try {
      const inventoryDetails = await fetchInventoryDetails(scannedData);
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
      console.error("Error fetching inventory details:", error);
      showToastMessage("Error fetching inventory details");
    } finally {
      setScanLoading(false);
    }
  };

  const handleModalInput = async (text) => {
    setModalLoading(true);
    try {
      const inventoryDetails = await fetchInventoryDetailsByName(
        text,
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
      setModalLoading(false);
    }
  };

  const renderItem = ({ item }) =>
    item.empty ? <EmptyItem /> : <InventoryList item={item} />;

  const renderEmptyState = () => (
    <EmptyState
      imageSource={require("@assets/images/EmptyData/empty_inventory_box.png")}
      message={""}
    />
  );

  const handleBoxOpeningRequest = (value) => {
    if (value) {
      navigation.navigate("InventoryForm", {
        reason: value,
        inventoryDetails: getDetail,
      });
    }
  };

  const handleSelectTemporaryAssignee = (value) => {
  };
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
      estimatedItemSize={100}
    />
  );

  const renderInventoryRequest = () =>
    data.length === 0 && !loading ? renderEmptyState() : renderContent();

  return (
    <SafeAreaView>
      <NavigationHeader
        title="Inventory Management"
        onBackPress={() => navigation.goBack()}
      />
      <RoundedContainer>
        {loading && <OverlayLoader visible />}
        {renderInventoryRequest()}
        {isFocused && (
          <Portal>
            <FAB.Group
              fabStyle={{
                backgroundColor: COLORS.primaryThemeColor,
                borderRadius: 30,
              }}
              color={COLORS.white}
              backdropColor="rgba(0, 0, 2, 0.7)"
              open={isFabOpen}
              visible={isFocused}
              icon={isFabOpen ? "arrow-up" : "plus"}
              actions={[
                {
                  icon: "barcode-scan",
                  label: "Scan",
                  labelStyle: {
                    fontFamily: FONT_FAMILY.urbanistSemiBold,
                    color: COLORS.white,
                  },
                  onPress: () =>
                    navigation.navigate("Scanner", {
                      onScan: handleScan,
                      // onClose: true,
                    }),
                },
                {
                  icon: "pencil",
                  label: "Box no",
                  labelStyle: {
                    fontFamily: FONT_FAMILY.urbanistSemiBold,
                    color: COLORS.white,
                  },
                  onPress: () => setIsVisibleModal(true),
                },
              ]}
              onStateChange={({ open }) => setIsFabOpen(open)}
            />
          </Portal>
        )}
      </RoundedContainer>
      <InputModal
        isVisible={isVisibleModal}
        onClose={() => setIsVisibleModal(false)}
        onSubmit={handleModalInput}
      />
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

      {(scanLoading || modalLoading) && <OverlayLoader visible />}
    </SafeAreaView>
  );
};

export default InventoryScreen;
