import React, { useEffect, useCallback } from 'react';
import { View } from 'react-native';
import { NavigationHeader } from '@components/Header';
import { ProductsList } from '@components/Product';
import { fetchProducts } from '@api/services/generalApi';
import { useIsFocused, useFocusEffect } from '@react-navigation/native';
import { FlashList } from '@shopify/flash-list';
import { formatData } from '@utils/formatters';
import { OverlayLoader } from '@components/Loader';
import { RoundedContainer, SafeAreaView, SearchContainer } from '@components/containers';
import styles from './styles';
import { EmptyState } from '@components/common/empty';
import useDataFetching from '@hooks/useDataFetching';
import useDebouncedSearch from '@hooks/useDebouncedSearch';

const ProductsScreen = ({ navigation, route }) => {
  const categoryId = route?.params?.id;

  const isFocused = useIsFocused();
  const { data, loading, fetchData, fetchMoreData } = useDataFetching(fetchProducts);
  const { searchText, handleSearchTextChange } = useDebouncedSearch((text) => fetchData(text, categoryId), 500);

  useFocusEffect(
    useCallback(() => {
      fetchData(searchText, categoryId);
    }, [categoryId, searchText])
  );

  useEffect(() => {
    if (isFocused) {
      fetchData(searchText, categoryId);
    }
  }, [isFocused, categoryId, searchText]);

  const handleLoadMore = () => {
    fetchMoreData(searchText, categoryId);
  };

  const renderItem = ({ item }) => {
    if (item.empty) {
      return <View style={[styles.itemStyle, styles.itemInvisible]} />;
    }
    return <ProductsList item={item} onPress={() => navigation.navigate('ProductDetail', { detail: item })} />;
  };

  const renderEmptyState = () => (
    <EmptyState imageSource={require('@assets/images/EmptyData/empty_data.png')} message={''} />
  );

  const renderContent = () => (
    <FlashList
      data={formatData(data, 3)}
      numColumns={3}
      renderItem={renderItem}
      keyExtractor={(item, index) => index.toString()}
      contentContainerStyle={{ padding: 10, paddingBottom: 50 }}
      onEndReached={handleLoadMore}
      showsVerticalScrollIndicator={false}
      onEndReachedThreshold={0.2}
      estimatedItemSize={100}
    />
  );

  const renderProducts = () => {
    if (data.length === 0 && !loading) {
      return renderEmptyState();
    }
    return renderContent();
  };

  return (
    <SafeAreaView>
      <NavigationHeader title="Products" onBackPress={() => navigation.goBack()} />
      <SearchContainer placeholder="Search Products" onChangeText={handleSearchTextChange} value={searchText} />
      <RoundedContainer>
        {renderProducts()}
      </RoundedContainer>
      <OverlayLoader visible={loading}/>
    </SafeAreaView>
  );
};

export default ProductsScreen;
