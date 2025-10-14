// app/_layout.tsx
import { Stack } from "expo-router";
import { DarkTheme, DefaultTheme, ThemeProvider } from "@react-navigation/native";
import { StatusBar } from "expo-status-bar";
import "react-native-reanimated";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { useEffect, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

export default function RootLayout() {
    const colorScheme = useColorScheme();
    const [isLoggedIn, setIsLoggedIn] = useState<boolean | null>(null);

    useEffect(() => {
        const checkToken = async () => {
            const token = await AsyncStorage.getItem("token");
            setIsLoggedIn(!!token); // true якщо токен є
        };
        checkToken();
    }, []);

    if (isLoggedIn === null) {
        return null; // можна додати спінер, поки перевіряємо
    }

    return (
        <ThemeProvider value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
            <Stack screenOptions={{ headerShown: false }}>
                {!isLoggedIn ? (
                    <Stack.Screen name="LoginScreen" />
                ) : (
                    <Stack.Screen name="(tabs)" />
                )}
            </Stack>
            <StatusBar style="auto" />
        </ThemeProvider>
    );
}
