import React, { useState, useEffect, useCallback } from 'react';
import { View } from 'react-native';
import { NavigationHeader } from '@components/Header';
import { fetchCategories } from '@api/services/generalApi';
import { useIsFocused, useFocusEffect } from '@react-navigation/native';
import { FlashList } from '@shopify/flash-list';
import { formatData } from '@utils/formatters';
import {AnimatedLoader } from '@components/Loader';
import { RoundedContainer, SafeAreaView, SearchContainer } from '@components/containers';
import { debounce } from 'lodash';
import styles from './styles';
import { CategoryList } from '@components/Categories';
import { EmptyState } from '@components/common/empty';
const CategoriesScreen = ({ navigation }) => {

  const [categories, setCategories] = useState([]);
  const [offset, setOffset] = useState(0);
  const [searchText, setSearchText] = useState('');
  const [loading, setLoading] = useState(false);
  const [allDataLoaded, setAllDataLoaded] = useState(false);
  const isFocused = useIsFocused();

  useFocusEffect(
    useCallback(() => {
      setOffset(0);
      setCategories([]);
      fetchInitialCategories();
    }, [searchText])
  );

  useEffect(() => {
    if (isFocused) {
      fetchInitialCategories();
    }
  }, [isFocused]);

  const fetchInitialCategories = useCallback(async () => {
    console.log('Fetch initial categories');
    setLoading(true);
    try {
      const fetchedCategories = await fetchCategories({ offset: 0, limit: 20, searchText });
      setCategories(fetchedCategories);
    } catch (error) {
      console.error('Error fetching categories:', error);
    } finally {
      setLoading(false);
    }
  }, [searchText]);

  const fetchAdditionalCategories = async () => {
    console.log('Fetch more categories');
    if (loading || allDataLoaded) return;
    setLoading(true);
    try {
      const fetchedCategories = await fetchCategories({ offset, limit: 20, searchText });
      if (fetchedCategories.length === 0) {
        setAllDataLoaded(true);
      } else {
        setCategories([...categories, ...fetchedCategories]);
        setOffset(offset + 1);
      }
    } catch (error) {
      console.error('Error fetching more categories:', error);
    } finally {
      setLoading(false);
    }
  };

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
      return <View style={[styles.itemStyle, styles.itemInvisible]} />;
    }
    return <CategoryList item={item} onPress={() => navigation.navigate('Products', { id: item._id })} />;
  };

  const renderEmptyState = () => (
    <EmptyState imageSource={require('@assets/images/EmptyData/empty_data.png')} message={''} /> //no items found 
  );

  const renderContent = () => (
    <FlashList
      data={formatData(categories, 3)}
      numColumns={3}
      renderItem={renderItem}
      keyExtractor={(item, index) => index.toString()}
      contentContainerStyle={{ padding: 10, paddingBottom: 100 }}
      onEndReached={fetchAdditionalCategories}
      showsVerticalScrollIndicator={false}
      onEndReachedThreshold={0.2}
      ListFooterComponent={loading && <AnimatedLoader visible={loading} animationSource={require('@assets/animations/loading_up_down.json')} />}
    />
  );

  // Check if categories are empty and not loading to avoid brief display of empty state during initial load
  const renderCategories = () => {
    if (categories.length === 0 && !loading) {
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