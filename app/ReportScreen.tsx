import React, { useEffect, useState } from "react";
import {
    ScrollView,
    Text,
    TouchableOpacity,
    StyleSheet,
    ActivityIndicator,
    Alert,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as FileSystem from "expo-file-system/legacy";
import * as Sharing from "expo-sharing";
import { IconButton } from "react-native-paper";
import { useRouter } from "expo-router";
import axios from "axios";
import { LogBox } from "react-native";

LogBox.ignoreLogs(["perform input operation requires a valid sessionID"]);

export default function ReportsScreen() {
    const [works, setWorks] = useState<any[]>([]);
    const [selectedCity, setSelectedCity] = useState<string | null>(null);
    const [selectedObject, setSelectedObject] = useState<string | null>(null);
    const [selectedType, setSelectedType] = useState<"month" | "all" | null>(null);
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const getAuthHeader = async () => {
        const token = await AsyncStorage.getItem("token");
        if (!token) throw new Error("Токен не знайдено");
        return { Authorization: `Bearer ${token}` };
    };

    const fetchWorks = async () => {
        try {
            const headers = await getAuthHeader();
            const res = await axios.get(
                "https://agricon-backend-1.onrender.com/works/full-datas",
                { headers }
            );
            setWorks(res.data);
        } catch (err) {
            console.error(err);
        }
    };

    useEffect(() => {
        fetchWorks();
    }, []);

    const cities = Array.from(new Set(works.map((w) => w.city)));
    const objects = selectedCity
        ? Array.from(
            new Set(works.filter((w) => w.city === selectedCity).map((w) => w.object))
        )
        : [];

    const sanitizeObjectName = (name: string) => {
        return name.replace(/[*?:\\/\[\]]/g, "_");
    };

    const blobToBase64 = (blob: Blob): Promise<string> =>
        new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () =>
                resolve(reader.result?.toString().split(",")[1] || "");
            reader.onerror = reject;
            reader.readAsDataURL(blob);
        });

    const handleExport = async (format: "excel") => {
        if (!selectedObject || !selectedType) {
            Alert.alert("Помилка", "Виберіть об’єкт і період для звіту");
            return;
        }

        setLoading(true);

        try {
            const headers = await getAuthHeader();
            const body = {
                object: selectedObject,
                type: selectedType,
                userOnly: true,
                format,
            };

            const response = await fetch(
                "https://agricon-backend-1.onrender.com/works/report",
                {
                    method: "POST",
                    headers: { "Content-Type": "application/json", ...headers },
                    body: JSON.stringify(body),
                }
            );

            if (!response.ok) {
                const errData = await response.json().catch(() => null);
                throw new Error(errData?.message || "Помилка при створенні звіту");
            }

            const blob = await response.blob();
            const base64Data = await blobToBase64(blob);

            const safeName = sanitizeObjectName(selectedObject);
            const fileUri = `${FileSystem.documentDirectory}${safeName}_report.xlsx`;

            await FileSystem.writeAsStringAsync(fileUri, base64Data, {
                encoding: FileSystem.EncodingType.Base64,
            });

            if (await Sharing.isAvailableAsync()) {
                await Sharing.shareAsync(fileUri);
            } else {
                setTimeout(() => {
                    Alert.alert("Файл збережено", `Файл: ${fileUri}`);
                }, 100);
            }
        } catch (error: any) {
            console.error(error);
            setTimeout(() => {
                Alert.alert("Помилка", error.message || "Щось пішло не так");
            }, 100);
        } finally {
            setLoading(false);
        }
    };

    return (
        <ScrollView style={styles.container}>
            <TouchableOpacity
                style={styles.backButton}
                onPress={() => router.push("/HomeScreen")}
            >
                <Text style={styles.backText}>⬅ Назад</Text>
            </TouchableOpacity>

            {!selectedCity ? (
                <>
                    <Text style={styles.title}>Місцерозташування</Text>
                    {cities.length === 0 ? (
                        <Text style={styles.emptyText}>Немає доступних міст</Text>
                    ) : (
                        cities.map((city, i) => (
                            <TouchableOpacity
                                key={i}
                                style={styles.itemButton}
                                onPress={() => setSelectedCity(city)}
                            >
                                <Text style={styles.itemText}>{city}</Text>
                            </TouchableOpacity>
                        ))
                    )}
                </>
            ) : !selectedObject ? (
                <>
                    <Text style={styles.title}>Об’єкти в місті: {selectedCity}</Text>
                    {objects.length === 0 ? (
                        <Text style={styles.emptyText}>Немає об’єктів у цьому місті</Text>
                    ) : (
                        objects.map((obj, i) => (
                            <TouchableOpacity
                                key={i}
                                style={styles.itemButton}
                                onPress={() => setSelectedObject(obj)}
                            >
                                <Text style={styles.itemText}>{obj}</Text>
                            </TouchableOpacity>
                        ))
                    )}
                    <TouchableOpacity
                        style={styles.backCityButton}
                        onPress={() => setSelectedCity(null)}
                    >
                        <Text style={styles.backText}>⬅ Повернутись до міст</Text>
                    </TouchableOpacity>
                </>
            ) : !selectedType ? (
                <>
                    <Text style={styles.title}>Оберіть період звіту</Text>
                    <TouchableOpacity
                        style={styles.itemButton}
                        onPress={() => setSelectedType("month")}
                    >
                        <Text style={styles.itemText}>За місяць</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={styles.itemButton}
                        onPress={() => setSelectedType("all")}
                    >
                        <Text style={styles.itemText}>За весь час</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={styles.backCityButton}
                        onPress={() => setSelectedObject(null)}
                    >
                        <Text style={styles.backText}>⬅ Повернутись до об’єктів</Text>
                    </TouchableOpacity>
                </>
            ) : (
                <>
                    <Text style={styles.title}>Звіт для:</Text>
                    <Text style={styles.subtitle}>
                        {selectedObject} ({selectedType === "month" ? "За місяць" : "За весь час"})
                    </Text>

                    {loading ? (
                        <ActivityIndicator size="large" color="#c4001d" />
                    ) : (
                        <TouchableOpacity
                            style={styles.downloadButton}
                            onPress={() => handleExport("excel")}
                        >
                            <IconButton icon="microsoft-excel" size={22} iconColor="#fff" />
                            <Text style={styles.buttonText}>Завантажити Excel</Text>
                        </TouchableOpacity>
                    )}

                    <TouchableOpacity
                        style={styles.backCityButton}
                        onPress={() => setSelectedType(null)}
                    >
                        <Text style={styles.backText}>⬅ Повернутись до вибору періоду</Text>
                    </TouchableOpacity>
                </>
            )}
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, padding: 20, backgroundColor: "#fff" },

    backButton: {
        marginTop: 35,
        marginBottom: 25,
        paddingVertical: 14,
        paddingHorizontal: 22,
        alignSelf: "flex-start",
        backgroundColor: "#c4001d",
        borderRadius: 12,
    },
    backCityButton: {
        marginTop: 25,
        paddingVertical: 14,
        paddingHorizontal: 22,
        alignSelf: "flex-start",
        backgroundColor: "#c4001d",
        borderRadius: 12,
    },
    backText: { fontSize: 18, color: "#fff", fontWeight: "bold" },

    title: {
        fontSize: 26,
        fontWeight: "bold",
        marginBottom: 25,
        color: "#c4001d",
    },
    subtitle: { fontSize: 20, marginBottom: 25, color: "#444" },

    itemButton: {
        backgroundColor: "#fff",
        borderWidth: 2,
        borderColor: "#c4001d",
        paddingVertical: 18,
        paddingHorizontal: 14,
        borderRadius: 12,
        marginBottom: 16,
    },
    itemText: { fontSize: 20, color: "#c4001d", fontWeight: "600", textAlign: "center" },

    emptyText: { fontSize: 18, color: "#333", marginBottom: 12 },

    downloadButton: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#c4001d",
        paddingVertical: 16,
        borderRadius: 12,
        marginBottom: 20,
    },
    buttonText: { color: "#fff", fontSize: 18, fontWeight: "700" },
});
