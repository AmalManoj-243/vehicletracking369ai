// src/navigation/StackNavigator.js

import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import AppNavigator from "./AppNavigator";
import { ProductsScreen, SplashScreen } from "@screens";
import { OptionsScreen } from "@screens/Home/Options";
import { TaskManagerScreen } from "@screens/Home/Options/TaskManager";
import { AuditForm, AuditScreen } from "@screens/Home/Options/Audit";
import { LoginScreen, PrivacyPolicy } from "@screens/Auth";
import { Scanner } from "@components/Scanner";
import { InventoryForm, InventoryScreen } from "@screens/Home/Options/Inventory";

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
    </Stack.Navigator>
  );
};

export default StackNavigator;
