/**
 * Smart Store - Add Owner Screen
 * ==================================
 * Form to register a new business owner.
 */

import React, { useState, useRef } from "react";
import {
    View,
    Text,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    Alert,
    ScrollView,
    KeyboardAvoidingView,
    Platform,
    Animated,
    ActivityIndicator,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import COLORS from "../theme/colors";
import { addOwner } from "../api/ownerApi";

export default function AddOwnerScreen({ navigation }) {
    const [shopName, setShopName] = useState("");
    const [ownerName, setOwnerName] = useState("");
    const [phone, setPhone] = useState("");
    const [email, setEmail] = useState("");
    const [submitting, setSubmitting] = useState(false);

    // Refs for focusing next input
    const ownerNameRef = useRef();
    const phoneRef = useRef();
    const emailRef = useRef();

    // Success animation
    const checkAnim = useRef(new Animated.Value(0)).current;

    const handleSubmit = async () => {
        // Validation
        if (!shopName.trim()) {
            Alert.alert("Required", "Please enter the shop name.");
            return;
        }
        if (!ownerName.trim()) {
            Alert.alert("Required", "Please enter the owner name.");
            return;
        }

        setSubmitting(true);

        const result = await addOwner({
            shop_name: shopName.trim(),
            owner_name: ownerName.trim(),
            phone: phone.trim(),
            email: email.trim(),
        });

        setSubmitting(false);

        if (result.success) {
            // Play quick success animation
            Animated.spring(checkAnim, {
                toValue: 1,
                friction: 4,
                useNativeDriver: true,
            }).start(() => {
                Alert.alert(
                    "✅ Owner Added Successfully!",
                    `"${shopName.trim()}" has been registered as a new business owner.`,
                    [
                        {
                            text: "🏠 Go to Home",
                            onPress: () => navigation.navigate("Home"),
                        },
                        {
                            text: "👥 View Owners",
                            onPress: () => navigation.navigate("Owners"),
                        },
                        {
                            text: "➕ Add Another",
                            onPress: () => {
                                resetForm();
                                checkAnim.setValue(0);
                            },
                        },
                    ]
                );
            });
        } else {
            Alert.alert("❌ Error", result.message || "Something went wrong.");
        }
    };

    const resetForm = () => {
        setShopName("");
        setOwnerName("");
        setPhone("");
        setEmail("");
    };

    return (
        <LinearGradient colors={COLORS.gradientDark} style={styles.container}>
            <KeyboardAvoidingView
                behavior={Platform.OS === "ios" ? "padding" : "height"}
                style={{ flex: 1 }}
            >
                <ScrollView
                    contentContainerStyle={styles.scrollContent}
                    showsVerticalScrollIndicator={false}
                    keyboardShouldPersistTaps="handled"
                >
                    {/* Header */}
                    <View style={styles.headerRow}>
                        <TouchableOpacity onPress={() => navigation.navigate("Home")}>
                            <Text style={styles.backBtn}>←</Text>
                        </TouchableOpacity>
                        <View style={{ marginLeft: 12 }}>
                            <Text style={styles.headerTitle}>Register Owner</Text>
                            <Text style={styles.headerSubtitle}>
                                Add a new business owner to the system
                            </Text>
                        </View>
                    </View>

                    {/* Form Card */}
                    <View style={styles.formCard}>
                        {/* Shop Name */}
                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>
                                Shop Name <Text style={styles.required}>*</Text>
                            </Text>
                            <View style={styles.inputWrapper}>
                                <Text style={styles.inputIcon}>🏪</Text>
                                <TextInput
                                    style={styles.input}
                                    value={shopName}
                                    onChangeText={setShopName}
                                    placeholder="Enter shop name"
                                    placeholderTextColor={COLORS.textMuted}
                                    returnKeyType="next"
                                    onSubmitEditing={() => ownerNameRef.current?.focus()}
                                />
                            </View>
                        </View>

                        {/* Owner Name */}
                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>
                                Owner Name <Text style={styles.required}>*</Text>
                            </Text>
                            <View style={styles.inputWrapper}>
                                <Text style={styles.inputIcon}>👤</Text>
                                <TextInput
                                    ref={ownerNameRef}
                                    style={styles.input}
                                    value={ownerName}
                                    onChangeText={setOwnerName}
                                    placeholder="Enter owner name"
                                    placeholderTextColor={COLORS.textMuted}
                                    returnKeyType="next"
                                    onSubmitEditing={() => phoneRef.current?.focus()}
                                />
                            </View>
                        </View>

                        {/* Phone */}
                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Phone Number</Text>
                            <View style={styles.inputWrapper}>
                                <Text style={styles.inputIcon}>📞</Text>
                                <TextInput
                                    ref={phoneRef}
                                    style={styles.input}
                                    value={phone}
                                    onChangeText={setPhone}
                                    placeholder="03001234567"
                                    placeholderTextColor={COLORS.textMuted}
                                    keyboardType="phone-pad"
                                    returnKeyType="next"
                                    onSubmitEditing={() => emailRef.current?.focus()}
                                />
                            </View>
                        </View>

                        {/* Email */}
                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Email Address</Text>
                            <View style={styles.inputWrapper}>
                                <Text style={styles.inputIcon}>✉️</Text>
                                <TextInput
                                    ref={emailRef}
                                    style={styles.input}
                                    value={email}
                                    onChangeText={setEmail}
                                    placeholder="owner@example.com"
                                    placeholderTextColor={COLORS.textMuted}
                                    keyboardType="email-address"
                                    autoCapitalize="none"
                                    returnKeyType="done"
                                    onSubmitEditing={handleSubmit}
                                />
                            </View>
                        </View>

                        {/* Submit Button */}
                        <TouchableOpacity
                            activeOpacity={0.85}
                            onPress={handleSubmit}
                            disabled={submitting}
                            style={styles.submitTouchable}
                        >
                            <LinearGradient
                                colors={
                                    submitting
                                        ? [COLORS.bgCardLight, COLORS.bgCardLight]
                                        : COLORS.gradientPrimary
                                }
                                style={styles.submitButton}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 0 }}
                            >
                                {submitting ? (
                                    <ActivityIndicator color={COLORS.white} size="small" />
                                ) : (
                                    <Text style={styles.submitText}>Register Owner</Text>
                                )}
                            </LinearGradient>
                        </TouchableOpacity>

                        {/* Reset */}
                        <TouchableOpacity
                            onPress={resetForm}
                            style={styles.resetButton}
                            activeOpacity={0.7}
                        >
                            <Text style={styles.resetText}>Clear Form</Text>
                        </TouchableOpacity>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </LinearGradient>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    scrollContent: {
        paddingHorizontal: 24,
        paddingTop: 60,
        paddingBottom: 40,
    },
    headerRow: {
        flexDirection: "row",
        alignItems: "center",
        marginBottom: 28,
    },
    backBtn: {
        fontSize: 26,
        color: COLORS.textPrimary,
        fontWeight: "700",
    },
    headerTitle: {
        fontSize: 28,
        fontWeight: "800",
        color: COLORS.textPrimary,
        letterSpacing: -0.3,
    },
    headerSubtitle: {
        fontSize: 14,
        color: COLORS.textSecondary,
        marginTop: 4,
    },
    formCard: {
        backgroundColor: COLORS.bgCard,
        borderRadius: 22,
        padding: 24,
        borderWidth: 1,
        borderColor: "rgba(51, 65, 85, 0.4)",
        shadowColor: COLORS.black,
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.25,
        shadowRadius: 16,
        elevation: 10,
    },
    inputGroup: {
        marginBottom: 20,
    },
    label: {
        fontSize: 13,
        fontWeight: "600",
        color: COLORS.textSecondary,
        marginBottom: 8,
        letterSpacing: 0.3,
        textTransform: "uppercase",
    },
    required: {
        color: COLORS.error,
    },
    inputWrapper: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "rgba(15, 23, 42, 0.6)",
        borderRadius: 14,
        borderWidth: 1,
        borderColor: COLORS.border,
        paddingHorizontal: 14,
    },
    inputIcon: {
        fontSize: 18,
        marginRight: 10,
    },
    input: {
        flex: 1,
        paddingVertical: 14,
        fontSize: 15,
        color: COLORS.textPrimary,
        fontWeight: "500",
    },
    submitTouchable: {
        marginTop: 8,
    },
    submitButton: {
        borderRadius: 14,
        paddingVertical: 16,
        alignItems: "center",
        justifyContent: "center",
        shadowColor: COLORS.primary,
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.3,
        shadowRadius: 12,
        elevation: 8,
    },
    submitText: {
        color: COLORS.white,
        fontSize: 17,
        fontWeight: "700",
        letterSpacing: 0.3,
    },
    resetButton: {
        alignItems: "center",
        paddingVertical: 14,
        marginTop: 4,
    },
    resetText: {
        color: COLORS.textMuted,
        fontSize: 14,
        fontWeight: "500",
    },
});
