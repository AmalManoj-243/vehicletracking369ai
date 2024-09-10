// src/navigation/StackNavigator.js

import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import AppNavigator from "./AppNavigator";
import { ProductsScreen, SplashScreen } from "@screens";
import { OptionsScreen } from "@screens/Home/Options";
import { TaskManagerScreen } from "@screens/Home/Options/TaskManager";
import { AuditForm, AuditScreen } from "@screens/Home/Options/Audit";
import { LoginScreen, PrivacyPolicy } from "@screens/Auth";
import { Barcode, Scanner } from "@components/Scanner";
import { InventoryDetails, InventoryForm, InventoryScreen } from "@screens/Home/Options/Inventory";
import { ProductDetail } from "@components/common/Detail";
import { CustomerDetails, CustomerScreen } from "@screens/Home/Sections/Customer";
import { MarketStudyScreen } from "@screens/Home/Options/MarketStudy";
import { EditVisitPlan, VisitPlanForm, VisitsPlanScreen, VisitPlanDetails } from "@screens/Home/Options/VisitsPlan";
import { EditVisit, VisitDetails, VisitForm, VisitScreen } from "@screens/Home/Options/Visits"; //customer visit
import { MapViewScreen } from "@components/MapViewScreen";
import { CRMScreen } from "@screens/Home/Options/CRM";
import { EnquiryRegisterForm, EnquiryRegisterScreen } from "@screens/Home/Options/CRM/EnquiryRegister";
import { CustomerFormTabs } from "@screens/Home/Sections/Customer/CustomerFormTabs";
import { EditLead, LeadForm, LeadScreen } from "@screens/Home/Options/CRM/Leads";
import { EnquiryDetailTabs } from "@screens/Home/Options/CRM/EnquiryRegister/EnquiryDetailTabs";
import { LeadDetailTabs } from "@screens/Home/Options/CRM/Leads/LeadDetailTabs";
import { EditPipeline, PipelineForm, PipelineScreen } from "@screens/Home/Options/CRM/Pipeline";
import { PipelineDetailTabs } from "@screens/Home/Options/CRM/Pipeline/PipelineDetailTabs";
import { PickupScreen } from "@screens/Home/Options/Pickup";
import { BoxInspectionForm, BoxInspectionScreen } from "@screens/Home/Options/BoxInspection";
import { AttendanceScreen } from "@screens/Home/Options/Attendance";
import { MarkAttendance, PunchingScreen } from "@screens/Home/Options/Attendance/Punching";
import QuickServiceFormTabs from "@screens/Home/Sections/Services/QuickService/QuickServiceFormTabs/QuickServiceFormTabs";
import QuickServiceScreen from "@screens/Home/Sections/Services/QuickService/QuickServiceScreen";
import { ServiceScreen } from "@screens/Home/Sections/Services";
import { SparePartsRequestScreen } from "@screens/Home/Sections/Services/SparePartsRequest";
import { AddSpareParts, ServiceDetails, UpdateDetails } from "@screens/Home/Sections/Services/QuickService";
import { KPIListingScreen } from "@screens/KPIDashboard";
import SparePartsRequestDetails from "@screens/Home/Sections/Services/SparePartsRequest/SparePartsRequestDetails";
import SparePartsIssueCreation from "@screens/Home/Sections/Services/SparePartsRequest/SparePartsIssueCreation";

const Stack = createNativeStackNavigator();

