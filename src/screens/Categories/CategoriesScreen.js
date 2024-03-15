import React, { useState, useEffect, useCallback } from 'react';
import { View } from 'react-native';
import { NavigationHeader } from '@components/Header';
import { ProductsList } from '@components/Product';
import { fetchProducts } from '@api/services/generalApi';
import { useIsFocused, useFocusEffect } from '@react-navigation/native';
import { FlashList } from '@shopify/flash-list';
import { formatData } from '@utils/formatters';
import { Loader } from '@components/Loader';
import { RoundedContainer, SafeAreaView, SearchContainer } from '@components/containers';
import { debounce } from 'lodash';
import styles from './styles';

const CategoriesScreen = ({ navigation }) => {
  const [products, setProducts] = useState([]);
  const [offset, setOffset] = useState(0);
  const [searchText, setSearchText] = useState('');
  const [loading, setLoading] = useState(false);
  const [allDataLoaded, setAllDataLoaded] = useState(false);
  const isFocused = useIsFocused();

  useFocusEffect(
    useCallback(() => {
      setOffset(0);
      setProducts([]);
      fetchInitialProducts();
    }, [searchText])
  );

  useEffect(() => {
    if (isFocused) {
      fetchInitialProducts();
    }
  }, [isFocused]);

  const fetchInitialProducts = useCallback(async () => {
    console.log('Fetch initial products');
    setLoading(true);
    try {
      const fetchedProducts = await fetchProducts({ offset: 0, limit: 20, searchText });
      setProducts(fetchedProducts);
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setLoading(false);
    }
  }, [searchText]);

  const fetchMoreProducts = async () => {
    console.log('Fetch more products');
    if (loading || allDataLoaded) return;
    setLoading(true);
    try {
      const fetchedProducts = await fetchProducts({ offset, limit: 20, searchText });
      if (fetchedProducts.length === 0) {
        setAllDataLoaded(true);
      } else {
        setProducts([...products, ...fetchedProducts]);
        setOffset(offset + 1);
      }
    } catch (error) {
      console.error('Error fetching more products:', error);
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
    return <ProductsList item={item} onPress={() => console.log('Product selected:', item)} />;
  };

  return (
    <SafeAreaView>
      <NavigationHeader title="Products" onBackPress={() => navigation.goBack()} />
      <SearchContainer placeholder="Search Products" onChangeText={handleSearchTextChange} />
      <RoundedContainer>
        <FlashList
          data={formatData(products, 3)}
          numColumns={3}
          renderItem={renderItem}
          keyExtractor={(item, index) => index.toString()}
          contentContainerStyle={{ padding: 10, paddingBottom: 50 }}
          onEndReached={fetchMoreProducts}
          showsVerticalScrollIndicator={false}
          onEndReachedThreshold={0.2}
          ListFooterComponent={loading && <Loader visible={loading} animationSource={require('@assets/animations/loading.json')} />}
        />
      </RoundedContainer>
    </SafeAreaView>
  );
};

export default CategoriesScreen;