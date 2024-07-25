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

const EnquiryDetailTabs = ({ navigation }) => {
  const layout = useWindowDimensions();
  const [formData, setFormData] = useState({
    dateTime: new Date(),
    source: '',
    name: '',
    companyName: '',
    phoneNumber: '',
    emailAddress: '',
    address: '',
    enquiryDetails: '',
  });

  const [errors, setErrors] = useState({});

  const handleFieldChange = (field, value) => {
    setFormData((prevFormData) => ({
      ...prevFormData,
      [field]: value,
    }));
    if (errors[field]) {
      setErrors((prevErrors) => ({
        ...prevErrors,
        [field]: null,
      }));
    }
  };

  const renderScene = ({ route }) => {
    switch (route.key) {
      case 'first':
        return <Details formData={formData} onFieldChange={handleFieldChange} errors={errors} />;
      case 'second':
        return <FollowUp formData={formData} onFieldChange={handleFieldChange} errors={errors} />;
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
