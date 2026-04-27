import React, { useState, useEffect } from "react";
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  SafeAreaView,
  Dimensions,
  Image,
  ActivityIndicator,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import * as WebBrowser from "expo-web-browser";
import * as Google from "expo-auth-session/providers/google";
import { 
  GoogleAuthProvider, 
  signInWithCredential, 
  onAuthStateChanged 
} from "firebase/auth";
import { auth } from "../api/firebase";

WebBrowser.maybeCompleteAuthSession();

const { width, height } = Dimensions.get("window");

export default function LoginScreen({ onLoginSuccess }) {
  const [loading, setLoading] = useState(false);

  const [request, response, promptAsync] = Google.useAuthRequest({
    // You must provide these client IDs for Google Sign-In to work
    // In Expo Go, you need an Expo client ID. For standalone apps, Android/iOS client IDs.
    iosClientId: "YOUR_IOS_CLIENT_ID",
    androidClientId: "YOUR_ANDROID_CLIENT_ID",
    webClientId: "YOUR_WEB_CLIENT_ID",
  });

  useEffect(() => {
    if (response?.type === "success") {
      const { id_token } = response.params;
      const credential = GoogleAuthProvider.credential(id_token);
      setLoading(true);
      signInWithCredential(auth, credential)
        .then((userCredential) => {
          setLoading(false);
          onLoginSuccess && onLoginSuccess(userCredential.user);
        })
        .catch((error) => {
          setLoading(false);
          console.error("Firebase Login Error:", error);
        });
    }
  }, [response]);

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={["#0F172A", "#1E293B", "#334155"]}
        style={styles.background}
      />
      
      <SafeAreaView style={styles.content}>
        <View style={styles.header}>
          <View style={styles.logoContainer}>
            <Text style={styles.logoText}>SK</Text>
          </View>
          <Text style={styles.title}>Smart Kiryana</Text>
          <Text style={styles.subtitle}>Modern Store Management</Text>
        </View>

        <View style={styles.bottomSection}>
          <TouchableOpacity
            style={styles.googleButton}
            disabled={!request || loading}
            onPress={() => promptAsync()}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Image
                  source={{ uri: "https://upload.wikimedia.org/wikipedia/commons/5/53/Google_%22G%22_Logo.svg" }}
                  style={styles.googleIcon}
                />
                <Text style={styles.buttonText}>Sign in with Google</Text>
              </>
            )}
          </TouchableOpacity>
          
          <Text style={styles.footerText}>
            Securely powered by Firebase
          </Text>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  background: {
    ...StyleSheet.absoluteFillObject,
  },
  content: {
    flex: 1,
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 60,
  },
  header: {
    alignItems: "center",
    marginTop: height * 0.1,
  },
  logoContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "#38BDF8",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
    shadowColor: "#38BDF8",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 15,
    elevation: 10,
  },
  logoText: {
    fontSize: 40,
    fontWeight: "bold",
    color: "#fff",
  },
  title: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#fff",
    letterSpacing: 1,
  },
  subtitle: {
    fontSize: 16,
    color: "#94A3B8",
    marginTop: 8,
  },
  bottomSection: {
    width: "100%",
    paddingHorizontal: 40,
    alignItems: "center",
  },
  googleButton: {
    flexDirection: "row",
    backgroundColor: "#2563EB",
    width: "100%",
    height: 56,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#2563EB",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  googleIcon: {
    width: 24,
    height: 24,
    marginRight: 12,
  },
  buttonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "600",
  },
  footerText: {
    color: "#64748B",
    fontSize: 12,
    marginTop: 20,
  },
});
