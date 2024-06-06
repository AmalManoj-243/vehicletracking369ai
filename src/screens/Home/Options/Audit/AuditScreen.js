import React, { useState, useEffect, useCallback } from 'react';
import { useIsFocused, useFocusEffect } from '@react-navigation/native';
import { FlashList } from '@shopify/flash-list';
import { formatData } from '@utils/formatters';
import { AnimatedLoader } from '@components/Loader';
import { RoundedContainer, SafeAreaView } from '@components/containers';
import { debounce } from 'lodash';
import { EmptyItem, EmptyState } from '@components/common/empty';
import { NavigationHeader } from '@components/Header';
import { FABButton } from '@components/common/Button';
import { fetchAuditing } from '@api/services/generalApi';
import AuditList from './AuditList';

const AuditScreen = ({ navigation }) => {

    const [responseData, setResponseData] = useState([]);
    const [offset, setOffset] = useState(0);
    const [searchText, setSearchText] = useState('');
    const [loading, setLoading] = useState(false);
    const [allDataLoaded, setAllDataLoaded] = useState(false);

    const isFocused = useIsFocused();

    useFocusEffect(
        useCallback(() => {
            setOffset(0);
            setResponseData([]);
            fetchInitialResponse();
        }, [searchText])
    );

    useEffect(() => {
        if (isFocused) {
            fetchInitialResponse();
        }
    }, [isFocused]);

    const fetchInitialResponse = useCallback(async () => {
        console.log('Fetch initial responseData');
        setLoading(true);
        try {
            const params = { offset: 0, limit: 20 };
            const fetchedAuditing = await fetchAuditing(params);
            setResponseData(fetchedAuditing);
        } catch (error) {
            console.error('Error fetching responseData:', error);
        } finally {
            setLoading(false);
        }
    }, [searchText]);

    const fetchMoreResponse = async () => {
        console.log('Fetch more responseData');
        if (loading || allDataLoaded) return;
        setLoading(true);
        try {
            const params = { offset: offset + 1, limit: 20 };
            const fetchedAuditing = await fetchAuditing(params);
            if (fetchedAuditing.length === 0) {
                setAllDataLoaded(true);
            } else {
                setResponseData([...responseData, ...fetchedAuditing]);
                setOffset(offset + 1);
            }
        } catch (error) {
            console.error('Error fetching more responseData:', error);
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
            return <EmptyItem />;
        }
        return (
            <AuditList item={item} />
        );
    };

    const renderEmptyState = () => (
        <EmptyState imageSource={require('@assets/images/EmptyData/transaction_empty.png')} message={''} />
    );

    const renderContent = () => (
        <FlashList
            data={formatData(responseData, 1)}
            numColumns={1}
            renderItem={renderItem}
            keyExtractor={(item, index) => index.toString()}
            contentContainerStyle={{ padding: 10, paddingBottom: 50 }}
            onEndReached={fetchMoreResponse}
            showsVerticalScrollIndicator={false}
            onEndReachedThreshold={0.2}
            ListFooterComponent={loading && <AnimatedLoader visible={loading} animationSource={require('@assets/animations/loading.json')} />}
            estimatedItemSize={100}
        />
    );

    const renderAuditing = () => {
        if (responseData.length === 0 && !loading) {
            return renderEmptyState();
        }
        return renderContent();
    };


    return (
        <SafeAreaView>
            <NavigationHeader
                title="Transaction Auditing"
                onBackPress={() => navigation.goBack()}
            />
            <RoundedContainer>
                {renderAuditing()}
                <FABButton onPress={() => navigation.navigate('AuditForm')} />
            </RoundedContainer>
        </SafeAreaView>
    )
}

export default AuditScreen