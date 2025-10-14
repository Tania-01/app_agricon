import React from "react";
import { TouchableOpacity, Text, Alert, StyleSheet } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";

export default function LogoutButton() {
    const router = useRouter();

    const handleLogout = async () => {
        try {
            await AsyncStorage.removeItem("token"); // 🔹 Видаляємо токен
            router.replace("/LoginScreen"); // 🔹 Повертаємо на екран логіну
        } catch (error) {
            console.error("Помилка при виході:", error);
            Alert.alert("Помилка", "Не вдалося вийти з акаунта");
        }
    };

    return (
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <Text style={styles.logoutText}>Вийти</Text>
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    logoutButton: {
        backgroundColor: "#c4001d",
        padding: 10,
        borderRadius: 8,
        alignItems: "center",
        marginTop: 20,
    },
    logoutText: {
        color: "#fff",
        fontSize: 16,
        fontWeight: "bold",
    },
});
