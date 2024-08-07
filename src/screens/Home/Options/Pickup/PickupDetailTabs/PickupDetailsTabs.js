import * as React from 'react';
import { useWindowDimensions } from 'react-native';
import { TabView } from 'react-native-tab-view';
import { useState } from 'react';
import { SafeAreaView } from '@components/containers';
import { NavigationHeader } from '@components/Header';
import { CustomTabBar } from '@components/TabBar';
import Details from './Details';
import FollowUp from './FollowUp';

const PickupDetailTabs = ({ navigation, route }) => {

  const { id } = route?.params || {};
  const layout = useWindowDimensions();
  const [index, setIndex] = useState(0);
  const [routes] = useState([
    { key: 'first', title: 'Details' },
    { key: 'second', title: 'Follow Up' },
  ]);

  const renderScene = ({ route }) => {
    switch (route.key) {
      case 'first':
        return <Details pickupId={id} />;
      case 'second':
        return <FollowUp pickupId={id} />;
      default:
        return null;
    }
  };

  return (
    <SafeAreaView>
      <NavigationHeader
        title="Pickup Details"
        onBackPress={() => navigation.goBack()}
        logo={false}
        iconOneName='edit'
        iconOnePress={() => navigation.navigate('EditPickup', { pickupId: id })}
      />
      <TabView
        navigationState={{ index, routes }}
        renderScene={renderScene}
        renderTabBar={props => <CustomTabBar {...props} />}
        onIndexChange={setIndex}
        initialLayout={{ width: layout.width }}
      />
    </SafeAreaView>
  );
};

export default PickupDetailTabs;
