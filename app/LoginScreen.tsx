import React, { useState, useEffect } from "react";
import {
    View,
    Text,
    TextInput,
    Alert,
    StyleSheet,
    TouchableOpacity,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
} from "react-native";
import axios from "axios";
import { useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";

const LoginScreen = () => {
    const router = useRouter();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [rememberMe, setRememberMe] = useState(false);

    useEffect(() => {
        const loadSavedData = async () => {
            const savedEmail = await AsyncStorage.getItem("savedEmail");
            const savedPassword = await AsyncStorage.getItem("savedPassword");
            if (savedEmail && savedPassword) {
                setEmail(savedEmail);
                setPassword(savedPassword);
                setRememberMe(true);
            }
        };
        loadSavedData();
    }, []);

    const handleLogin = async () => {
        if (!email || !password) {
            Alert.alert("Помилка", "Введіть email та пароль");
            return;
        }

        try {
            setLoading(true);
            const res = await axios.post(
                "https://agricon-backend-1.onrender.com/works/sign-in",
                { email, password }
            );

            const { token } = res.data;
            if (!token) {
                Alert.alert("Помилка", "Сервер не повернув токен");
                return;
            }

            await AsyncStorage.setItem("token", token);

            if (rememberMe) {
                await AsyncStorage.setItem("savedEmail", email);
                await AsyncStorage.setItem("savedPassword", password);
            } else {
                await AsyncStorage.removeItem("savedEmail");
                await AsyncStorage.removeItem("savedPassword");
            }

            Alert.alert("Успіх", "Вхід виконано");
            router.push("/HomeScreen");
        } catch (err: any) {
            console.error(err.response?.data || err.message);
            Alert.alert("Помилка", err.response?.data?.message || "Не вдалося увійти");
        } finally {
            setLoading(false);
        }
    };

    return (
        <KeyboardAvoidingView
            style={{ flex: 1 }}
            behavior={Platform.OS === "ios" ? "padding" : "height"}
        >
            <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
                <Text style={styles.title}>Вхід</Text>

                <TextInput
                    style={styles.input}
                    placeholder="Email"
                    placeholderTextColor="#a94442"
                    value={email}
                    autoCapitalize="none"
                    onChangeText={setEmail}
                />

                <View style={styles.passwordContainer}>
                    <TextInput
                        style={[styles.input, { flex: 1 }]}
                        placeholder="Пароль"
                        placeholderTextColor="#a94442"
                        value={password}
                        secureTextEntry={!showPassword}
                        onChangeText={setPassword}
                    />
                    <TouchableOpacity
                        onPress={() => setShowPassword(!showPassword)}
                        style={styles.showButton}
                    >
                        <Text style={styles.showButtonText}>
                            {showPassword ? "Сховати" : "Показати"}
                        </Text>
                    </TouchableOpacity>
                </View>

                <TouchableOpacity
                    style={styles.rememberContainer}
                    onPress={() => setRememberMe(!rememberMe)}
                >
                    <View
                        style={[
                            styles.checkbox,
                            rememberMe && { backgroundColor: "#c4001d" },
                        ]}
                    />
                    <Text style={styles.rememberText}>Запам’ятати мене</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={styles.button}
                    onPress={handleLogin}
                    disabled={loading}
                >
                    <Text style={styles.buttonText}>
                        {loading ? "Завантаження..." : "Увійти"}
                    </Text>
                </TouchableOpacity>
            </ScrollView>
        </KeyboardAvoidingView>
    );
};

const styles = StyleSheet.create({
    container: {
        flexGrow: 1,
        justifyContent: "center",
        padding: 20,
        backgroundColor: "#fff",
    },
    title: {
        fontSize: 28,
        fontWeight: "bold",
        marginBottom: 30,
        textAlign: "center",
        color: "#c4001d",
    },
    input: {
        borderWidth: 1,
        borderColor: "#c4001d",
        borderRadius: 8,
        paddingHorizontal: 12,
        paddingVertical: 10,
        fontSize: 16,
        color: "#000",
        marginBottom: 15,
    },
    passwordContainer: {
        flexDirection: "row",
        alignItems: "center",
        marginBottom: 20,
    },
    showButton: {
        marginLeft: 10,
        paddingHorizontal: 8,
        paddingVertical: 10,
    },
    showButtonText: {
        color: "#c4001d",
        fontWeight: "bold",
    },
    rememberContainer: {
        flexDirection: "row",
        alignItems: "center",
        marginBottom: 20,
    },
    checkbox: {
        width: 20,
        height: 20,
        borderWidth: 2,
        borderColor: "#c4001d",
        borderRadius: 4,
        marginRight: 10,
    },
    rememberText: {
        fontSize: 16,
        color: "#000",
    },
    button: {
        backgroundColor: "#c4001d",
        paddingVertical: 12,
        borderRadius: 8,
        alignItems: "center",
    },
    buttonText: {
        color: "#fff",
        fontSize: 18,
        fontWeight: "bold",
    },
});

export default LoginScreen;
