/**
 * Smart Store - Products Screen
 * ==================================
 * Displays all store products with category filtering,
 * stock badges, and swipe actions.
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
    Alert,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useFocusEffect } from "@react-navigation/native";
import COLORS from "../theme/colors";
import { fetchProducts, deleteProduct, updateProduct } from "../api/productApi";

const CATEGORIES = [
    "All",
    "Grain",
    "Sugar",
    "Oil",
    "Spice",
    "Dairy",
    "Snack",
    "Beverage",
    "Other",
];

const CATEGORY_ICONS = {
    Grain: "🌾",
    Sugar: "🍚",
    Oil: "🫒",
    Spice: "🌶️",
    Dairy: "🥛",
    Snack: "🍪",
    Beverage: "🥤",
    Other: "📦",
    All: "🏪",
};

export default function ProductsScreen({ navigation }) {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState(null);
    const [activeCategory, setActiveCategory] = useState("All");

    const loadProducts = async (isRefresh = false) => {
        if (isRefresh) setRefreshing(true);
        else setLoading(true);

        const category = activeCategory === "All" ? null : activeCategory;
        const result = await fetchProducts(null, category);

        if (result.success) {
            setProducts(result.data);
            setError(null);
        } else {
            setError(result.message);
        }

        setLoading(false);
        setRefreshing(false);
    };

    useFocusEffect(
        useCallback(() => {
            loadProducts();
        }, [activeCategory])
    );

    const handleDelete = (product) => {
        Alert.alert(
            "Delete Product",
            `Are you sure you want to delete "${product.product_name}"?`,
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Delete",
                    style: "destructive",
                    onPress: async () => {
                        const result = await deleteProduct(product.id);
                        if (result.success) {
                            loadProducts();
                        } else {
                            Alert.alert("Error", result.message);
                        }
                    },
                },
            ]
        );
    };

    const toggleAvailability = async (product) => {
        const result = await updateProduct(product.id, {
            is_available: !product.is_available,
        });
        if (result.success) {
            loadProducts();
        } else {
            Alert.alert("Error", result.message);
        }
    };

    const renderCategoryFilter = () => (
        <FlatList
            horizontal
            data={CATEGORIES}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.categoryList}
            keyExtractor={(item) => item}
            renderItem={({ item }) => (
                <TouchableOpacity
                    activeOpacity={0.8}
                    onPress={() => setActiveCategory(item)}
                >
                    <View
                        style={[
                            styles.categoryChip,
                            activeCategory === item && styles.categoryChipActive,
                        ]}
                    >
                        <Text style={styles.categoryIcon}>
                            {CATEGORY_ICONS[item] || "📦"}
                        </Text>
                        <Text
                            style={[
                                styles.categoryText,
                                activeCategory === item && styles.categoryTextActive,
                            ]}
                        >
                            {item}
                        </Text>
                    </View>
                </TouchableOpacity>
            )}
        />
    );

    const renderProductCard = ({ item }) => {
        const isOutOfStock = item.quantity === 0 || !item.is_available;

        return (
            <View style={styles.card}>
                <LinearGradient
                    colors={COLORS.gradientCard}
                    style={styles.cardGradient}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                >
                    {/* Top row: icon + name + badge */}
                    <View style={styles.cardTop}>
                        <View style={styles.productIconWrap}>
                            <Text style={styles.productIcon}>
                                {CATEGORY_ICONS[item.category] || "📦"}
                            </Text>
                        </View>
                        <View style={styles.cardInfo}>
                            <Text style={styles.productName} numberOfLines={1}>
                                {item.product_name}
                            </Text>
                            <Text style={styles.shopLabel}>
                                🏪 {item.shop_name || "Unknown Shop"}
                            </Text>
                        </View>
                        <View
                            style={[
                                styles.stockBadge,
                                isOutOfStock ? styles.stockBadgeOut : styles.stockBadgeIn,
                            ]}
                        >
                            <Text
                                style={[
                                    styles.stockBadgeText,
                                    isOutOfStock
                                        ? styles.stockBadgeTextOut
                                        : styles.stockBadgeTextIn,
                                ]}
                            >
                                {isOutOfStock ? "Out" : "In Stock"}
                            </Text>
                        </View>
                    </View>

                    {/* Stats row */}
                    <View style={styles.statsRow}>
                        <View style={styles.statBox}>
                            <Text style={styles.statLabel}>Price</Text>
                            <Text style={styles.statValue}>Rs {item.price}</Text>
                        </View>
                        <View style={styles.statDivider} />
                        <View style={styles.statBox}>
                            <Text style={styles.statLabel}>Quantity</Text>
                            <Text style={styles.statValue}>
                                {item.quantity} {item.unit}
                            </Text>
                        </View>
                        <View style={styles.statDivider} />
                        <View style={styles.statBox}>
                            <Text style={styles.statLabel}>Category</Text>
                            <Text style={styles.statValue}>{item.category}</Text>
                        </View>
                    </View>

                    {/* Action buttons */}
                    <View style={styles.cardActions}>
                        <TouchableOpacity
                            style={[
                                styles.actionBtn,
                                {
                                    backgroundColor: item.is_available
                                        ? "rgba(239, 68, 68, 0.15)"
                                        : "rgba(34, 197, 94, 0.15)",
                                },
                            ]}
                            onPress={() => toggleAvailability(item)}
                            activeOpacity={0.7}
                        >
                            <Text
                                style={[
                                    styles.actionBtnText,
                                    {
                                        color: item.is_available ? COLORS.error : COLORS.success,
                                    },
                                ]}
                            >
                                {item.is_available ? "Mark Unavailable" : "Mark Available"}
                            </Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[
                                styles.actionBtn,
                                { backgroundColor: "rgba(239, 68, 68, 0.15)" },
                            ]}
                            onPress={() => handleDelete(item)}
                            activeOpacity={0.7}
                        >
                            <Text style={[styles.actionBtnText, { color: COLORS.error }]}>
                                🗑️ Delete
                            </Text>
                        </TouchableOpacity>
                    </View>
                </LinearGradient>
            </View>
        );
    };

    const renderEmptyState = () => (
        <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>📦</Text>
            <Text style={styles.emptyTitle}>No Products Yet</Text>
            <Text style={styles.emptyText}>
                Add your first product to start managing inventory.
            </Text>
            <TouchableOpacity
                activeOpacity={0.85}
                onPress={() => navigation.navigate("AddProduct")}
            >
                <LinearGradient colors={COLORS.gradientPrimary} style={styles.emptyBtn}>
                    <Text style={styles.emptyBtnText}>+ Add Product</Text>
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
                    <Text style={styles.headerTitle}>Store Products</Text>
                    <Text style={styles.headerSubtitle}>
                        {products.length} {products.length === 1 ? "item" : "items"} in
                        inventory
                    </Text>
                </View>
                <TouchableOpacity
                    activeOpacity={0.8}
                    onPress={() => navigation.navigate("AddProduct")}
                >
                    <LinearGradient
                        colors={COLORS.gradientPrimary}
                        style={styles.addBtn}
                    >
                        <Text style={styles.addBtnText}>+ Add</Text>
                    </LinearGradient>
                </TouchableOpacity>
            </View>

            {/* Category Filter */}
            {renderCategoryFilter()}

            {/* Product List */}
            {loading ? (
                <View style={styles.loaderContainer}>
                    <ActivityIndicator size="large" color={COLORS.primary} />
                    <Text style={styles.loaderText}>Loading products...</Text>
                </View>
            ) : error ? (
                <View style={styles.emptyContainer}>
                    <Text style={styles.emptyIcon}>⚠️</Text>
                    <Text style={styles.emptyTitle}>Connection Error</Text>
                    <Text style={styles.emptyText}>{error}</Text>
                    <TouchableOpacity activeOpacity={0.85} onPress={() => loadProducts()}>
                        <LinearGradient
                            colors={COLORS.gradientAccent}
                            style={styles.emptyBtn}
                        >
                            <Text style={styles.emptyBtnText}>Retry</Text>
                        </LinearGradient>
                    </TouchableOpacity>
                </View>
            ) : (
                <FlatList
                    data={products}
                    keyExtractor={(item) => String(item.id)}
                    renderItem={renderProductCard}
                    contentContainerStyle={styles.listContent}
                    showsVerticalScrollIndicator={false}
                    ListEmptyComponent={renderEmptyState}
                    refreshControl={
                        <RefreshControl
                            refreshing={refreshing}
                            onRefresh={() => loadProducts(true)}
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
        paddingTop: 55,
    },
    header: {
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 20,
        marginBottom: 16,
    },
    backBtn: {
        fontSize: 26,
        color: COLORS.textPrimary,
        fontWeight: "700",
    },
    headerTitle: {
        fontSize: 24,
        fontWeight: "800",
        color: COLORS.textPrimary,
        letterSpacing: -0.3,
    },
    headerSubtitle: {
        fontSize: 12,
        color: COLORS.textSecondary,
        marginTop: 1,
    },
    addBtn: {
        paddingHorizontal: 18,
        paddingVertical: 10,
        borderRadius: 12,
    },
    addBtnText: {
        color: COLORS.white,
        fontWeight: "700",
        fontSize: 13,
    },
    categoryList: {
        paddingHorizontal: 20,
        paddingBottom: 14,
        gap: 8,
    },
    categoryChip: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: COLORS.bgCard,
        paddingHorizontal: 14,
        paddingVertical: 8,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: COLORS.border,
        gap: 5,
    },
    categoryChipActive: {
        backgroundColor: "rgba(13, 148, 136, 0.2)",
        borderColor: COLORS.primary,
    },
    categoryIcon: {
        fontSize: 14,
    },
    categoryText: {
        fontSize: 12,
        color: COLORS.textSecondary,
        fontWeight: "600",
    },
    categoryTextActive: {
        color: COLORS.primaryLight,
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
        borderRadius: 18,
        padding: 18,
        borderWidth: 1,
        borderColor: "rgba(51, 65, 85, 0.4)",
    },
    cardTop: {
        flexDirection: "row",
        alignItems: "center",
        marginBottom: 14,
    },
    productIconWrap: {
        width: 46,
        height: 46,
        borderRadius: 14,
        backgroundColor: "rgba(13, 148, 136, 0.15)",
        alignItems: "center",
        justifyContent: "center",
        marginRight: 12,
    },
    productIcon: {
        fontSize: 22,
    },
    cardInfo: {
        flex: 1,
    },
    productName: {
        fontSize: 16,
        fontWeight: "700",
        color: COLORS.textPrimary,
    },
    shopLabel: {
        fontSize: 11,
        color: COLORS.textMuted,
        marginTop: 2,
    },
    stockBadge: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 8,
    },
    stockBadgeIn: {
        backgroundColor: "rgba(34, 197, 94, 0.15)",
    },
    stockBadgeOut: {
        backgroundColor: "rgba(239, 68, 68, 0.15)",
    },
    stockBadgeText: {
        fontSize: 11,
        fontWeight: "700",
    },
    stockBadgeTextIn: {
        color: COLORS.success,
    },
    stockBadgeTextOut: {
        color: COLORS.error,
    },
    statsRow: {
        flexDirection: "row",
        backgroundColor: "rgba(15, 23, 42, 0.4)",
        borderRadius: 12,
        paddingVertical: 12,
        paddingHorizontal: 6,
        marginBottom: 12,
    },
    statBox: {
        flex: 1,
        alignItems: "center",
    },
    statLabel: {
        fontSize: 10,
        color: COLORS.textMuted,
        fontWeight: "600",
        textTransform: "uppercase",
        letterSpacing: 0.4,
        marginBottom: 3,
    },
    statValue: {
        fontSize: 14,
        fontWeight: "700",
        color: COLORS.textPrimary,
    },
    statDivider: {
        width: 1,
        backgroundColor: COLORS.border,
    },
    cardActions: {
        flexDirection: "row",
        gap: 8,
    },
    actionBtn: {
        flex: 1,
        paddingVertical: 9,
        borderRadius: 10,
        alignItems: "center",
    },
    actionBtnText: {
        fontSize: 12,
        fontWeight: "700",
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
    emptyBtn: {
        paddingHorizontal: 28,
        paddingVertical: 14,
        borderRadius: 14,
    },
    emptyBtnText: {
        color: COLORS.white,
        fontWeight: "700",
        fontSize: 16,
    },
});
