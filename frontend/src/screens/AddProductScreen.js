/**
 * Smart Store - Add Product Screen
 * =====================================
 * Form to add a new product to the store inventory.
 * Owner must be selected, then product details entered.
 */

import React, { useState, useRef, useEffect } from "react";
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
    ActivityIndicator,
    Switch,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import COLORS from "../theme/colors";
import { addProduct } from "../api/productApi";
import { fetchOwners } from "../api/ownerApi";

const CATEGORIES = [
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
};

const UNITS = ["kg", "gram", "litre", "ml", "packet", "piece", "dozen", "bag"];

export default function AddProductScreen({ navigation }) {
    const [owners, setOwners] = useState([]);
    const [selectedOwnerId, setSelectedOwnerId] = useState(null);
    const [productName, setProductName] = useState("");
    const [category, setCategory] = useState("Grain");
    const [price, setPrice] = useState("");
    const [quantity, setQuantity] = useState("");
    const [unit, setUnit] = useState("kg");
    const [isAvailable, setIsAvailable] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [loadingOwners, setLoadingOwners] = useState(true);

    const priceRef = useRef();
    const quantityRef = useRef();

    useEffect(() => {
        loadOwners();
    }, []);

    const loadOwners = async () => {
        setLoadingOwners(true);
        const result = await fetchOwners();
        if (result.success && result.data.length > 0) {
            setOwners(result.data);
            setSelectedOwnerId(result.data[0].id);
        }
        setLoadingOwners(false);
    };

    const handleSubmit = async () => {
        if (!selectedOwnerId) {
            Alert.alert("Required", "Please select a shop owner first.");
            return;
        }
        if (!productName.trim()) {
            Alert.alert("Required", "Please enter the product name.");
            return;
        }
        if (!price || isNaN(price) || parseFloat(price) <= 0) {
            Alert.alert("Invalid", "Please enter a valid price.");
            return;
        }
        if (!quantity || isNaN(quantity) || parseInt(quantity) < 0) {
            Alert.alert("Invalid", "Please enter a valid quantity.");
            return;
        }

        setSubmitting(true);

        const result = await addProduct({
            owner_id: selectedOwnerId,
            product_name: productName.trim(),
            category,
            price: parseFloat(price),
            quantity: parseInt(quantity),
            unit,
            is_available: isAvailable,
        });

        setSubmitting(false);

        if (result.success) {
            Alert.alert(
                "✅ Product Added Successfully!",
                `"${productName.trim()}" has been added to inventory.`,
                [
                    {
                        text: "🏠 Go to Home",
                        onPress: () => navigation.navigate("Home"),
                    },
                    {
                        text: "📦 View Products",
                        onPress: () => navigation.navigate("Products"),
                    },
                    {
                        text: "➕ Add Another",
                        onPress: resetForm,
                    },
                ]
            );
        } else {
            Alert.alert("❌ Error", result.message || "Something went wrong.");
        }
    };

    const resetForm = () => {
        setProductName("");
        setPrice("");
        setQuantity("");
        setCategory("Grain");
        setUnit("kg");
        setIsAvailable(true);
    };

    if (loadingOwners) {
        return (
            <LinearGradient colors={COLORS.gradientDark} style={styles.container}>
                <View style={styles.loaderWrap}>
                    <ActivityIndicator size="large" color={COLORS.primary} />
                    <Text style={styles.loaderText}>Loading owners...</Text>
                </View>
            </LinearGradient>
        );
    }

    if (owners.length === 0) {
        return (
            <LinearGradient colors={COLORS.gradientDark} style={styles.container}>
                <View style={styles.loaderWrap}>
                    <Text style={{ fontSize: 50, marginBottom: 16 }}>👤</Text>
                    <Text style={styles.emptyTitle}>No Owners Found</Text>
                    <Text style={styles.emptyText}>
                        You need to add a business owner before adding products.
                    </Text>
                    <TouchableOpacity
                        activeOpacity={0.85}
                        onPress={() => navigation.navigate("AddOwner")}
                    >
                        <LinearGradient
                            colors={COLORS.gradientPrimary}
                            style={styles.emptyBtn}
                        >
                            <Text style={styles.emptyBtnText}>+ Add Owner First</Text>
                        </LinearGradient>
                    </TouchableOpacity>
                </View>
            </LinearGradient>
        );
    }

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
                            <Text style={styles.headerTitle}>Add Product</Text>
                            <Text style={styles.headerSubtitle}>
                                Add a new item to store inventory
                            </Text>
                        </View>
                    </View>

                    {/* Form */}
                    <View style={styles.formCard}>
                        {/* Select Owner */}
                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>
                                SELECT SHOP OWNER <Text style={styles.required}>*</Text>
                            </Text>
                            <ScrollView
                                horizontal
                                showsHorizontalScrollIndicator={false}
                                contentContainerStyle={styles.ownerList}
                            >
                                {owners.map((owner) => (
                                    <TouchableOpacity
                                        key={owner.id}
                                        activeOpacity={0.8}
                                        onPress={() => setSelectedOwnerId(owner.id)}
                                    >
                                        <View
                                            style={[
                                                styles.ownerChip,
                                                selectedOwnerId === owner.id &&
                                                styles.ownerChipActive,
                                            ]}
                                        >
                                            <Text style={styles.ownerChipIcon}>🏪</Text>
                                            <Text
                                                style={[
                                                    styles.ownerChipText,
                                                    selectedOwnerId === owner.id &&
                                                    styles.ownerChipTextActive,
                                                ]}
                                                numberOfLines={1}
                                            >
                                                {owner.shop_name}
                                            </Text>
                                        </View>
                                    </TouchableOpacity>
                                ))}
                            </ScrollView>
                        </View>

                        {/* Product Name */}
                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>
                                PRODUCT NAME <Text style={styles.required}>*</Text>
                            </Text>
                            <View style={styles.inputWrapper}>
                                <Text style={styles.inputIcon}>📦</Text>
                                <TextInput
                                    style={styles.input}
                                    value={productName}
                                    onChangeText={setProductName}
                                    placeholder="e.g. Basmati Rice, Sugar, Ghee"
                                    placeholderTextColor={COLORS.textMuted}
                                    returnKeyType="next"
                                    onSubmitEditing={() => priceRef.current?.focus()}
                                />
                            </View>
                        </View>

                        {/* Category Selection */}
                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>CATEGORY</Text>
                            <View style={styles.chipGrid}>
                                {CATEGORIES.map((cat) => (
                                    <TouchableOpacity
                                        key={cat}
                                        activeOpacity={0.8}
                                        onPress={() => setCategory(cat)}
                                    >
                                        <View
                                            style={[
                                                styles.catChip,
                                                category === cat && styles.catChipActive,
                                            ]}
                                        >
                                            <Text style={styles.catChipIcon}>
                                                {CATEGORY_ICONS[cat]}
                                            </Text>
                                            <Text
                                                style={[
                                                    styles.catChipText,
                                                    category === cat && styles.catChipTextActive,
                                                ]}
                                            >
                                                {cat}
                                            </Text>
                                        </View>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </View>

                        {/* Price & Quantity Row */}
                        <View style={styles.row}>
                            <View style={[styles.inputGroup, { flex: 1 }]}>
                                <Text style={styles.label}>
                                    PRICE (Rs) <Text style={styles.required}>*</Text>
                                </Text>
                                <View style={styles.inputWrapper}>
                                    <Text style={styles.inputIcon}>💰</Text>
                                    <TextInput
                                        ref={priceRef}
                                        style={styles.input}
                                        value={price}
                                        onChangeText={setPrice}
                                        placeholder="0.00"
                                        placeholderTextColor={COLORS.textMuted}
                                        keyboardType="decimal-pad"
                                        returnKeyType="next"
                                        onSubmitEditing={() => quantityRef.current?.focus()}
                                    />
                                </View>
                            </View>

                            <View style={{ width: 12 }} />

                            <View style={[styles.inputGroup, { flex: 1 }]}>
                                <Text style={styles.label}>
                                    QUANTITY <Text style={styles.required}>*</Text>
                                </Text>
                                <View style={styles.inputWrapper}>
                                    <Text style={styles.inputIcon}>🔢</Text>
                                    <TextInput
                                        ref={quantityRef}
                                        style={styles.input}
                                        value={quantity}
                                        onChangeText={setQuantity}
                                        placeholder="0"
                                        placeholderTextColor={COLORS.textMuted}
                                        keyboardType="number-pad"
                                    />
                                </View>
                            </View>
                        </View>

                        {/* Unit Selection */}
                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>UNIT</Text>
                            <ScrollView
                                horizontal
                                showsHorizontalScrollIndicator={false}
                                contentContainerStyle={styles.unitList}
                            >
                                {UNITS.map((u) => (
                                    <TouchableOpacity
                                        key={u}
                                        activeOpacity={0.8}
                                        onPress={() => setUnit(u)}
                                    >
                                        <View
                                            style={[
                                                styles.unitChip,
                                                unit === u && styles.unitChipActive,
                                            ]}
                                        >
                                            <Text
                                                style={[
                                                    styles.unitChipText,
                                                    unit === u && styles.unitChipTextActive,
                                                ]}
                                            >
                                                {u}
                                            </Text>
                                        </View>
                                    </TouchableOpacity>
                                ))}
                            </ScrollView>
                        </View>

                        {/* Availability Toggle */}
                        <View style={styles.switchRow}>
                            <View>
                                <Text style={styles.switchLabel}>Available in Store</Text>
                                <Text style={styles.switchDesc}>
                                    {isAvailable
                                        ? "Product is available for sale"
                                        : "Product is currently not available"}
                                </Text>
                            </View>
                            <Switch
                                value={isAvailable}
                                onValueChange={setIsAvailable}
                                trackColor={{
                                    false: COLORS.bgCardLight,
                                    true: COLORS.primaryDark,
                                }}
                                thumbColor={isAvailable ? COLORS.primary : COLORS.textMuted}
                            />
                        </View>

                        {/* Submit */}
                        <TouchableOpacity
                            activeOpacity={0.85}
                            onPress={handleSubmit}
                            disabled={submitting}
                            style={{ marginTop: 8 }}
                        >
                            <LinearGradient
                                colors={
                                    submitting
                                        ? [COLORS.bgCardLight, COLORS.bgCardLight]
                                        : COLORS.gradientPrimary
                                }
                                style={styles.submitBtn}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 0 }}
                            >
                                {submitting ? (
                                    <ActivityIndicator color={COLORS.white} size="small" />
                                ) : (
                                    <Text style={styles.submitText}>Add Product</Text>
                                )}
                            </LinearGradient>
                        </TouchableOpacity>

                        <TouchableOpacity
                            onPress={resetForm}
                            style={styles.resetBtn}
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
        paddingHorizontal: 20,
        paddingTop: 55,
        paddingBottom: 40,
    },
    headerRow: {
        flexDirection: "row",
        alignItems: "center",
        marginBottom: 24,
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
    formCard: {
        backgroundColor: COLORS.bgCard,
        borderRadius: 22,
        padding: 22,
        borderWidth: 1,
        borderColor: "rgba(51, 65, 85, 0.4)",
        shadowColor: COLORS.black,
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.25,
        shadowRadius: 16,
        elevation: 10,
    },
    inputGroup: {
        marginBottom: 18,
    },
    label: {
        fontSize: 11,
        fontWeight: "700",
        color: COLORS.textSecondary,
        marginBottom: 8,
        letterSpacing: 0.5,
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
        paddingVertical: 13,
        fontSize: 15,
        color: COLORS.textPrimary,
        fontWeight: "500",
    },
    ownerList: {
        gap: 8,
    },
    ownerChip: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "rgba(15, 23, 42, 0.6)",
        paddingHorizontal: 14,
        paddingVertical: 10,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: COLORS.border,
        gap: 6,
    },
    ownerChipActive: {
        backgroundColor: "rgba(13, 148, 136, 0.2)",
        borderColor: COLORS.primary,
    },
    ownerChipIcon: {
        fontSize: 16,
    },
    ownerChipText: {
        fontSize: 13,
        color: COLORS.textSecondary,
        fontWeight: "600",
        maxWidth: 120,
    },
    ownerChipTextActive: {
        color: COLORS.primaryLight,
    },
    chipGrid: {
        flexDirection: "row",
        flexWrap: "wrap",
        gap: 8,
    },
    catChip: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "rgba(15, 23, 42, 0.6)",
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: COLORS.border,
        gap: 4,
    },
    catChipActive: {
        backgroundColor: "rgba(245, 158, 11, 0.15)",
        borderColor: COLORS.accent,
    },
    catChipIcon: {
        fontSize: 14,
    },
    catChipText: {
        fontSize: 12,
        color: COLORS.textSecondary,
        fontWeight: "600",
    },
    catChipTextActive: {
        color: COLORS.accent,
    },
    row: {
        flexDirection: "row",
    },
    unitList: {
        gap: 8,
    },
    unitChip: {
        paddingHorizontal: 16,
        paddingVertical: 9,
        borderRadius: 10,
        backgroundColor: "rgba(15, 23, 42, 0.6)",
        borderWidth: 1,
        borderColor: COLORS.border,
    },
    unitChipActive: {
        backgroundColor: "rgba(13, 148, 136, 0.2)",
        borderColor: COLORS.primary,
    },
    unitChipText: {
        fontSize: 13,
        color: COLORS.textSecondary,
        fontWeight: "600",
    },
    unitChipTextActive: {
        color: COLORS.primaryLight,
    },
    switchRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        backgroundColor: "rgba(15, 23, 42, 0.4)",
        borderRadius: 14,
        padding: 16,
        marginBottom: 18,
        borderWidth: 1,
        borderColor: COLORS.border,
    },
    switchLabel: {
        fontSize: 14,
        fontWeight: "700",
        color: COLORS.textPrimary,
        marginBottom: 2,
    },
    switchDesc: {
        fontSize: 11,
        color: COLORS.textMuted,
    },
    submitBtn: {
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
    resetBtn: {
        alignItems: "center",
        paddingVertical: 14,
        marginTop: 4,
    },
    resetText: {
        color: COLORS.textMuted,
        fontSize: 14,
        fontWeight: "500",
    },
    loaderWrap: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        paddingHorizontal: 40,
    },
    loaderText: {
        color: COLORS.textSecondary,
        fontSize: 14,
        marginTop: 12,
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
