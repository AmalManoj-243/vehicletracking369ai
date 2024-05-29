import React from 'react'
import { ButtonContainer, RoundedScrollContainer, SafeAreaView } from '@components/containers'
import { NavigationHeader } from '@components/Header'
import Text from '@components/Text'
import { View, FlatList } from 'react-native';
import { COLORS } from '@constants/theme';
import { DetailField } from '@components/common/Detail';
import { EmptyState } from '@components/common/empty';
import { formatDate } from '@utils/common/date';
import InventoryBoxList from './InventoryBoxList';
import useAuthStore from '@stores/auth/authStore';
import { Button } from '@components/common/Button';
import { styles } from './styles';

const InventoryDetails = ({ navigation, route }) => {

  const { inventoryDetails } = route?.params || {};
  console.log("🚀 ~ InventoryDetails ~ inventoryDetails:", inventoryDetails)
  const currentUser = useAuthStore(state => state.user)

  const isResponsible = (userId) => {
    if (currentUser && (userId === currentUser.related_profile._id)) {
      return true;
    } else {
      return false;
    }
  }

  const renderItem = ({ item }) => {
    if (item.empty) {
      return <EmptyItem />;
    }
    return <InventoryBoxList item={item} />;
  };

  const renderEmptyState = () => (
    <EmptyState imageSource={require('@assets/images/EmptyData/empty_inventory_box.png')} message={'Box items is empty'} />
  );

  const renderContent = () => (
    <FlatList
      data={inventoryDetails?.items || []}
      numColumns={1}
      renderItem={renderItem}
      keyExtractor={(item, index) => index.toString()}
      showsVerticalScrollIndicator={false}
      estimatedItemSize={100}
    />
  );
  const renderInventoryRequest = () => {
    if (inventoryDetails?.items?.length === 0) {
      return renderEmptyState();
    }
    return renderContent();
  };

  return (
    <SafeAreaView>
      <NavigationHeader
        onBackPress={() => navigation.goBack()}
        title={'Inventory Details'}
      />
      <RoundedScrollContainer>
        <DetailField label={'Inventory Box'} value={inventoryDetails?.name} />
        <DetailField label={'Location'} value={inventoryDetails?.location_name} />
        <DetailField label={'Date'} value={formatDate(inventoryDetails?.date, "yyyy-MM-dd hh:mm a")} />
        <View style={{ marginVertical: 10 }} />
        <Text style={styles.label}>Box Items</Text>
        {renderInventoryRequest()}
        {
          currentUser && isResponsible(inventoryDetails?.responsible_person?._id)
            || inventoryDetails?.employees?.some(employee => isResponsible(employee._id)) ?
            (<ButtonContainer>
              <Button
                title="Box Opening Request"
                backgroundColor={COLORS.boxTheme}
                onPress={() => navigation.navigate('InventoryForm', {
                  items: inventoryDetails?.items || [],
                  boxId: inventoryDetails?._id
                })}
              />
            </ButtonContainer>)
            : <Text style={styles.notification}>You do not have permission to open the box request</Text>
        }
        {/* {
          currentUser ?
            (<ButtonContainer>
              <Button title={'Box Opening Request'}
                backgroundColor={COLORS.boxTheme}
                onPress={() => navigation.navigate('InventoryForm', {
                  items: inventoryDetails?.items || [],
                  boxId: inventoryDetails?._id
                })}
              />
            </ButtonContainer>)
            : <Text style={styles.notification}>You do not have permission to open the box request</Text>
        } */}
      </RoundedScrollContainer>
    </SafeAreaView>
  )
}

export default InventoryDetails