const StackNavigator = () => {
  return (
    <Stack.Navigator initialRouteName="Splash">
      {/* Splash Screen */}
      <Stack.Screen
        name="Splash"
        component={SplashScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="Scanner"
        component={Scanner}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="Barcode"
        component={Barcode}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="MapViewScreen"
        component={MapViewScreen}
        options={{ headerShown: false }}
      />
      {/* Login Screen */}
      <Stack.Screen
        name="LoginScreen"
        component={LoginScreen}
        options={{ headerShown: false }}
      />

      <Stack.Screen
        name="PrivacyPolicy"
        component={PrivacyPolicy}
        options={{ headerShown: false }}
      />
      {/* App Navigator - Bottom Tabs */}
      <Stack.Screen
        name="AppNavigator"
        component={AppNavigator}
        options={{ headerShown: false }}
      />
      {/* Options Screen */}
      <Stack.Screen
        name="OptionsScreen"
        component={OptionsScreen}
        options={{ headerShown: false }}
      />
      {/* Audit Screen */}
      <Stack.Screen
        name="AuditScreen"
        component={AuditScreen}
        options={{ headerShown: false }}
      />
      {/* Audit Form */}
      <Stack.Screen
        name="AuditForm"
        component={AuditForm}
        options={{ headerShown: false }}
      />

      {/* Inventory Screen */}
      <Stack.Screen
        name="InventoryScreen"
        component={InventoryScreen}
        options={{ headerShown: false }}
      />
      {/* Inventory Details */}
      <Stack.Screen
        name="InventoryDetails"
        component={InventoryDetails}
        options={{ headerShown: false }}
      />
      {/* Inventory Form */}
      <Stack.Screen
        name="InventoryForm"
        component={InventoryForm}
        options={{ headerShown: false }}
      />

      <Stack.Screen
        name="TaskManagerScreen"
        component={TaskManagerScreen}
        options={{ headerShown: false }}
      />
      {/* Products */}
      <Stack.Screen
        name="Products"
        component={ProductsScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="ProductDetail"
        component={ProductDetail}
        options={{ headerShown: false }}
      />
      {/* Customers */}
      <Stack.Screen
        name="CustomerScreen"
        component={CustomerScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="CustomerDetails"
        component={CustomerDetails}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="CustomerFormTabs"
        component={CustomerFormTabs}
        options={{ headerShown: false }}
      />

      {/* Services */}
      <Stack.Screen
        name="ServiceScreen"
        component={ServiceScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="QuickServiceScreen"
        component={QuickServiceScreen}
        options={{ headerShown: false }}
      />

      <Stack.Screen
        name="QuickServiceFormTabs"
        component={QuickServiceFormTabs}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="UpdateDetail"
        component={UpdateDetails}
        options={{ headerShown: false }}
      />

      <Stack.Screen
        name="AddSpareParts"
        component={AddSpareParts}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="ServiceDetails"
        component={ServiceDetails}
        options={{ headerShown: false }}
      />

      {/* Spare Parts */}
      <Stack.Screen
        name="SparePartsRequestScreen"
        component={SparePartsRequestScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="SparePartsRequestDetails"
        component={SparePartsRequestDetails}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="SparePartsIssueCreation"
        component={SparePartsIssueCreation}
        options={{ headerShown: false }}
      />

      {/* Market Study */}
      <Stack.Screen
        name="MarketStudyScreen"
        component={MarketStudyScreen}
        options={{ headerShown: false }}
      />

      {/* Visits Plan */}
      <Stack.Screen
        name="VisitsPlanScreen"
        component={VisitsPlanScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="VisitPlanForm"
        component={VisitPlanForm}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="VisitPlanDetails"
        component={VisitPlanDetails}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="EditVisitPlan"
        component={EditVisitPlan}
        options={{ headerShown: false }}
      />

      {/* Customer Visits */}
      <Stack.Screen
        name="VisitScreen"
        component={VisitScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="VisitForm"
        component={VisitForm}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="VisitDetails"
        component={VisitDetails}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="EditVisit"
        component={EditVisit}
        options={{ headerShown: false }}
      />

      {/* CRM */}
      <Stack.Screen
        name="CRM"
        component={CRMScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="EnquiryRegisterScreen"
        component={EnquiryRegisterScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="EnquiryRegisterForm"
        component={EnquiryRegisterForm}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="EnquiryDetailTabs"
        component={EnquiryDetailTabs}
        options={{ headerShown: false }}
      />

      {/* leads */}
      <Stack.Screen
        name="LeadScreen"
        component={LeadScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="LeadForm"
        component={LeadForm}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="LeadDetailTabs"
        component={LeadDetailTabs}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="EditLead"
        component={EditLead}
        options={{ headerShown: false }}
      />

      {/*Pipeline*/}
      <Stack.Screen
        name="PipelineScreen"
        component={PipelineScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="PipelineForm"
        component={PipelineForm}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="PipelineDetailTabs"
        component={PipelineDetailTabs}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="EditPipeline"
        component={EditPipeline}
        options={{ headerShown: false }}
      />

      {/* pickup */}
      <Stack.Screen
        name="Pickup"
        component={PickupScreen}
        options={{ headerShown: false }}
      />

      {/* BoxInspection */}
      <Stack.Screen
        name="BoxInspectionScreen"
        component={BoxInspectionScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="BoxInspectionForm"
        component={BoxInspectionForm}
        options={{ headerShown: false }}
      />

      {/* Attendance */}
      <Stack.Screen
        name="AttendanceScreen"
        component={AttendanceScreen}
        options={{ headerShown: false }}
      />
      {/* [Punching] */}
      <Stack.Screen
        name="PunchingScreen"
        component={PunchingScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="MarkAttendance"
        component={MarkAttendance}
        options={{ headerShown: false }}
      />
      <Stack.Screen 
      name="KPIListingScreen"
      component={KPIListingScreen}
      options={{ headerShown: false }}
      />
    </Stack.Navigator>
  );
};

export default StackNavigator;
