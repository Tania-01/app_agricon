import React, { useEffect, useState } from "react";
import {
    ScrollView,
    Text,
    TouchableOpacity,
    StyleSheet,
    ActivityIndicator,
    Alert,
    Modal,
    View,
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
    const [periodType, setPeriodType] = useState<"currentMonth" | "all" | "specific" | null>(null);
    const [selectedMonth, setSelectedMonth] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    const [previewModal, setPreviewModal] = useState(false);
    const [previewData, setPreviewData] = useState<any[]>([]);

    const router = useRouter();

    const goBack = () => {
        if (selectedMonth) return setSelectedMonth(null);
        if (periodType) return setPeriodType(null);
        if (selectedObject) return setSelectedObject(null);
        if (selectedCity) return setSelectedCity(null);
        router.back();
    };

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
        ? Array.from(new Set(works.filter((w) => w.city === selectedCity).map((w) => w.object)))
        : [];

    const months = Array.from(
        new Set(
            works.flatMap(w =>
                w.history?.map(h => {
                    const d = new Date(h.date);
                    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
                }) || []
            )
        )
    ).sort((a, b) => (a < b ? 1 : -1));

    const sanitizeObjectName = (name) => name.replace(/[*?:\\/\[\]]/g, "_");

    const blobToBase64 = (blob: Blob): Promise<string> =>
        new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result?.toString().split(",")[1] || "");
            reader.onerror = reject;
            reader.readAsDataURL(blob);
        });

    const handleExport = async (format: "excel") => {
        if (!selectedObject || !periodType || (periodType === "specific" && !selectedMonth)) {
            Alert.alert("Помилка", "Виберіть об’єкт і період для звіту");
            return;
        }

        setLoading(true);

        try {
            const headers = await getAuthHeader();
            const body = {
                object: selectedObject,
                type: periodType,
                month: periodType === "specific" ? selectedMonth : null,
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
                Alert.alert("Файл збережено", `Файл: ${fileUri}`);
            }
        } catch (error: any) {
            console.error(error);
            Alert.alert("Помилка", error.message || "Щось пішло не так");
        } finally {
            setLoading(false);
        }
    };

    const handlePreview = () => {
        if (!selectedObject) {
            return Alert.alert("Помилка", "Оберіть об’єкт");
        }

        const objectWorks = works.filter(w => w.object === selectedObject);

        const filteredWorks = objectWorks.map(w => {
            let filteredHistory = w.history || [];

            if (periodType === "specific" && selectedMonth) {
                filteredHistory = filteredHistory.filter(h => {
                    const d = new Date(h.date);
                    const ym = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
                    return ym === selectedMonth;
                });
            }

            if (periodType === "currentMonth") {
                const now = new Date();
                const currentYearMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
                filteredHistory = filteredHistory.filter(h => {
                    const d = new Date(h.date);
                    const ym = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
                    return ym === currentYearMonth;
                });
            }

            return { ...w, history: filteredHistory };
        }).filter(w => w.history.length > 0);

        if (filteredWorks.length === 0) {
            Alert.alert("Немає даних", "За обраний період даних немає");
            return;
        }

        setPreviewData(filteredWorks);
        setPreviewModal(true);
    };

    return (
        <ScrollView style={styles.container}>
            <TouchableOpacity style={styles.backButton} onPress={goBack}>
                <Text style={styles.backText}>⬅ Назад</Text>
            </TouchableOpacity>

            {!selectedCity ? (
                <>
                    <Text style={styles.title}>Місцерозташування</Text>
                    {cities.length === 0 ? (
                        <Text style={styles.emptyText}>Немає доступних міст</Text>
                    ) : cities.map((city, i) => (
                        <TouchableOpacity
                            key={i}
                            style={styles.itemButton}
                            onPress={() => setSelectedCity(city)}
                        >
                            <Text style={styles.itemText}>{city}</Text>
                        </TouchableOpacity>
                    ))}
                </>
            ) : !selectedObject ? (
                <>
                    <Text style={styles.title}>Об’єкти в місті: {selectedCity}</Text>
                    {objects.length === 0 ? (
                        <Text style={styles.emptyText}>Немає об’єктів у цьому місті</Text>
                    ) : objects.map((obj, i) => (
                        <TouchableOpacity
                            key={i}
                            style={styles.itemButton}
                            onPress={() => setSelectedObject(obj)}
                        >
                            <Text style={styles.itemText}>{obj}</Text>
                        </TouchableOpacity>
                    ))}
                </>
            ) : !periodType ? (
                <>
                    <Text style={styles.title}>Оберіть період звіту</Text>
                    {["currentMonth", "all", "specific"].map((type) => (
                        <TouchableOpacity
                            key={type}
                            style={styles.itemButton}
                            onPress={() => setPeriodType(type as any)}
                        >
                            <Text style={styles.itemText}>
                                {type === "currentMonth" ? "За поточний місяць" :
                                    type === "all" ? "За весь час" : "Оберіть місяць"}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </>
            ) : (
                <>
                    {periodType === "specific" && (
                        <>
                            <Text style={styles.title}>Оберіть місяць</Text>
                            {months.length === 0 ? (
                                <Text style={styles.emptyText}>Немає доступних місяців</Text>
                            ) : months.map((m) => (
                                <TouchableOpacity
                                    key={m}
                                    style={[
                                        styles.itemButton,
                                        selectedMonth === m && { backgroundColor: "#c4001d" },
                                    ]}
                                    onPress={() => setSelectedMonth(m)}
                                >
                                    <Text
                                        style={[
                                            styles.itemText,
                                            selectedMonth === m && { color: "#fff" },
                                        ]}
                                    >
                                        {m}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </>
                    )}

                    <TouchableOpacity
                        style={styles.previewButton}
                        onPress={handlePreview}
                    >
                        <Text style={styles.previewText}>Попередній перегляд</Text>
                    </TouchableOpacity>

                    {(periodType !== "specific" || selectedMonth) && (
                        <>
                            <Text style={styles.title}>Звіт для: {selectedObject}</Text>
                            <Text style={styles.subtitle}>
                                {periodType === "currentMonth"
                                    ? "За поточний місяць"
                                    : periodType === "all"
                                        ? "За весь час"
                                        : selectedMonth}
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
                        </>
                    )}
                </>
            )}

            {/* PREVIEW MODAL */}
            <Modal visible={previewModal} transparent animationType="fade">
                <View style={styles.modalOverlay}>
                    <View style={styles.modalBox}>
                        <Text style={styles.modalTitle}>Попередній перегляд</Text>
                        <ScrollView>
                            {previewData.map((w) => (
                                <View key={w._id} style={{ marginBottom: 12 }}>
                                    <Text style={{ fontWeight: "700" }}>{w.name}</Text>
                                    {w.history.map((h, i) => (
                                        <Text key={i}>
                                            {new Date(h.date).toLocaleDateString()} — {h.amount} {h.unit}
                                        </Text>
                                    ))}
                                </View>
                            ))}
                        </ScrollView>
                        <TouchableOpacity
                            style={[styles.grayBtn, { marginTop: 12 }]}
                            onPress={() => setPreviewModal(false)}
                        >
                            <Text>Закрити</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
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
    backText: { fontSize: 18, color: "#fff", fontWeight: "bold" },

    title: { fontSize: 26, fontWeight: "bold", marginBottom: 25, color: "#c4001d" },
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
    buttonText: { color: "#fff", fontSize: 16, fontWeight: "700", textAlign: "center" },

    previewButton: {
        backgroundColor: "#006400",
        paddingVertical: 14,
        borderRadius: 12,
        marginBottom: 20,
    },
    previewText: { color: "#fff", fontSize: 18, fontWeight: "700", textAlign: "center" },

    modalOverlay: {
        flex: 1,
        backgroundColor: "rgba(0,0,0,0.45)",
        justifyContent: "center",
        alignItems: "center",
        padding: 20,
    },
    modalBox: {
        width: "100%",
        maxHeight: "80%",
        backgroundColor: "#fff",
        borderRadius: 16,
        padding: 20,
    },
    modalTitle: { fontSize: 20, fontWeight: "700", marginBottom: 12 },

    grayBtn: {
        padding: 12,
        backgroundColor: "#ccc",
        borderRadius: 10,
        alignItems: "center",
    },
});
