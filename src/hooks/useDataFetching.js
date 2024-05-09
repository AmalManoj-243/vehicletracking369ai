import { useState, useCallback } from 'react';

const useDataFetching = (fetchDataCallback) => {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [allDataLoaded, setAllDataLoaded] = useState(false);
    const [offset, setOffset] = useState(0);

    const fetchData = useCallback(async (search) => {
        setLoading(true);
        try {
            const params = { offset: 0, limit: 20, search };
            const fetchedData = await fetchDataCallback(params);
            setData(fetchedData);
        } catch (error) {
            console.error('Error fetching data:', error);
        } finally {
            setLoading(false);
        }
    }, [fetchDataCallback]);

    const fetchMoreData = async (search) => {
        if (loading || allDataLoaded) return;
        setLoading(true);
        try {
            const params = { offset: offset + 1, limit: 20, search };
            const fetchedData = await fetchDataCallback(params);
            if (fetchedData.length === 0) {
                setAllDataLoaded(true);
            } else {
                setData(prevData => [...prevData, ...fetchedData]);
                setOffset(prevOffset => prevOffset + 1);
            }
        } catch (error) {
            console.error('Error fetching more data:', error);
        } finally {
            setLoading(false);
        }
    };

    return { data, loading, fetchData, fetchMoreData };
};

export default useDataFetching;
