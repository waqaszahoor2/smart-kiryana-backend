/**
 * Smart Store - Main Application
 * ==================================
 * Root component with stack navigation.
 * Includes app restart functionality via Updates API.
 */

import React, { useState, useCallback } from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { StatusBar } from "expo-status-bar";

import HomeScreen from "./src/screens/HomeScreen";
import OwnersScreen from "./src/screens/OwnersScreen";
import AddOwnerScreen from "./src/screens/AddOwnerScreen";
import ProductsScreen from "./src/screens/ProductsScreen";
import AddProductScreen from "./src/screens/AddProductScreen";

const Stack = createNativeStackNavigator();

export default function App() {
  // Key-based restart: changing key forces full remount of the app
  const [appKey, setAppKey] = useState(1);

  const restartApp = useCallback(() => {
    setAppKey((prev) => prev + 1);
  }, []);

  return (
    <>
      <StatusBar style="light" />
      <NavigationContainer key={appKey}>
        <Stack.Navigator
          initialRouteName="Home"
          screenOptions={{
            headerShown: false,
            animation: "slide_from_right",
            contentStyle: { backgroundColor: "#0F172A" },
          }}
        >
          <Stack.Screen name="Home">
            {(props) => <HomeScreen {...props} onRestartApp={restartApp} />}
          </Stack.Screen>
          <Stack.Screen name="Owners" component={OwnersScreen} />
          <Stack.Screen name="AddOwner" component={AddOwnerScreen} />
          <Stack.Screen name="Products" component={ProductsScreen} />
          <Stack.Screen name="AddProduct" component={AddProductScreen} />
        </Stack.Navigator>
      </NavigationContainer>
    </>
  );
}
