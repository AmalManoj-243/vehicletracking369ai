import { TouchableOpacity, View } from 'react-native'
import React, { useCallback, useEffect, useState } from 'react'
import { RoundedContainer, SafeAreaView } from '@components/containers'
import { VerticalScrollableCalendar } from '@components/Calendar';
import { NavigationHeader } from '@components/Header';
import { RulesModal } from '@components/Modal';
import { FABButton, LoadingButton } from '@components/common/Button';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { useDataFetching } from '@hooks';
import { fetchVisitPlan } from '@api/services/generalApi';
import { FlashList } from '@shopify/flash-list';
import VisitPlanList from './VisitPlanList';
import { formatData } from '@utils/formatters';
import { EmptyState } from '@components/common/empty';
import AnimatedLoader from '@components/Loader/AnimatedLoader';
import { formatDate } from 'date-fns';

const VisitsPlanScreen = ({ navigation }) => {
    const isFocused = useNavigation()
    const [isVisible, setIsVisible] = useState(false)
    const [date, setDate] = useState(new Date());
    const formattedDate = formatDate(date, 'yyyy-MM-dd')    

    const { data, loading, fetchData, fetchMoreData } = useDataFetching(fetchVisitPlan);

    useFocusEffect(
        useCallback(() => {
            fetchData({date: formattedDate});
        }, [date])
    );

    useEffect(() => {
        if (isFocused) {
            fetchData({date: formattedDate});
        }
    }, [isFocused, date]);

    const handleLoadMore = () => {
        fetchMoreData({date: formattedDate});
    };

    const renderItem = ({ item }) => {
        if (item.empty) {
            return <EmptyItem />;
        }
        return <VisitPlanList item={item} onPress={() => navigation.navigate('VisitPlanDetails', { id: item._id })} />;
    };

    const renderEmptyState = () => (
        <EmptyState imageSource={require('@assets/images/EmptyData/empty.png')} message={'No Visits Plan Found....'} />
    );

    const renderContent = () => (
        <FlashList
            data={formatData(data, 1)}
            numColumns={1}
            renderItem={renderItem}
            keyExtractor={(item, index) => index.toString()}
            contentContainerStyle={{ padding: 10, paddingBottom: 50 }}
            onEndReached={handleLoadMore}
            showsVerticalScrollIndicator={false}
            onEndReachedThreshold={0.2}
            ListFooterComponent={
                loading && (
                    <AnimatedLoader
                        visible={loading}
                        animationSource={require('@assets/animations/loading.json')}
                    />
                )
            }
            estimatedItemSize={100}
        />
    );

    const renderVisitPlan = () => {
        if (data.length === 0 && !loading) {
            return renderEmptyState();
        }
        return renderContent();
    };

    return (
        <SafeAreaView>
            <NavigationHeader
                title="Visits Plan "
                logo={false}
                onBackPress={() => navigation.goBack()}
            // iconOneName='questioncircleo'
            // iconOnePress={() => setIsVisible(!isVisible)}
            />
            {/* <TouchableOpacity style={{padding:10, backgroundColor: 'white', alignSelf: 'flex-end'}}>

            </TouchableOpacity> */}
            <LoadingButton width={'30%'} height={40} alignSelf={'flex-end'} marginVertical={0} marginBottom={10} marginHorizontal={20} title={'Send Approval'}/>
            <RoundedContainer borderTopLeftRadius={20} borderTopRightRadius={20}>
                <View style={{ marginVertical: 15 }}>
                    <VerticalScrollableCalendar date={date} onChange={(newDate) => setDate(newDate)} />
                </View>
                {renderVisitPlan()}
            </RoundedContainer>
            <FABButton onPress={() => navigation.navigate('VisitPlanForm')} />
            <RulesModal isVisible={isVisible} onClose={() => setIsVisible(!isVisible)} />

        </SafeAreaView>
    )
}

export default VisitsPlanScreen