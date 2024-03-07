import React from 'react'
import { FlatList, View,} from 'react-native'
import NavigationHeader from '@components/Header/NavigationHeader'
import { RoundedContainer, SafeAreaView } from '@components/containers'
import { TouchableOpacity, Image, StyleSheet } from 'react-native';
import { COLORS, FONT_FAMILY } from '@constants/theme';
import Text from '@components/Text';
const OptionsScreen = ({ navigation }) => {


const ListItem = ({ title, image, onPress }) => {
  return (
    <TouchableOpacity style={styles.container} onPress={onPress}>
      <Image source={image} style={styles.image} />
      <Text style={styles.title}>{title}</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    borderColor:'#ececec',
    borderWidth:1,
    height: 150,
    borderRadius: 5,
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor:'#ececec',
    margin:3,
  },
  image: {
    width: 50,
    height: 50,
    marginRight: 12,
    marginBottom:15
    // tintColor:'white'
  },
  title: {
    fontSize: 16,
    fontFamily:FONT_FAMILY.urbanistSemiBold,
    color: '#909090',
    // width:'80%',
    alignSelf:'center'
    // fontWeigheedfd5t: 'bold',
  },
});

  const options =
    [
      { title: 'Search Products', image: require('@assets/images/Home/options/search_product.png'), onPress: () => navigation.navigate('Products') },
      { title: 'Scan Barcode', image: require('@assets/images/Home/options/scan_barcode.png'), onPress: () => navigation.navigate('ScanBarcode') },
      { title: 'Product Enquiry', image: require('@assets/images/Home/options/product_enquiry.png'), onPress: () => navigation.navigate('') },
      { title: 'Product Purchase Requisition', image: require('@assets/images/Home/options/product_purchase_requisition.png'), onPress: () => navigation.navigate('') },
      { title: 'Transaction Auditing', image: require('@assets/images/Home/options/search_product.png'), onPress: () => navigation.navigate('') },
      { title: 'Task Manager', image: require('@assets/images/Home/options/task_manager.png'), onPress: () => navigation.navigate('') },
      { title: 'Market Study', image: require('@assets/images/Home/options/market_study.png'), onPress: () => navigation.navigate('') },
      { title: 'Attendance', image: require('@assets/images/Home/options/attendance.png'), onPress: () => navigation.navigate('') }
    ]

  return (
    <SafeAreaView>
      <NavigationHeader
        title="Options"
        onBackPress={() => navigation.goBack()}
      />
      <RoundedContainer>
      <FlatList
          data={options}
          contentContainerStyle={{margin:15}}
          renderItem={({ item }) => (
           <ListItem title={item.title} image={item.image} onPress={item.onPress} />
          )}
          numColumns={2}
          keyExtractor={(item, index) => index.toString()}
        />

      </RoundedContainer>
    </SafeAreaView>
  )
}

export default OptionsScreen