import React, { useEffect, useState } from "react";
import {
    ScrollView,
    View,
    Text,
    TextInput,
    StyleSheet,
    TouchableOpacity,
    Modal,
    Alert,
} from "react-native";
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useLocalSearchParams, useRouter } from "expo-router";

export default function ObjectDetails() {
    const { name, subname, category } = useLocalSearchParams<{
        name: string;
        subname?: string;
        category?: string;
    }>();
    const router = useRouter();

    const [works, setWorks] = useState<any[]>([]);
    const [modalVisible, setModalVisible] = useState(false);
    const [selectedWork, setSelectedWork] = useState<any | null>(null);
    const [amount, setAmount] = useState("");

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

            let filtered = res.data;
            if (name) filtered = filtered.filter((w: any) => w.object === name);
            if (subname) filtered = filtered.filter((w: any) => w.subname === subname);
            if (category) filtered = filtered.filter((w: any) => w.category === category);

            setWorks(filtered);
        } catch (err) {
            console.error(err);
        }
    };

    useEffect(() => {
        if (name) fetchWorks();
    }, [name, subname, category]);

    const formatNumber = (num: number) =>
        num % 1 === 0 ? num.toString() : num.toFixed(2).replace(".", ",");

    // Додавання нового обсягу
    const handleAdd = async () => {
        const amountNum = Number(amount);
        if (!amount || isNaN(amountNum) || amountNum <= 0) {
            alert("Введіть правильну кількість");
            return;
        }

        const newTotal = (selectedWork.done || 0) + amountNum;
        const planned = selectedWork.volume || 0;

        const proceed = async () => {
            try {
                const headers = await getAuthHeader();
                await axios.post(
                    "https://agricon-backend-1.onrender.com/works/add",
                    { workId: selectedWork._id, amount: amountNum },
                    { headers }
                );

                setWorks(prev =>
                    prev.map(w =>
                        w._id === selectedWork._id
                            ? { ...w, done: newTotal, history: [...w.history, { amount: amountNum }] }
                            : w
                    )
                );

                setModalVisible(false);
                setAmount("");
            } catch (err) {
                console.error(err);
            }
        };

        if (newTotal > planned) {
            Alert.alert(
                "Перевищення обсягу",
                `Загальна кількість (${formatNumber(newTotal)}) перевищує договірний обсяг (${formatNumber(planned)}). Підтвердьте внесення.`,
                [
                    { text: "Скасувати", style: "cancel" },
                    { text: "Підтвердити", onPress: proceed },
                ]
            );
        } else {
            Alert.alert(
                "Підтвердження",
                `Додати ${formatNumber(amountNum)} ${selectedWork.unit}?`,
                [
                    { text: "Скасувати", style: "cancel" },
                    { text: "Підтвердити", onPress: proceed },
                ]
            );
        }
    };

    // Редагування останнього запису цього користувача
    const handleEdit = async () => {
        const amountNum = Number(amount);
        if (!amount || isNaN(amountNum) || amountNum < 0) {
            alert("Введіть правильну кількість");
            return;
        }

        try {
            const headers = await getAuthHeader();
            const res = await axios.put(
                "https://agricon-backend-1.onrender.com/works/edit-last",
                { workId: selectedWork._id, amount: amountNum },
                { headers }
            );

            // Оновлюємо локально, зберігаючи всю історію
            setWorks(prev =>
                prev.map(w =>
                    w._id === selectedWork._id ? { ...w, done: res.data.work.done, history: res.data.work.history } : w
                )
            );

            setModalVisible(false);
            setAmount("");
        } catch (err: any) {
            console.error(err);
            alert(err.response?.data?.message || "Помилка при редагуванні");
        }
    };

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity
                    style={styles.backButton}
                    onPress={() => router.push("/WorkInputForm")}
                >
                    <Text style={styles.backText}>⬅ Назад</Text>
                </TouchableOpacity>

                <View style={styles.headerTextBlock}>
                    <Text style={styles.title}>{name}</Text>
                    {subname && <Text style={styles.subTitle}>{subname}</Text>}
                    {category && <Text style={styles.categoryText}>Категорія: {category}</Text>}
                </View>
            </View>

            <ScrollView
                style={styles.scroll}
                contentContainerStyle={{ paddingTop: 180, paddingBottom: 120 }}
            >
                {works.length === 0 ? (
                    <Text style={styles.emptyText}>Немає доступних робіт</Text>
                ) : (
                    works.map(work => (
                        <TouchableOpacity
                            key={work._id}
                            style={styles.workRow}
                            onPress={() => {
                                setSelectedWork(work);
                                setAmount(work.history?.length ? work.history[work.history.length - 1].amount.toString() : "");
                                setModalVisible(true);
                            }}
                        >
                            <Text style={styles.workName}>{work.name}</Text>
                            <Text style={styles.workInfo}>
                                Виконано: {formatNumber(work.done || 0)} {work.unit}
                            </Text>
                        </TouchableOpacity>
                    ))
                )}
            </ScrollView>

            <Modal
                visible={modalVisible}
                transparent
                animationType="fade"
                onRequestClose={() => setModalVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContainer}>
                        <Text style={styles.modalTitle}>{selectedWork?.name || "Робота"}</Text>
                        <Text>Виконано: {formatNumber(selectedWork?.done || 0)} {selectedWork?.unit}</Text>

                        <TextInput
                            style={styles.input}
                            placeholder="Введіть кількість"
                            keyboardType="numeric"
                            value={amount.replace(".", ",")}
                            onChangeText={text => setAmount(text.replace(",", "."))}
                        />

                        <View style={styles.modalButtons}>
                            <TouchableOpacity
                                style={[styles.button, { backgroundColor: "#999" }]}
                                onPress={() => setModalVisible(false)}
                            >
                                <Text style={styles.buttonText}>Скасувати</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={[styles.button, { backgroundColor: "#c4001d" }]}
                                onPress={handleAdd}
                            >
                                <Text style={[styles.buttonText, { color: "#fff" }]}>Додати</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={[styles.button, { backgroundColor: "#006400" }]}
                                onPress={handleEdit}
                            >
                                <Text style={[styles.buttonText, { color: "#fff" }]}>Редагувати</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: "#fff" },
    scroll: { flex: 1, paddingHorizontal: 16 },
    header: {
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        backgroundColor: "#fff",
        paddingTop: 40,
        paddingBottom: 10,
        paddingHorizontal: 16,
        borderBottomWidth: 1,
        borderBottomColor: "#ddd",
        zIndex: 10,
    },
    backButton: { marginBottom: 8, alignSelf: "flex-start" },
    backText: { fontSize: 16, color: "#c4001d", fontWeight: "600" },
    headerTextBlock: { marginTop: 4 },
    title: { fontSize: 22, fontWeight: "bold", color: "#c4001d" },
    subTitle: { fontSize: 18, fontWeight: "600", color: "#333" },
    categoryText: { fontSize: 16, color: "#555", marginTop: 2 },
    workRow: {
        backgroundColor: "#eee",
        marginBottom: 12,
        borderRadius: 8,
        padding: 12,
    },
    workName: { fontSize: 16, color: "#333", fontWeight: "600" },
    workInfo: { fontSize: 14, color: "#555", marginTop: 4 },
    modalOverlay: {
        flex: 1,
        backgroundColor: "rgba(0,0,0,0.5)",
        justifyContent: "center",
        alignItems: "center",
    },
    modalContainer: {
        backgroundColor: "#fff",
        padding: 20,
        borderRadius: 12,
        width: "85%",
        shadowColor: "#000",
        shadowOpacity: 0.3,
        shadowRadius: 10,
        elevation: 5,
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: "700",
        color: "#c4001d",
        marginBottom: 10,
    },
    input: {
        borderWidth: 1,
        borderColor: "#c4001d",
        borderRadius: 6,
        marginTop: 10,
        paddingHorizontal: 8,
        height: 40,
    },
    modalButtons: {
        flexDirection: "row",
        justifyContent: "space-between",
        marginTop: 16,
    },
    button: {
        flex: 1,
        marginHorizontal: 5,
        paddingVertical: 10,
        borderRadius: 8,
        alignItems: "center",
    },
    buttonText: { fontSize: 16, fontWeight: "600" },
    emptyText: { fontSize: 16, color: "#333", marginTop: 20, textAlign: "center" },
});
