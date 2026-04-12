/**
 * Smart Store - Owners List Screen
 * =====================================
 * Displays all registered business owners fetched from the backend.
 */

import React, { useState, useCallback } from "react";
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TouchableOpacity,
    ActivityIndicator,
    RefreshControl,
    Animated,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useFocusEffect } from "@react-navigation/native";
import COLORS from "../theme/colors";
import { fetchOwners } from "../api/ownerApi";

export default function OwnersScreen({ navigation }) {
    const [owners, setOwners] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState(null);

    const loadOwners = async (isRefresh = false) => {
        if (isRefresh) setRefreshing(true);
        else setLoading(true);

        const result = await fetchOwners();

        if (result.success) {
            setOwners(result.data);
            setError(null);
        } else {
            setError(result.message);
        }

        setLoading(false);
        setRefreshing(false);
    };

    // Reload on screen focus (e.g., returning from Add Owner)
    useFocusEffect(
        useCallback(() => {
            loadOwners();
        }, [])
    );

    const renderOwnerCard = ({ item, index }) => (
        <Animated.View style={[styles.card, { opacity: 1 }]}>
            <LinearGradient
                colors={COLORS.gradientCard}
                style={styles.cardGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
            >
                {/* Avatar */}
                <View style={styles.avatarContainer}>
                    <LinearGradient
                        colors={
                            index % 2 === 0
                                ? COLORS.gradientPrimary
                                : COLORS.gradientAccent
                        }
                        style={styles.avatar}
                    >
                        <Text style={styles.avatarText}>
                            {item.owner_name ? item.owner_name[0].toUpperCase() : "?"}
                        </Text>
                    </LinearGradient>
                </View>

                {/* Info */}
                <View style={styles.cardContent}>
                    <Text style={styles.shopName}>{item.shop_name}</Text>
                    <Text style={styles.ownerName}>👤  {item.owner_name}</Text>

                    <View style={styles.detailsRow}>
                        {item.phone ? (
                            <View style={styles.detailChip}>
                                <Text style={styles.detailChipText}>📞 {item.phone}</Text>
                            </View>
                        ) : null}
                        {item.email ? (
                            <View style={styles.detailChip}>
                                <Text style={styles.detailChipText}>✉️ {item.email}</Text>
                            </View>
                        ) : null}
                    </View>

                    {item.created_at && (
                        <Text style={styles.createdAt}>🕐 {item.created_at}</Text>
                    )}
                </View>
            </LinearGradient>
        </Animated.View>
    );

    const renderEmptyState = () => (
        <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>📭</Text>
            <Text style={styles.emptyTitle}>No Owners Yet</Text>
            <Text style={styles.emptyText}>
                Add your first business owner to get started.
            </Text>
            <TouchableOpacity
                activeOpacity={0.85}
                onPress={() => navigation.navigate("AddOwner")}
            >
                <LinearGradient
                    colors={COLORS.gradientPrimary}
                    style={styles.emptyButton}
                >
                    <Text style={styles.emptyButtonText}>+ Add Owner</Text>
                </LinearGradient>
            </TouchableOpacity>
        </View>
    );

    const renderError = () => (
        <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>⚠️</Text>
            <Text style={styles.emptyTitle}>Connection Error</Text>
            <Text style={styles.emptyText}>{error}</Text>
            <TouchableOpacity
                activeOpacity={0.85}
                onPress={() => loadOwners()}
            >
                <LinearGradient
                    colors={COLORS.gradientAccent}
                    style={styles.emptyButton}
                >
                    <Text style={styles.emptyButtonText}>Retry</Text>
                </LinearGradient>
            </TouchableOpacity>
        </View>
    );

    return (
        <LinearGradient colors={COLORS.gradientDark} style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.navigate("Home")}>
                    <Text style={styles.backBtn}>←</Text>
                </TouchableOpacity>
                <View style={{ flex: 1, marginLeft: 12 }}>
                    <Text style={styles.headerTitle}>Business Owners</Text>
                    <Text style={styles.headerSubtitle}>
                        {owners.length} {owners.length === 1 ? "owner" : "owners"}{" "}
                        registered
                    </Text>
                </View>
                <TouchableOpacity
                    activeOpacity={0.8}
                    onPress={() => navigation.navigate("AddOwner")}
                >
                    <LinearGradient
                        colors={COLORS.gradientPrimary}
                        style={styles.addButton}
                    >
                        <Text style={styles.addButtonText}>+ Add</Text>
                    </LinearGradient>
                </TouchableOpacity>
            </View>

            {/* Content */}
            {loading ? (
                <View style={styles.loaderContainer}>
                    <ActivityIndicator size="large" color={COLORS.primary} />
                    <Text style={styles.loaderText}>Loading owners...</Text>
                </View>
            ) : error ? (
                renderError()
            ) : (
                <FlatList
                    data={owners}
                    keyExtractor={(item) => String(item.id)}
                    renderItem={renderOwnerCard}
                    contentContainerStyle={styles.listContent}
                    showsVerticalScrollIndicator={false}
                    ListEmptyComponent={renderEmptyState}
                    refreshControl={
                        <RefreshControl
                            refreshing={refreshing}
                            onRefresh={() => loadOwners(true)}
                            colors={[COLORS.primary]}
                            tintColor={COLORS.primary}
                        />
                    }
                />
            )}
        </LinearGradient>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        paddingTop: 60,
    },
    header: {
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 24,
        marginBottom: 20,
    },
    backBtn: {
        fontSize: 26,
        color: COLORS.textPrimary,
        fontWeight: "700",
    },
    headerTitle: {
        fontSize: 26,
        fontWeight: "800",
        color: COLORS.textPrimary,
        letterSpacing: -0.3,
    },
    headerSubtitle: {
        fontSize: 13,
        color: COLORS.textSecondary,
        marginTop: 2,
    },
    addButton: {
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: 12,
    },
    addButtonText: {
        color: COLORS.white,
        fontWeight: "700",
        fontSize: 14,
    },
    loaderContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
    },
    loaderText: {
        color: COLORS.textSecondary,
        fontSize: 14,
        marginTop: 12,
    },
    listContent: {
        paddingHorizontal: 20,
        paddingBottom: 30,
    },
    card: {
        marginBottom: 14,
        borderRadius: 18,
        shadowColor: COLORS.black,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 10,
        elevation: 6,
    },
    cardGradient: {
        flexDirection: "row",
        borderRadius: 18,
        padding: 18,
        borderWidth: 1,
        borderColor: "rgba(51, 65, 85, 0.4)",
    },
    avatarContainer: {
        marginRight: 14,
    },
    avatar: {
        width: 50,
        height: 50,
        borderRadius: 15,
        alignItems: "center",
        justifyContent: "center",
    },
    avatarText: {
        fontSize: 22,
        fontWeight: "800",
        color: COLORS.white,
    },
    cardContent: {
        flex: 1,
    },
    shopName: {
        fontSize: 17,
        fontWeight: "700",
        color: COLORS.textPrimary,
        marginBottom: 3,
    },
    ownerName: {
        fontSize: 13,
        color: COLORS.textSecondary,
        marginBottom: 8,
    },
    detailsRow: {
        flexDirection: "row",
        flexWrap: "wrap",
        gap: 6,
        marginBottom: 6,
    },
    detailChip: {
        backgroundColor: "rgba(13, 148, 136, 0.12)",
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 8,
    },
    detailChipText: {
        fontSize: 11,
        color: COLORS.primaryLight,
        fontWeight: "500",
    },
    createdAt: {
        fontSize: 11,
        color: COLORS.textMuted,
        marginTop: 2,
    },
    emptyContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        paddingHorizontal: 40,
    },
    emptyIcon: {
        fontSize: 60,
        marginBottom: 16,
    },
    emptyTitle: {
        fontSize: 22,
        fontWeight: "700",
        color: COLORS.textPrimary,
        marginBottom: 8,
    },
    emptyText: {
        fontSize: 14,
        color: COLORS.textSecondary,
        textAlign: "center",
        lineHeight: 20,
        marginBottom: 24,
    },
    emptyButton: {
        paddingHorizontal: 28,
        paddingVertical: 14,
        borderRadius: 14,
    },
    emptyButtonText: {
        color: COLORS.white,
        fontWeight: "700",
        fontSize: 16,
    },
});
