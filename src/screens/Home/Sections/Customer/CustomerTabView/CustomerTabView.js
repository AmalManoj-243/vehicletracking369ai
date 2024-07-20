import * as React from 'react';
import { View, useWindowDimensions } from 'react-native';
import { TabView, SceneMap, TabBar } from 'react-native-tab-view';
import { useState } from 'react';
import Details from './Details';
import OtherDetails from './OtherDetails';
import Address from './Address';
import ContactPerson from './ContactPerson';
import { RoundedContainer, RoundedScrollContainer, SafeAreaView } from '@components/containers';
import { NavigationHeader } from '@components/Header';
import { COLORS, FONT_FAMILY } from '@constants/theme';

const CustomTabBar = (props) => {
  return (
    <TabBar
      scrollEnabled={true}
      {...props}
      style={{
        backgroundColor: COLORS.orange,
        justifyContent: 'center',
      }}
      indicatorStyle={{ backgroundColor: COLORS.primaryThemeColor, height: 3 }}
      labelStyle={{ color: COLORS.white, fontFamily: FONT_FAMILY.urbanistBold, fontSize: 13, textTransform: 'capitalize' }}
      pressColor='#2e294e'
      pressOpacity={0.5}
    />
  );
};

const CustomerTabView = ({ navigation }) => {
  const layout = useWindowDimensions();

  const [formData, setFormData] = useState({
    address: "",
    country: "",
    state: "",
    area: "",
    poBox: "",
    customerTypes: "",
    customerName: "",
    customerTitles: "",
    emailAddress: "",
    salesPerson: "",
    collectionAgent: "",
    mop: "",
    mobileNumber: "",
    whatsappNumber: "",
    landlineNumber: "",
    fax: "",
    trn: "",
    customerBehaviour: "",
    customerAttitude: "",
    language: "",
    currency: "",
  });

  const renderScene = SceneMap({
    first: () => <Details formData={formData} setFormData={setFormData} />,
    second: () => <OtherDetails formData={formData} setFormData={setFormData} />,
    third: () => <Address formData={formData} setFormData={setFormData} />,
    fourth: () => <ContactPerson formData={formData} setFormData={setFormData} />,
  });

  const [index, setIndex] = useState(0);
  const [routes] = useState([
    { key: 'first', title: 'Details' },
    { key: 'second', title: 'Other Details' },
    { key: 'third', title: 'Address' },
    { key: 'fourth', title: 'Contact Person' },
  ]);

  return (
    <SafeAreaView>
      <NavigationHeader
        title="Add Customer"
        onBackPress={() => navigation.goBack()}
      />
      <TabView
        renderTabBar={CustomTabBar}
        navigationState={{ index, routes }}
        renderScene={renderScene}
        onIndexChange={setIndex}
        initialLayout={{ width: layout.width }}
      />
    </SafeAreaView>
  );
};

export default CustomerTabView;
