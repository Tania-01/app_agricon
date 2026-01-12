import React, { useState, useEffect, useRef } from "react";
import {
    View,
    Text,
    TextInput,
    Alert,
    StyleSheet,
    TouchableOpacity,
    KeyboardAvoidingView,
    Platform,
    ImageBackground,
    Animated,
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

    // Анімація плавної появи
    const fadeAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
        }).start();
    }, []);

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

            router.push("/HomeScreen");
        } catch (err: any) {
            Alert.alert("Помилка", err.response?.data?.message || "Не вдалося увійти");
        } finally {
            setLoading(false);
        }
    };

    return (
        <ImageBackground
            source={require("../assets/images/bac.jpg")}
            style={styles.bg}
            resizeMode="cover"
        >
            <KeyboardAvoidingView
                style={{ flex: 1 }}
                behavior={Platform.OS === "ios" ? "padding" : undefined}
            >
                <View style={styles.overlay} />

                <Animated.View
                    style={[
                        styles.centerWrapper,
                        { opacity: fadeAnim, transform: [{ scale: fadeAnim }] },
                    ]}
                >
                    {/* ЛОГО-ТЕКСТ */}
                    <Text style={styles.logoText}>AGRICON</Text>

                    {/* ФОРМА */}
                    <View style={styles.formWrapper}>
                        <Text style={styles.title}>Вхід у систему</Text>

                        <TextInput
                            style={styles.input}
                            placeholder="Email"
                            placeholderTextColor="#bdbdbd"
                            value={email}
                            autoCapitalize="none"
                            onChangeText={setEmail}
                        />

                        <View style={styles.passwordRow}>
                            <TextInput
                                style={[styles.input, { flex: 1 }]}
                                placeholder="Пароль"
                                placeholderTextColor="#bdbdbd"
                                secureTextEntry={!showPassword}
                                value={password}
                                onChangeText={setPassword}
                            />
                            <TouchableOpacity
                                onPress={() => setShowPassword(!showPassword)}
                                style={styles.showBtn}
                            >
                                <Text style={styles.showBtnText}>
                                    {showPassword ? "Сховати" : "Показати"}
                                </Text>
                            </TouchableOpacity>
                        </View>

                        <TouchableOpacity
                            style={styles.rememberRow}
                            onPress={() => setRememberMe(!rememberMe)}
                        >
                            <View style={styles.checkbox}>
                                {rememberMe && <Text style={styles.checkmark}>✔</Text>}
                            </View>
                            <Text style={styles.rememberText}>Запам’ятати мене</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.loginBtn}
                            onPress={handleLogin}
                            disabled={loading}
                        >
                            <Text style={styles.loginBtnText}>
                                {loading ? "Завантаження..." : "Увійти"}
                            </Text>
                        </TouchableOpacity>
                    </View>
                </Animated.View>
            </KeyboardAvoidingView>
        </ImageBackground>
    );
};

export default LoginScreen;

const styles = StyleSheet.create({
    bg: {
        flex: 1,
        width: "100%",
        height: "100%",
    },

    overlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: "rgba(0,0,0,0.45)",
    },

    centerWrapper: {
        flex: 1,
        width: "100%",
        justifyContent: "center",
        alignItems: "center",
        paddingHorizontal: 25,
    },

    logoText: {
        fontSize: 55,
        fontWeight: "800",
        color: "rgba(255, 255, 255, 0.85)",
        marginBottom: 50,
        textAlign: "center",
        letterSpacing: 2,
    },

    formWrapper: {
        width: "100%",
        backgroundColor: "rgba(255,255,255,0.92)",
        padding: 20,
        borderRadius: 18,
        shadowColor: "#000",
        shadowOpacity: 0.25,
        shadowRadius: 12,
        elevation: 6,
        backdropFilter: "blur(10px)",
    },

    title: {
        fontSize: 28,
        fontWeight: "800",
        color: "#c4001d",
        textAlign: "center",
        marginBottom: 20,
    },

    input: {
        backgroundColor: "white",
        borderWidth: 1.5,
        borderColor: "#c4001d",
        borderRadius: 10,
        paddingHorizontal: 14,
        paddingVertical: 12,
        fontSize: 16,
        color: "#000",
        marginBottom: 15,
    },

    passwordRow: {
        flexDirection: "row",
        alignItems: "center",
    },

    showBtn: {
        paddingHorizontal: 10,
    },

    showBtnText: {
        color: "#c4001d",
        fontWeight: "bold",
    },

    rememberRow: {
        flexDirection: "row",
        alignItems: "center",
        marginBottom: 15,
    },

    checkbox: {
        width: 22,
        height: 22,
        borderWidth: 2,
        borderColor: "#c4001d",
        borderRadius: 4,
        alignItems: "center",
        justifyContent: "center",
        marginRight: 10,
    },

    checkmark: {
        color: "#c4001d",
        fontWeight: "bold",
        fontSize: 16,
    },

    rememberText: {
        fontSize: 16,
        color: "#000",
    },

    loginBtn: {
        backgroundColor: "#c4001d",
        paddingVertical: 14,
        borderRadius: 10,
        alignItems: "center",
        marginTop: 5,
    },

    loginBtnText: {
        color: "white",
        fontSize: 18,
        fontWeight: "bold",
    },
});
