import React, { useState, useEffect } from 'react';
import { FAB, Portal } from 'react-native-paper';
import { RoundedContainer, SafeAreaView } from '@components/containers';
import { NavigationHeader } from '@components/Header';
import { OverlayLoader } from '@components/Loader';
import { EmptyItem, EmptyState } from '@components/common/empty';
import { FlashList } from '@shopify/flash-list';
import { InputModal } from '@components/Modal';
import { useIsFocused } from '@react-navigation/native';
import { showToastMessage } from '@components/Toast';
import InventoryList from './InventoryList';
import { fetchInventoryBoxRequest } from '@api/services/generalApi';
import { fetchInventoryDetails, fetchInventoryDetailsByName } from '@api/details/detailApi';
import { useDataFetching } from '@hooks';
import { formatData } from '@utils/formatters';
import { COLORS, FONT_FAMILY } from '@constants/theme';
import useAuthStore from '@stores/auth/authStore';

const InventoryScreen = ({ navigation }) => {
  const isFocused = useIsFocused();
  const [isVisibleModal, setIsVisibleModal] = useState(false);
  const [isFabOpen, setIsFabOpen] = useState(false);
  const [scanLoading, setScanLoading] = useState(false);
  const [modalLoading, setModalLoading] = useState(false);
  const { data, loading, fetchData, fetchMoreData } = useDataFetching(fetchInventoryBoxRequest);
  const currentUser = useAuthStore(state => state.user)
  const warehouseId = currentUser?.warehouse?.warehouse_id || ''

  useEffect(() => {
    fetchData();
  }, []);

  const handleLoadMore = () => {
    fetchMoreData();
  };

  const renderOverlayLoader = () => (
    <OverlayLoader visible={true} />
  );

  const handleScan = async (scannedData) => {
    setScanLoading(true);
    try {
      const inventoryDetails = await fetchInventoryDetails(scannedData);
      if (inventoryDetails.length > 0) {
        navigation.navigate('InventoryDetails', { inventoryDetails: inventoryDetails[0] });
      } else {
        showToastMessage('No inventory box found for this box no');
      }
    } catch (error) {
      console.error('Error fetching inventory details:', error);
      showToastMessage('Error fetching inventory details');
    } finally {
      setScanLoading(false);
    }
  };

  const handleModalInput = async (text) => {
    setModalLoading(true);
    try {
      const inventoryDetails = await fetchInventoryDetailsByName(text, warehouseId);
      if (inventoryDetails.length > 0) {
        navigation.navigate('InventoryDetails', { inventoryDetails: inventoryDetails[0] });
      } else {
        showToastMessage('No inventory box found for this box no');
      }
    } catch (error) {
      console.error('Error fetching inventory details by name:', error);
      showToastMessage('Error fetching inventory details');
    } finally {
      setModalLoading(false);
    }
  };

  const renderItem = ({ item }) => {
    if (item.empty) {
      return <EmptyItem />;
    }
    return <InventoryList item={item} />;
  };

  const renderEmptyState = () => (
    <EmptyState imageSource={require('@assets/images/EmptyData/empty_inventory_box.png')} message={''} />
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
      estimatedItemSize={100}
    />
  );

  const renderInventoryRequest = () => {
    if (data.length === 0 && !loading) {
      return renderEmptyState();
    }
    return renderContent();
  };

  return (
    <SafeAreaView>
      <NavigationHeader
        title="Inventory Management"
        onBackPress={() => navigation.goBack()}
      />
      <RoundedContainer>
        {loading && renderOverlayLoader()}
        {renderInventoryRequest()}
        {isFocused && (
          <Portal>
            <FAB.Group
              fabStyle={{ backgroundColor: COLORS.primaryThemeColor, borderRadius: 30 }}
              color={COLORS.white}
              backdropColor='rgba(0, 0, 2, 0.7)'
              open={isFabOpen}
              visible={isFocused}
              icon={isFabOpen ? 'arrow-up' : 'plus'}
              actions={[
                { icon: 'barcode-scan', label: 'Scan', labelStyle: { fontFamily: FONT_FAMILY.urbanistSemiBold, color: COLORS.white }, onPress: () => navigation.navigate('Scanner', { onScan: handleScan }) },
                { icon: 'pencil', label: 'Box no', labelStyle: { fontFamily: FONT_FAMILY.urbanistSemiBold, color: COLORS.white }, onPress: () => setIsVisibleModal(true) },
              ]}
              onStateChange={({ open }) => setIsFabOpen(open)}
            />
          </Portal>
        )}
      </RoundedContainer>
      <InputModal
        isVisible={isVisibleModal}
        onClose={() => setIsVisibleModal(false)}
        onSubmit={(text) => handleModalInput(text)}
      />

      {(scanLoading || modalLoading) && (
        <OverlayLoader visible={true} bakgroundColor={true} />
      )}
    </SafeAreaView>
  );
};

export default InventoryScreen;
