import React, { useEffect, useCallback } from 'react';
import { View } from 'react-native';
import { NavigationHeader } from '@components/Header';
import { fetchCategories } from '@api/services/generalApi';
import { useIsFocused, useFocusEffect } from '@react-navigation/native';
import { FlashList } from '@shopify/flash-list';
import { formatData } from '@utils/formatters';
import { AnimatedLoader } from '@components/Loader';
import { RoundedContainer, SafeAreaView, SearchContainer } from '@components/containers';
import { CategoryList } from '@components/Categories';
import { EmptyState } from '@components/common/empty';
import { useDataFetching, useDebouncedSearch } from '@hooks';
import styles from './styles';


const CategoriesScreen = ({ navigation }) => {

  const isFocused = useIsFocused();
  const { data, loading, fetchData, fetchMoreData } = useDataFetching(fetchCategories);
  const { searchText, handleSearchTextChange } = useDebouncedSearch((text) => fetchData({ searchText: text }));

  useFocusEffect(
    useCallback(() => {
      fetchData({ searchText });
    }, [searchText])
  );

  useEffect(() => {
    if (isFocused) {
      fetchData({ searchText });
    }
  }, [isFocused, searchText]);

  const handleLoadMore = () => {
    fetchMoreData({ searchText });
  };

  const renderItem = ({ item }) => {
    if (item.empty) {
      return <View style={[styles.itemStyle, styles.itemInvisible]} />;
    }
    return <CategoryList item={item} onPress={() => navigation.navigate('Products', { id: item._id })} />;
  };

  const renderEmptyState = () => (
    <EmptyState imageSource={require('@assets/images/EmptyData/empty_data.png')} message={''} /> //no items found 
  );

  const renderContent = () => (
    <FlashList
      data={formatData(data, 3)}
      numColumns={3}
      renderItem={renderItem}
      keyExtractor={(item, index) => index.toString()}
      contentContainerStyle={{ padding: 10, paddingBottom: 100 }}
      onEndReached={handleLoadMore}
      showsVerticalScrollIndicator={false}
      onEndReachedThreshold={0.2}
      ListFooterComponent={loading && <AnimatedLoader visible={loading} animationSource={require('@assets/animations/loading_up_down.json')} />}
    />
  );

  // Check if categories are empty and not loading to avoid brief display of empty state during initial load
  const renderCategories = () => {
    if (data.length === 0 && !loading) {
      return renderEmptyState();
    }
    return renderContent();
  };

  return (
    <SafeAreaView>
      <NavigationHeader title="Categories" onBackPress={() => navigation.goBack()} />
      <SearchContainer placeholder="Search Categories" onChangeText={handleSearchTextChange} />
      <RoundedContainer>
        {renderCategories()}
      </RoundedContainer>
    </SafeAreaView>
  );
};

export default CategoriesScreen;