import React from 'react'
import { FlatList } from 'react-native'
import { NavigationHeader } from '@components/Header';
import { RoundedContainer, SafeAreaView } from '@components/containers'
import { ListItem } from '@components/Options';
import { formatData } from '@utils/formatters';
import { EmptyItem } from '@components/common/empty';
import { COLORS } from '@constants/theme';
import { useLoader } from '@hooks';
import { fetchProductDetailsByBarcode} from "@api/details/detailApi";
import { showToastMessage } from '@components/Toast';
import { OverlayLoader } from '@components/Loader';

const OptionsScreen = ({ navigation }) => {

  const [loading, startLoading, stopLoading] = useLoader(false);

  const handleScan = async (code) => {
    startLoading();
    try {
      const productDetails = await fetchProductDetailsByBarcode(code);
      if (productDetails.length > 0) {
        const details = productDetails[0];
        navigation.navigate('ProductDetail', { detail: details })
      } else {
        showToastMessage("No Products found for this Barcode");
      }
    } catch (error) {
      showToastMessage(`Error fetching inventory details ${error.message}`);
    } finally {
      stopLoading();
    }
  };

  const options =
    [
      { title: 'Search Products', image: require('@assets/images/Home/options/search_product.png'), onPress: () => navigation.navigate('Products') },
      { title: 'Scan Barcode', image: require('@assets/images/Home/options/scan_barcode.png'), onPress: () =>   navigation.navigate("Scanner", {onScan: handleScan})},
      { title: 'Product Enquiry', image: require('@assets/images/Home/options/product_enquiry.png'), onPress: () => navigation.navigate('') },
      { title: 'Purchase Requisition', image: require('@assets/images/Home/options/product_purchase_requisition.png'), onPress: () => navigation.navigate('') },
      { title: 'Transaction Auditing', image: require('@assets/images/Home/options/transaction_auditing.png'), onPress: () => navigation.navigate('AuditScreen') },
      { title: 'Task Manager', image: require('@assets/images/Home/options/tasK_manager_1.png'), onPress: () => navigation.navigate('TaskManagerScreen') },
      { title: 'Market Study', image: require('@assets/images/Home/options/market_study_1.png'), onPress: () => navigation.navigate('') },
      { title: 'Attendance', image: require('@assets/images/Home/options/attendance.png'), onPress: () => navigation.navigate('') },
      { title: 'Inventory Management', image: require('@assets/images/Home/options/inventory_management_1.png'), onPress: () => navigation.navigate('InventoryScreen') }
    ]

    const renderItem = ({ item }) => {
      if (item.empty) {
        return <EmptyItem />;
      }
      return <ListItem title={item.title} image={item.image} onPress={item.onPress} />;
    };
  

  return (
    <SafeAreaView backgroundColor={COLORS.white}>
      <NavigationHeader
        title="Options"
        color={COLORS.black}
        backgroundColor={COLORS.white}
        onBackPress={() => navigation.goBack()}
      />
      <RoundedContainer backgroundColor={COLORS.primaryThemeColor}>
        <FlatList
          data={formatData(options, 2)}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ padding: 15 }}
          renderItem={renderItem}
          numColumns={2}
          keyExtractor={(item, index) => index.toString()}
        />
        <OverlayLoader visible={loading}/>
      </RoundedContainer>
    </SafeAreaView>
  )
}

export default OptionsScreen