import React, { useState, useEffect, useCallback } from 'react';
import { useIsFocused, useFocusEffect } from '@react-navigation/native';
import { FlashList } from '@shopify/flash-list';
import { formatData } from '@utils/formatters';
import { Loader } from '@components/Loader';
import { RoundedContainer, SafeAreaView } from '@components/containers';
import { debounce } from 'lodash';
import { EmptyItem, EmptyState } from '@components/common/empty';
import { NavigationHeader } from '@components/Header';
import { FABButton } from '@components/common/Button';
import { fetchAuditing, fetchProducts } from '@api/services/generalApi';
import { AuditList } from '../Audit';
import { useDataFetching } from '@hooks';

const InventoryScreen = ({ navigation }) => {

  const { data, loading, fetchData, fetchMoreData } = useDataFetching(fetchProducts);
  console.log("🚀 ~ InventoryScreen ~ data:", data)

  const [searchText, setSearchText] = useState('');
  useEffect(() => {
    fetchData(searchText); // Fetch initial data when component mounts or when search query changes
  }, [fetchData]);

  const handleLoadMore = () => {
    fetchMoreData(); // Fetch more data when user triggers load more action with search query
  };

  const [responseData, setResponseData] = useState([]);

  const debouncedSearch = useCallback(
    debounce((text) => {
      setSearchText(text);
    }, 1000),
    []
  );

  const handleSearchTextChange = (text) => {
    debouncedSearch(text);
  };

  const renderItem = ({ item }) => {
    if (item.empty) {
      return <EmptyItem />;
    }
    return (
      <AuditList item={item} />
    );
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
      ListFooterComponent={loading && <Loader visible={loading} animationSource={require('@assets/animations/loading.json')} />}
      estimatedItemSize={100}
    />
  );

  const renderAuditing = () => {

    return renderContent();
  };


  return (
    <SafeAreaView>
      <NavigationHeader
        title="Transaction Auditing"
        onBackPress={() => navigation.goBack()}
      />
      <RoundedContainer>
        {renderAuditing()}
        <FABButton onPress={() => navigation.navigate('AuditForm')} />
      </RoundedContainer>
    </SafeAreaView>
  )
}

export default InventoryScreen