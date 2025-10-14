'use client';

import React, { useState, useEffect } from "react";
import { View, Text, TextInput, TouchableOpacity, Alert, StyleSheet, ActivityIndicator } from "react-native";
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";

export default function ChangePasswordScreen() {
    const [newPassword, setNewPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [token, setToken] = useState<string | null>(null);
    const router = useRouter();

    // отримуємо токен з AsyncStorage
    useEffect(() => {
        const fetchToken = async () => {
            const storedToken = await AsyncStorage.getItem("token");
            setToken(storedToken);
        };
        fetchToken();
    }, []);

    const handleChangePassword = async () => {
        if (!newPassword.trim()) {
            Alert.alert("Помилка", "Введіть новий пароль");
            return;
        }

        if (!token) {
            Alert.alert("Помилка", "Користувач не авторизований");
            return;
        }

        setLoading(true);
        try {
            await axios.put(
                "https://agricon-backend-1.onrender.com/works/change-password",
                { newPassword },
                { headers: { Authorization: `Bearer ${token}` } }
            );

            Alert.alert("Успіх", "Пароль змінено");
            router.back(); // повертаємось назад
        } catch (error: any) {
            console.error(error.response?.data || error.message);
            Alert.alert(
                "Помилка",
                error.response?.data?.message || "Не вдалося змінити пароль"
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <View style={styles.container}>
            <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
                <Text style={styles.backText}>⬅ Назад</Text>
            </TouchableOpacity>
            <Text style={styles.title}>Змінити пароль</Text>

            <TextInput
                style={styles.input}
                placeholder="Новий пароль"
                secureTextEntry
                value={newPassword}
                onChangeText={setNewPassword}
            />

            <TouchableOpacity
                style={[styles.button, loading && { opacity: 0.5 }]}
                onPress={handleChangePassword}
                disabled={loading}
            >
                {loading ? (
                    <ActivityIndicator color="#fff" />
                ) : (
                    <Text style={styles.buttonText}>Змінити пароль</Text>
                )}
            </TouchableOpacity>
        </View>
    );
}


const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 20,
        backgroundColor: "#fff",
    },
    title: {
        fontSize: 22,
        fontWeight: "bold",
        marginBottom: 20,
        textAlign: "center"
    },
    input: {
        borderWidth: 1,
        borderColor: "#ccc",
        borderRadius: 8,
        padding: 12,
        marginBottom: 20
    },
    button: {
        backgroundColor: "#007AFF",
        padding: 15,
        borderRadius: 8,
        alignItems: "center"
    },
    buttonText: {
        color: "#fff",
        fontSize: 16,
        fontWeight: "600"
    },
    backButton: {
        marginTop: 25, // відступ від верхнього краю
        marginBottom: 15, // відступ між кнопкою та заголовком
        padding: 8,
        alignSelf: "flex-start",
    },
    backText: {
        fontSize: 16,
        color: "#007AFF",
        fontWeight: "600",
    },
});

