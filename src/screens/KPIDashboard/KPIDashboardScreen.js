import React, { useEffect, useState } from 'react';
import { View, StyleSheet, Dimensions, ScrollView, TouchableOpacity, Text, Platform } from 'react-native';
import { PieChart } from 'react-native-chart-kit';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NavigationHeader } from '@components/Header';
import { COLORS } from '@constants/theme';
import { RoundedScrollContainer } from '@components/containers';
import { useIsFocused } from '@react-navigation/native';
import { useAuthStore } from '@stores/auth';
import { useDataFetching } from '@hooks';
import { showToastMessage } from '@components/Toast';
import { fetchKPIDashboardData } from '@api/services/generalApi';

const KPIDashboardScreen = ({ navigation }) => {
    const screenWidth = Dimensions.get('window').width;
    const isFocused = useIsFocused();
    const currentUser = useAuthStore((state)=> state.user);
    const currentUserId = currentUser?.related_profile?._id || '';
    const [dashBoardDetails, setDashBoardDetails] = useState({
        assignedKpiData: [],
        importantKpiData: [],
        urgentKpiData: [],
        serviceKpiData: [],
        taskManagements: [],
        inProgressKpi: [],
        completedKpi: [],
    });

    const fetchKPIDetails = async () => {
        try {

            const data = await fetchKPIDashboardData({ userId: currentUserId });
            setDashBoardDetails({
                assignedKpiData: data.assigned_kpi_data || [],
                importantKpiData: data.important_kpi_data || [],
                urgentKpiData: data.urgent_kpi_data || [],
                serviceKpiData: data.service_kpi_data || [],
                taskManagements: data.task_managments || [],
                inProgressKpi: data.in_progress_kpi || [],
                completedKpi: data.completed_kpi || []
        });
        // console.log("Updated dashBoardDetails State:", {
        //     assigned_kpi_data: data.assigned_kpi_data || [],
        //     important_kpi_data: data.important_kpi_data || [],
        //     urgent_kpi_data: data.urgent_kpi_data || [],
        //     service_kpi_data: data.service_kpi_data || [],
        //     task_managments: data.task_managments || [],
        //     in_progress_kpi: data.in_progress_kpi || [],
        //     completedKpi: data.completed_kpi || []
        // });
        } catch(error){
            console.error('Error fetching visit details:', error);
            showToastMessage('Failed to fetch visit details');
        }
    }
    useEffect(() => {
        if (isFocused) {
            fetchKPIDetails();
        }
    }, [isFocused]);

    const chartConfig = {
        backgroundGradientFrom: '#1E2923',
        backgroundGradientFromOpacity: 0,
        backgroundGradientTo: '#08130D',
        backgroundGradientToOpacity: 0.5,
        color: (opacity = 1) => `rgba(26, 255, 146, ${opacity})`,
        strokeWidth: 2,
        barPercentage: 0.5,
        useShadowColorFromDataset: false,
    };

    const DotLegend = ({ color, label, value, onPress }) => (
        <TouchableOpacity onPress={() => onPress(label)}  style={styles.itemContainer}>
            <View style={[styles.legendDot, { backgroundColor: color }]} />
            <Text style={styles.legendLabel}>{`${label}: ${value}`}</Text>
        </TouchableOpacity>
    );

    const chartData = [
        { name: 'Assigned', value: dashBoardDetails.assignedKpiData.length || 0, color: '#FF6384' },
        { name: 'Urgent', value: dashBoardDetails.urgentKpiData.length || 0, color: '#d802db' },
        { name: 'Important', value: dashBoardDetails.importantKpiData.length || 0, color: '#36A2EB' },
        { name: 'Service', value: dashBoardDetails.serviceKpiData.length || 0, color: '#FFCE56' },
        { name: 'In Progress', value: dashBoardDetails.inProgressKpi.length || 0, color: '#bddb02' },
        { name: 'Completed', value: dashBoardDetails.completedKpi.length || 0, color: '#4BC0C0' },
    ];

    const PieSection = ({ data, title, count }) => (
        <View style={styles.chartContainer}>
            <Text style={styles.title}>{title}</Text>
            <View style={styles.divider} />
            <View style={styles.chartLegendContainer}>
                <PieChart
                    data={data}
                    width={screenWidth * 0.45} 
                    chartConfig={chartConfig}
                    accessor={'value'}
                    backgroundColor={'transparent'}
                    center={[35, -10]}  
                    height={175.24}
                    absolute
                    hasLegend={false}
                />
                <View style={styles.legendContainer}>
                    {data.map((item, index) => (
                        <DotLegend
                            key={index}
                            color={item.color}
                            label={item.name}
                            value={item.value}
                            onPress={(category) => navigation.navigate('KPIListingScreen', { kpiCategory: category })}
                        />
                    ))}
                </View>
            </View>
        </View>
    );
    
    

    return (
        <SafeAreaView style={styles.container}>
            <NavigationHeader title="KPI Dashboard" onBackPress={() => navigation.goBack()} />
            <RoundedScrollContainer contentContainerStyle={styles.scrollViewContent}>
                <PieSection data={chartData} title="Action Screens" count={chartData.length} />
            </RoundedScrollContainer>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    itemContainer: {
        marginHorizontal: 5,
        marginVertical: 5,
        backgroundColor: 'white',
        borderRadius: 15,
        padding: 15,
        ...Platform.select({
          android: {
            elevation: 4,
          },
          ios: {
            shadowColor: 'black',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.2,
          },
        }),
      },
    container: {
        flex: 1,
        backgroundColor: COLORS.themeapp,
    },
    scrollViewContent: {
        paddingVertical: 10, 
    },
    chartContainer: {
        margin: 20,
        borderRadius: 10,
        padding: 10,
        backgroundColor: '#FFFFFF',
    },
    chartLegendContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    title: {
        fontSize: 16,
        fontWeight: 'bold',
        color: COLORS.themeapp,
        textAlign: 'center',
        marginBottom: 10,
    },
    countText: {
        fontSize: 24,
        textAlign: 'center',
        marginBottom: 10,
    },
    divider: {
        borderWidth: 0.5,
        borderColor: '#E8E8E8',
        marginVertical: 10,
    },
    legendContainer: {
        flexDirection: 'column',
        justifyContent: 'center',
        paddingVertical: 10,
    },
    legendItem: {
        flexDirection: 'row',
        alignItems: 'center',
        marginVertical: 5,
    },
    legendDot: {
        width: 10,
        height: 10,
        borderRadius: 5,
        marginRight: 10,
    },
    legendLabel: {
        fontSize: 14,
        color: 'black',
        flexShrink: 1,
    },
});

export default KPIDashboardScreen;