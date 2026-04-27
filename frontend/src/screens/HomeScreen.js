/**
 * Smart Store - Home Screen
 * ============================
 * Landing screen with hero section and quick navigation.
 */

import React, { useEffect, useState } from "react";
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Animated,
    ScrollView,
    Dimensions,
    Alert,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { StatusBar } from "expo-status-bar";
import COLORS from "../theme/colors";

const { width } = Dimensions.get("window");

export default function HomeScreen({ navigation, onRestartApp }) {

    const handleRestart = () => {
        Alert.alert(
            "🔄 Restart App",
            "This will refresh the app. Your data will NOT be deleted.",
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Restart",
                    onPress: () => {
                        if (onRestartApp) {
                            onRestartApp();
                        }
                    },
                },
            ]
        );
    };
    const fadeAnim = useState(new Animated.Value(0))[0];
    const slideAnim = useState(new Animated.Value(40))[0];
    const scaleAnim = useState(new Animated.Value(0.9))[0];

    useEffect(() => {
        Animated.parallel([
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 800,
                useNativeDriver: true,
            }),
            Animated.timing(slideAnim, {
                toValue: 0,
                duration: 800,
                useNativeDriver: true,
            }),
            Animated.spring(scaleAnim, {
                toValue: 1,
                friction: 6,
                useNativeDriver: true,
            }),
        ]).start();
    }, []);

    return (
        <LinearGradient colors={COLORS.gradientHero} style={styles.container}>
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
                <StatusBar style="light" />

                {/* Decorative circles */}
                <View style={styles.decorCircle1} />
                <View style={styles.decorCircle2} />

                <Animated.View
                    style={[
                        styles.heroSection,
                        {
                            opacity: fadeAnim,
                            transform: [{ translateY: slideAnim }, { scale: scaleAnim }],
                        },
                    ]}
                >
                    {/* Logo / Brand */}
                    <View style={styles.logoContainer}>
                        <LinearGradient
                            colors={COLORS.gradientAccent}
                            style={styles.logoBadge}
                        >
                            <Text style={styles.logoEmoji}>🛒</Text>
                        </LinearGradient>
                    </View>

                    <Text style={styles.title}>Smart Store</Text>
                    <Text style={styles.subtitle}>
                        Your intelligent business management solution
                    </Text>

                    {/* Stats Row */}
                    <View style={styles.statsRow}>
                        <View style={styles.statItem}>
                            <Text style={styles.statIcon}>📊</Text>
                            <Text style={styles.statLabel}>Track Sales</Text>
                        </View>
                        <View style={styles.statDivider} />
                        <View style={styles.statItem}>
                            <Text style={styles.statIcon}>👥</Text>
                            <Text style={styles.statLabel}>Manage Owners</Text>
                        </View>
                        <View style={styles.statDivider} />
                        <View style={styles.statItem}>
                            <Text style={styles.statIcon}>📦</Text>
                            <Text style={styles.statLabel}>Inventory</Text>
                        </View>
                    </View>
                </Animated.View>

                {/* Action Cards */}
                <Animated.View
                    style={[styles.actionsContainer, { opacity: fadeAnim }]}
                >
                    <TouchableOpacity
                        activeOpacity={0.85}
                        onPress={() => navigation.navigate("Owners")}
                    >
                        <LinearGradient
                            colors={COLORS.gradientPrimary}
                            style={styles.actionCard}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 1 }}
                        >
                            <View style={styles.actionIconWrap}>
                                <Text style={styles.actionIcon}>👥</Text>
                            </View>
                            <View style={styles.actionTextWrap}>
                                <Text style={styles.actionTitle}>View Owners</Text>
                                <Text style={styles.actionDesc}>
                                    Browse all registered business owners
                                </Text>
                            </View>
                            <Text style={styles.actionArrow}>→</Text>
                        </LinearGradient>
                    </TouchableOpacity>

                    <TouchableOpacity
                        activeOpacity={0.85}
                        onPress={() => navigation.navigate("AddOwner")}
                    >
                        <LinearGradient
                            colors={COLORS.gradientAccent}
                            style={styles.actionCard}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 1 }}
                        >
                            <View style={styles.actionIconWrap}>
                                <Text style={styles.actionIcon}>➕</Text>
                            </View>
                            <View style={styles.actionTextWrap}>
                                <Text style={styles.actionTitle}>Add New Owner</Text>
                                <Text style={styles.actionDesc}>
                                    Register a new business owner
                                </Text>
                            </View>
                            <Text style={styles.actionArrow}>→</Text>
                        </LinearGradient>
                    </TouchableOpacity>

                    <TouchableOpacity
                        activeOpacity={0.85}
                        onPress={() => navigation.navigate("Products")}
                    >
                        <LinearGradient
                            colors={["#6366F1", "#4F46E5"]}
                            style={styles.actionCard}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 1 }}
                        >
                            <View style={styles.actionIconWrap}>
                                <Text style={styles.actionIcon}>📦</Text>
                            </View>
                            <View style={styles.actionTextWrap}>
                                <Text style={styles.actionTitle}>Store Products</Text>
                                <Text style={styles.actionDesc}>
                                    View & manage inventory items
                                </Text>
                            </View>
                            <Text style={styles.actionArrow}>→</Text>
                        </LinearGradient>
                    </TouchableOpacity>

                    <TouchableOpacity
                        activeOpacity={0.85}
                        onPress={() => navigation.navigate("AddProduct")}
                    >
                        <LinearGradient
                            colors={["#EC4899", "#DB2777"]}
                            style={styles.actionCard}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 1 }}
                        >
                            <View style={styles.actionIconWrap}>
                                <Text style={styles.actionIcon}>🛒</Text>
                            </View>
                            <View style={styles.actionTextWrap}>
                                <Text style={styles.actionTitle}>Add Product</Text>
                                <Text style={styles.actionDesc}>
                                    Add items like rice, sugar, wheat etc.
                                </Text>
                            </View>
                            <Text style={styles.actionArrow}>→</Text>
                        </LinearGradient>
                    </TouchableOpacity>

                    {/* Restart Button */}
                    <TouchableOpacity
                        activeOpacity={0.85}
                        onPress={handleRestart}
                        style={styles.restartTouchable}
                    >
                        <View style={styles.restartBtn}>
                            <Text style={styles.restartIcon}>🔄</Text>
                            <Text style={styles.restartText}>Restart App</Text>
                        </View>
                    </TouchableOpacity>
                </Animated.View>

                {/* Footer */}
                <Text style={styles.footer}>Smart Store v2.0</Text>
            </ScrollView>
        </LinearGradient>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        paddingHorizontal: 24,
        paddingTop: 60,
        paddingBottom: 30,
    },
    decorCircle1: {
        position: "absolute",
        top: -80,
        right: -60,
        width: 220,
        height: 220,
        borderRadius: 110,
        backgroundColor: "rgba(13, 148, 136, 0.15)",
    },
    decorCircle2: {
        position: "absolute",
        bottom: 120,
        left: -80,
        width: 180,
        height: 180,
        borderRadius: 90,
        backgroundColor: "rgba(245, 158, 11, 0.08)",
    },
    scrollContent: {
        paddingBottom: 20,
        flexGrow: 1,
    },
    heroSection: {
        alignItems: "center",
        marginBottom: 24,
    },
    logoContainer: {
        marginBottom: 20,
    },
    logoBadge: {
        width: 80,
        height: 80,
        borderRadius: 24,
        alignItems: "center",
        justifyContent: "center",
        shadowColor: COLORS.accent,
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.4,
        shadowRadius: 16,
        elevation: 12,
    },
    logoEmoji: {
        fontSize: 38,
    },
    title: {
        fontSize: 34,
        fontWeight: "800",
        color: COLORS.textPrimary,
        letterSpacing: -0.5,
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 15,
        color: COLORS.textSecondary,
        textAlign: "center",
        lineHeight: 22,
        maxWidth: 280,
    },
    statsRow: {
        flexDirection: "row",
        alignItems: "center",
        marginTop: 28,
        backgroundColor: "rgba(30, 41, 59, 0.6)",
        borderRadius: 16,
        paddingVertical: 16,
        paddingHorizontal: 20,
        borderWidth: 1,
        borderColor: "rgba(51, 65, 85, 0.5)",
    },
    statItem: {
        flex: 1,
        alignItems: "center",
    },
    statIcon: {
        fontSize: 22,
        marginBottom: 4,
    },
    statLabel: {
        fontSize: 11,
        color: COLORS.textSecondary,
        fontWeight: "600",
        letterSpacing: 0.3,
    },
    statDivider: {
        width: 1,
        height: 30,
        backgroundColor: COLORS.border,
    },
    actionsContainer: {
        flex: 1,
        justifyContent: "center",
        gap: 12,
    },
    actionCard: {
        flexDirection: "row",
        alignItems: "center",
        borderRadius: 18,
        padding: 20,
        marginBottom: 2,
        shadowColor: COLORS.black,
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.3,
        shadowRadius: 12,
        elevation: 8,
    },
    actionIconWrap: {
        width: 48,
        height: 48,
        borderRadius: 14,
        backgroundColor: "rgba(255,255,255,0.2)",
        alignItems: "center",
        justifyContent: "center",
        marginRight: 16,
    },
    actionIcon: {
        fontSize: 24,
    },
    actionTextWrap: {
        flex: 1,
    },
    actionTitle: {
        fontSize: 18,
        fontWeight: "700",
        color: COLORS.white,
        marginBottom: 2,
    },
    actionDesc: {
        fontSize: 12,
        color: "rgba(255,255,255,0.75)",
    },
    actionArrow: {
        fontSize: 22,
        color: "rgba(255,255,255,0.7)",
        fontWeight: "700",
    },
    restartTouchable: {
        marginTop: 16,
        alignItems: "center",
    },
    restartBtn: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "rgba(30, 41, 59, 0.7)",
        paddingHorizontal: 24,
        paddingVertical: 14,
        borderRadius: 14,
        borderWidth: 1,
        borderColor: "rgba(51, 65, 85, 0.5)",
        gap: 8,
    },
    restartIcon: {
        fontSize: 18,
    },
    restartText: {
        color: COLORS.textSecondary,
        fontSize: 14,
        fontWeight: "600",
    },
    footer: {
        textAlign: "center",
        color: COLORS.textSecondary,
        fontSize: 12,
        opacity: 0.5,
        marginTop: 16,
    },
});
