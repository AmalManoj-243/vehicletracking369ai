import * as React from 'react';
import { useWindowDimensions, KeyboardAvoidingView, Platform, Keyboard, View } from 'react-native';
import { TabView, TabBar } from 'react-native-tab-view';
import { useState } from 'react';
import Details from './Details';
import FollowUp from './FollowUp';
import { SafeAreaView } from '@components/containers';
import { NavigationHeader } from '@components/Header';
import { COLORS, FONT_FAMILY } from '@constants/theme';

const CustomTabBar = (props) => {
  return (
    <TabBar
      // scrollEnabled={true}
      {...props}
      style={{
        backgroundColor: COLORS.tabColor,
        justifyContent: 'center',
      }}
      indicatorStyle={{ backgroundColor: COLORS.tabIndicator, height: 3 }}
      labelStyle={{ color: COLORS.white, fontFamily: FONT_FAMILY.urbanistBold, fontSize: 13, textTransform: 'capitalize' }}
      pressColor='#2e294e'
      pressOpacity={0.5}
    />
  );
};

const EnquiryDetailTabs = ({ navigation, route }) => {

  const  { id } = route?.params || {};
  const layout = useWindowDimensions();

  const renderScene = ({ route }) => {
    switch (route.key) {
      case 'first':
        return <Details enquiryId={id} />;
      case 'second':
        return <FollowUp enquiryId={id} />;
      default:
        return null;
    }
  };

  const [index, setIndex] = useState(0);
  const [routes] = useState([
    { key: 'first', title: 'Details' },
    { key: 'second', title: 'Follow Up' },
  ]);

  return (
    <SafeAreaView>
      <NavigationHeader
        title="Enquiry Register Details"
        onBackPress={() => navigation.goBack()}
      />
        <TabView
          navigationState={{ index, routes }}
          renderScene={renderScene}
          renderTabBar={CustomTabBar}
          onIndexChange={setIndex}
          initialLayout={{ width: layout.width }}
        />
    </SafeAreaView>
  );
};

export default EnquiryDetailTabs;
