import React, { useEffect, useState } from 'react';
import { View, StyleSheet, Dimensions, Text, Platform } from 'react-native';
import { PieChart } from 'react-native-svg-charts';
import { NavigationHeader } from '@components/Header';
import { COLORS, FONT_FAMILY } from '@constants/theme';
import { RoundedScrollContainer, SafeAreaView } from '@components/containers';
import { useIsFocused } from '@react-navigation/native';
import { useAuthStore } from '@stores/auth';
import { showToastMessage } from '@components/Toast';
import { fetchKPIDashboard } from '@api/services/generalApi';

const KPIDashboardScreen = ({ navigation }) => {
    const screenWidth = Dimensions.get('window').width;
    const isFocused = useIsFocused();
    const currentUser = useAuthStore((state) => state.user);
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
            const data = await fetchKPIDashboard({ userId: currentUserId });
            setDashBoardDetails({
                assignedKpiData: data.assigned_kpi_data || [],
                importantKpiData: data.important_kpi_data || [],
                urgentKpiData: data.urgent_kpi_data || [],
                serviceKpiData: data.service_kpi_data || [],
                taskManagements: data.task_managments || [],
                inProgressKpi: data.in_progress_kpi || [],
                completedKpi: data.completed_kpi || []
            });
        } catch (error) {
            console.error('Error fetching visit details:', error);
            showToastMessage('Failed to fetch visit details');
        }
    };

    useEffect(() => {
        if (isFocused) {
            fetchKPIDetails();
        }
    }, [isFocused]);


    // const chartData = [
    //     { name: 'Assigned', value: dashBoardDetails.assignedKpiData.length || 0, color: '#FF6384' },
    //     { name: 'Urgent', value: dashBoardDetails.urgentKpiData.length || 0, color: '#d802db' },
    //     { name: 'Important', value: dashBoardDetails.importantKpiData.length || 0, color: '#36A2EB' },
    //     { name: 'Regular Task', value: dashBoardDetails.serviceKpiData.length || 0, color: '#FFCE56' },
    //     { name: 'In Progress', value: dashBoardDetails.inProgressKpi.length || 0, color: '#4BB543' },
    //     { name: 'Complete', value: dashBoardDetails.completedKpi.length || 0, color: '#4BC0C0' },
    // ];


    const randomColor = () => (
        '#' + ((Math.random() * 0xffffff) << 0).toString(16) + '000000'
    ).slice(0, 7);

    // Define fixed colors for each KPI category
    const colorMapping = {
        'Assigned': '#d802db',
        'Urgent': '#FFDE43',
        'Important': '#36A2EB',
        'Regular Task': '#4BB543',
        'In Progress': '#FF6384',
        'Complete': '#4BC0C0',
    };

    const pieData = [
        { name: 'Assigned', value: dashBoardDetails.assignedKpiData.length || 0 },
        { name: 'Urgent', value: dashBoardDetails.urgentKpiData.length || 0 },
        { name: 'Important', value: dashBoardDetails.importantKpiData.length || 0 },
        { name: 'Regular Task', value: dashBoardDetails.serviceKpiData.length || 0 },
        { name: 'In Progress', value: dashBoardDetails.inProgressKpi.length || 0 },
        { name: 'Complete', value: dashBoardDetails.completedKpi.length || 0 },
    ]
        .map((item, index) => ({
            name: item.name, // Name to be used in the legend
            value: item.value,
            svg: {
                fill: colorMapping[item.name], // Use color mapping based on the name
                onPress: () => navigation.navigate('KPIListingScreen', { kpiCategory: item.name }),
            },
            key: `pie-${index}`,
        }));

    // const PieSection = ({ data, title }) => (
    //     <View style={styles.chartContainer}>
    //         <Text style={styles.title}>{title}</Text>
    //         <View style={styles.divider} />
    //         <View style={styles.chartLegendContainer}>
    //             <PieChart
    //                 data={data}
    //                 width={screenWidth * 0.45}
    //                 chartConfig={chartConfig}
    //                 accessor={'value'}
    //                 backgroundColor={'transparent'}
    //                 center={[35, -10]}
    //                 height={175.24}
    //                 absolute
    //                 hasLegend={false}
    //                 onPress={(index) => handlePieChartPress(index)}
    //             />
    //             <View style={styles.legendContainer}>
    //                 {data.map((item, index) => (
    //                     <TouchableOpacity key={index} onPress={() => handlePieChartPress(index)} style={styles.itemContainer}>
    //                         <View style={[styles.legendDot, { backgroundColor: item.color }]} />
    //                         <Text style={styles.legendLabel}>{`${item.name}: ${item.value}`}</Text>
    //                     </TouchableOpacity>
    //                 ))}
    //             </View>
    //         </View>
    //     </View>
    // );

    const PieSection = ({ data, title }) => (
        <View style={styles.chartContainer}>
            <Text style={styles.title}>{title}</Text>
            <View style={styles.divider} />
            <View style={styles.chartLegendContainer}>
                <View style={styles.chartWrapper}>
                    <PieChart
                        style={styles.pieChart}
                        data={data}
                        padAngle={0}

                    />
                </View>
                <View style={styles.legendContainer}>
                    {pieData.map((item, index) => (
                        <View key={index} style={styles.legendItem}>
                            <View style={[styles.legendDot, { backgroundColor: item.svg.fill }]} />
                            <Text style={styles.legendLabel}>{`${item.name}: ${item.value}`}</Text>
                            {/* <Text style={styles.legendLabel}>{`${item.value}`}</Text> */}
                        </View>
                    ))}
                </View>
            </View>
        </View>
    );

    return (
        <SafeAreaView>
            <NavigationHeader title="KPI Dashboard" onBackPress={() => navigation.goBack()} />
            <RoundedScrollContainer>
                <PieSection data={pieData} title="Action Screens" />
            </RoundedScrollContainer>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    chartContainer: {
        // margin: 20,
        // borderRadius: 10,
        // padding: 10,
        // backgroundColor: '#FFFFFF',
        // shadowColor: '#000',
        // shadowOffset: { width: 0, height: 4 },
        // shadowOpacity: 0.1,
        // shadowRadius: 8,
        // elevation: 3,
    },
    chartLegendContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    chartWrapper: {
        flex: 1,
    },
    pieChart: {
        height: 200,
        width: '100%',
    },
    title: {
        fontSize: 16,
        color: COLORS.themeapp,
        textAlign: 'center',
        fontFamily: FONT_FAMILY.urbanistBlack,
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
        // backgroundColor: 'red'
    },
    legendItem: {
        flexDirection: 'row',
        alignItems: 'center',
        marginVertical: 8,
        backgroundColor: 'white',
        borderRadius: 8,
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
    legendDot: {
        width: 10,
        height: 10,
        borderRadius: 5,
        marginRight: 10,
        marginLeft: 10,
    },
    legendLabel: {
        fontSize: 14,
        color: 'black',
        flexShrink: 1,
        fontFamily: FONT_FAMILY.urbanistBold
    },
});

export default KPIDashboardScreen;
