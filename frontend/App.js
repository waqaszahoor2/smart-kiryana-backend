/**
 * Smart Store - Main Application
 * ==================================
 * Root component with stack navigation.
 * Includes app restart functionality via Updates API.
 */

import React, { useState, useEffect, useCallback } from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { StatusBar } from "expo-status-bar";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "./src/api/firebase";

import HomeScreen from "./src/screens/HomeScreen";
import OwnersScreen from "./src/screens/OwnersScreen";
import AddOwnerScreen from "./src/screens/AddOwnerScreen";
import ProductsScreen from "./src/screens/ProductsScreen";
import AddProductScreen from "./src/screens/AddProductScreen";
import LoginScreen from "./src/screens/LoginScreen";

const Stack = createNativeStackNavigator();

export default function App() {
  const [user, setUser] = useState(null);
  const [initializing, setInitializing] = useState(true);
  const [appKey, setAppKey] = useState(1);

  // Handle user state changes
  useEffect(() => {
    const subscriber = onAuthStateChanged(auth, (user) => {
      setUser(user);
      if (initializing) setInitializing(false);
    });
    return subscriber; // unsubscribe on unmount
  }, []);

  const restartApp = useCallback(() => {
    setAppKey((prev) => prev + 1);
  }, []);

  if (initializing) return null; // Or a splash screen

  return (
    <>
      <StatusBar style="light" />
      <NavigationContainer key={appKey}>
        {!user ? (
          <Stack.Navigator screenOptions={{ headerShown: false }}>
            <Stack.Screen name="Login" component={LoginScreen} />
          </Stack.Navigator>
        ) : (
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
        )}
      </NavigationContainer>
    </>
  );
}
