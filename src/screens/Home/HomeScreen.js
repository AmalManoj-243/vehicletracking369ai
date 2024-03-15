import React, { useMemo, useState, useEffect } from 'react';
import { View, Dimensions, StyleSheet, ActivityIndicator } from 'react-native';
import { CarouselPagination, ImageContainer, ListHeader, Header, NavigationBar } from '@components/Home';
import BottomSheet, { BottomSheetFlatList } from "@gorhom/bottom-sheet";
import { fetchProducts } from '@api/services/generalApi';
import { ProductsList } from '@components/Product';
import { RoundedContainer, SafeAreaView } from '@components/containers';
import { formatData } from '@utils/formatters';

const { height } = Dimensions.get('window');

const HomeScreen = ({ navigation }) => {

  const [products, setProducts] = useState([]);
  const [offset, setOffset] = useState(0);
  const [loading, setLoading] = useState(false);
  const [allDataLoaded, setAllDataLoaded] = useState(false);

  useEffect(() => {
    fetchInitialProducts();
  }, []);

  const fetchInitialProducts = async () => {
    setLoading(true);
    try {
      const fetchedProducts = await fetchProducts({ offset: 0, limit: 20 });
      setProducts(fetchedProducts);
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchMoreProducts = async () => {
    if (loading || allDataLoaded) return;

    setLoading(true);
    try {
      const fetchedProducts = await fetchProducts({ offset, limit: 20 });
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

  const renderItem = ({ item }) => {
    if (item.empty) {
      return <View style={[styles.itemStyle, styles.itemInvisible]} />
    }
    return (
      <ProductsList item={item} showPrice={true} onPress={() => console.log('Product selected:', item)} />
    )
  }

  const navigateToScreen = (screenName) => {
    navigation.navigate(screenName);
  };

  // Define different snap points based on screen height
  const snapPoints = useMemo(() => {
    return height < 800 ? ["45%", "83%"] : ["50%", "85%"];
  }, [height]);


  return (
    <SafeAreaView>
      {/* rounded border */}
      <RoundedContainer>
      {/* Header */}
      <Header />
      {/* Navigation Header */}
      <NavigationBar
        onSearchPress={() => navigation.navigate('')}
        onOptionsPress={() => navigation.navigate('OptionsScreen')}
        onScannerPress={() => navigation.navigate('')}
      />
      {/* Carousel */}
      <CarouselPagination />

      {/* Section */}
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginHorizontal: 8 }}>
        <ImageContainer source={require('@assets/images/Home/section/pickup.png')} onPress={() => navigateToScreen('Pickup')} backgroundColor="#f37021" title="Pickup" />
        <ImageContainer source={require('@assets/images/Home/section/services.png')} onPress={() => navigateToScreen('Services')} backgroundColor="#f37021" title="Services" />
        <ImageContainer source={require('@assets/images/Home/section/customer.png')} onPress={() => navigateToScreen('Customer')} backgroundColor="#f37021" title="Customer" />
      </View>

      {/* Bottom sheet */}
      <BottomSheet snapPoints={snapPoints}>
        {/* Product list header */}
        <ListHeader title="Products" />
        {/* flatlist */}
        <BottomSheetFlatList
          data={formatData(products, 3)}
          numColumns={3}
          renderItem={renderItem}
          keyExtractor={(item, index) => index.toString()}
          contentContainerStyle={{ paddingBottom: '25%' }}
          onEndReached={fetchMoreProducts}
          showsVerticalScrollIndicator={false}
          onEndReachedThreshold={0.1}
          ListFooterComponent={loading && <ActivityIndicator size="large" color="#0000ff" />}
        />
      </BottomSheet>
      </RoundedContainer>
    </SafeAreaView>
  );
}



const styles = StyleSheet.create({
  itemInvisible: {
    backgroundColor: 'transparent',
  },
  itemStyle: {
    flex: 1,
    alignItems: 'center',
    margin: 6,
    borderRadius: 8,
    marginTop: 5,
    backgroundColor: "white",
  },
});

export default HomeScreen;
