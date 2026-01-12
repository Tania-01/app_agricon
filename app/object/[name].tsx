import React, { useEffect, useState, useRef } from "react";
import {
    View,
    Text,
    TextInput,
    StyleSheet,
    TouchableOpacity,
    Modal,
    Alert,
    Animated,
    KeyboardAvoidingView,
    TouchableWithoutFeedback,
    Keyboard,
    Platform,
} from "react-native";
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useLocalSearchParams, useRouter } from "expo-router";

/* -------------------- CARD -------------------- */
function WorkItem({ work, index, onPress }: any) {
    const fade = useRef(new Animated.Value(0)).current;
    const scale = useRef(new Animated.Value(0.95)).current;

    useEffect(() => {
        Animated.parallel([
            Animated.timing(fade, {
                toValue: 1,
                duration: 400,
                delay: index * 100,
                useNativeDriver: true,
            }),
            Animated.spring(scale, {
                toValue: 1,
                speed: 8,
                bounciness: 4,
                delay: index * 100,
                useNativeDriver: true,
            }),
        ]).start();
    }, []);

    const progress =
        work.volume > 0 ? Math.min((work.done / work.volume) * 100, 100) : 0;

    return (
        <Animated.View style={{ opacity: fade, transform: [{ scale }] }}>
            <TouchableOpacity style={styles.card} onPress={onPress}>
                <Text style={styles.cardTitle}>{work.name}</Text>
                <Text style={styles.cardInfo}>
                    Виконано: {work.done} {work.unit}
                </Text>
                <View style={styles.progressBar}>
                    <View style={[styles.progressInner, { width: `${progress}%` }]} />
                </View>
            </TouchableOpacity>
        </Animated.View>
    );
}

/* -------------------- SCREEN -------------------- */
export default function ObjectDetails() {
    const { name } = useLocalSearchParams();
    const router = useRouter();

    const [works, setWorks] = useState<any[]>([]);
    const [selectedWork, setSelectedWork] = useState<any>(null);
    const [modalVisible, setModalVisible] = useState(false);
    const [amount, setAmount] = useState("");
    const [isEditing, setIsEditing] = useState(false);
    const [showHint, setShowHint] = useState(false);

    const scrollY = useRef(new Animated.Value(0)).current;
    const hint = "Вводьте число з крапкою або комою, напр. 39,3";

    /* ---------------- AUTH ---------------- */
    const getAuthHeader = async () => {
        const token = await AsyncStorage.getItem("token");
        if (!token) throw new Error("No token");
        return { Authorization: `Bearer ${token}` };
    };

    /* ---------------- FETCH ---------------- */
    const fetchWorks = async () => {
        try {
            const headers = await getAuthHeader();
            const res = await axios.get(
                "https://agricon-backend-1.onrender.com/works/full-datas",
                { headers }
            );
            setWorks(res.data.filter((w: any) => w.object === name));
        } catch (e) {
            console.log(e);
        }
    };

    useEffect(() => {
        fetchWorks();
    }, [name]);

    /* ---------------- ADD ---------------- */
    const handleAdd = async () => {
        const normalized = amount.replace(",", ".");
        const num = Number(normalized);

        if (isNaN(num) || num <= 0) {
            return Alert.alert("Невірна кількість", "Введіть число, наприклад 39,3");
        }

        try {
            const headers = await getAuthHeader();
            await axios.post(
                "https://agricon-backend-1.onrender.com/works/add",
                { workId: selectedWork._id, amount: num },
                { headers }
            );
            setModalVisible(false);
            setAmount("");
            fetchWorks();
        } catch (e) {
            Alert.alert("Помилка додавання");
        }
    };

    /* ---------------- EDIT ---------------- */
    const handleEdit = async () => {
        const normalized = amount.replace(",", ".");
        const num = Number(normalized);

        if (isNaN(num) || num < 0) {
            return Alert.alert("Невірна кількість", "Введіть число, наприклад 39,3");
        }

        try {
            const headers = await getAuthHeader();
            const res = await axios.put(
                "https://agricon-backend-1.onrender.com/works/edit-last",
                { workId: selectedWork._id, amount: num },
                { headers }
            );

            setWorks(prev =>
                prev.map(w =>
                    w._id === selectedWork._id
                        ? { ...w, done: res.data.work.done, history: res.data.work.history }
                        : w
                )
            );

            setModalVisible(false);
            setAmount("");
            setIsEditing(false);
        } catch (e: any) {
            Alert.alert(e.response?.data?.message || "Помилка при редагуванні");
        }
    };

    /* ---------------- UI ---------------- */
    return (
        <View style={styles.container}>
            {/* HEADER */}
            <Animated.View style={styles.header}>
                <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
                    <Text style={styles.backText}>⬅</Text>
                </TouchableOpacity>
                <Text style={styles.headerTitle}>{name}</Text>
            </Animated.View>

            {/* LIST */}
            <Animated.ScrollView
                contentContainerStyle={{ paddingBottom: 140 }}
                onScroll={Animated.event(
                    [{ nativeEvent: { contentOffset: { y: scrollY } } }],
                    { useNativeDriver: true }
                )}
            >
                {works.map((work, i) => (
                    <WorkItem
                        key={work._id}
                        work={work}
                        index={i}
                        onPress={() => {
                            setSelectedWork(work);
                            setIsEditing(false);
                            setAmount("");
                            setModalVisible(true);
                        }}
                    />
                ))}
            </Animated.ScrollView>

            {/* MODAL */}
            <Modal visible={modalVisible} transparent animationType="fade">
                <KeyboardAvoidingView
                    behavior={Platform.OS === "ios" ? "padding" : "height"}
                    style={{ flex: 1 }}
                >
                    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
                        <View style={styles.modalOverlay}>
                            <View style={styles.modalBox}>
                                <Text style={styles.modalTitle}>
                                    {selectedWork?.name}
                                </Text>

                                {!isEditing ? (
                                    <>
                                        <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 8 }}>
                                            <TextInput
                                                style={styles.input}
                                                placeholder="Кількість (напр. 39,3)"
                                                keyboardType={Platform.OS === "ios" ? "decimal-pad" : "numeric"}
                                                value={amount}
                                                onChangeText={setAmount}
                                            />
                                            <TouchableOpacity
                                                style={styles.hintBtn}
                                                onPress={() => {
                                                    setShowHint(true);
                                                    setTimeout(() => setShowHint(false), 3000);
                                                }}
                                            >
                                                <Text>❓</Text>
                                            </TouchableOpacity>
                                        </View>

                                        {showHint && (
                                            <View style={styles.hintContainer}>
                                                <Text style={styles.hintText}>{hint}</Text>
                                            </View>
                                        )}

                                        <View style={{ flexDirection: "row", marginBottom: 10 }}>
                                            <TouchableOpacity
                                                style={[styles.grayBtn, { marginRight: 8 }]}
                                                onPress={() => setModalVisible(false)}
                                            >
                                                <Text>Скасувати</Text>
                                            </TouchableOpacity>

                                            <TouchableOpacity
                                                style={styles.redBtn}
                                                onPress={handleAdd}
                                            >
                                                <Text style={{ color: "#fff" }}>Додати</Text>
                                            </TouchableOpacity>
                                        </View>

                                        <Text style={{ marginBottom: 8, color: "#555" }}>
                                            Щоб змінити останній запис, натисніть «Редагувати».
                                        </Text>

                                        <TouchableOpacity
                                            style={[styles.greenBtn, { marginBottom: 10 }]}
                                            onPress={() => {
                                                setIsEditing(true);
                                                setAmount(
                                                    selectedWork.history?.length
                                                        ? selectedWork.history[selectedWork.history.length - 1].amount.toString()
                                                        : ""
                                                );
                                            }}
                                        >
                                            <Text style={{ color: "#fff" }}>✏️ Редагувати</Text>
                                        </TouchableOpacity>
                                    </>
                                ) : (
                                    <>
                                        <Text style={{ marginBottom: 8, color: "#555" }}>
                                            Редагування останнього запису:
                                        </Text>

                                        {/* МАЛЕНЬКИЙ INPUT */}
                                        <TextInput
                                            style={[styles.input]}
                                            keyboardType={Platform.OS === "ios" ? "decimal-pad" : "numeric"}
                                            value={amount}
                                            onChangeText={setAmount}
                                        />

                                        <View style={{ flexDirection: "row", marginTop: 80 }}>
                                            <TouchableOpacity
                                                style={[styles.grayBtn, { marginRight: 8 }]}
                                                onPress={() => setIsEditing(false)}
                                            >
                                                <Text>Скасувати</Text>
                                            </TouchableOpacity>

                                            <TouchableOpacity
                                                style={styles.greenBtn}
                                                onPress={handleEdit}
                                            >
                                                <Text style={{ color: "#fff" }}>Підтвердити</Text>
                                            </TouchableOpacity>
                                        </View>
                                    </>
                                )}
                            </View>
                        </View>
                    </TouchableWithoutFeedback>
                </KeyboardAvoidingView>
            </Modal>
        </View>
    );
}

/* ---------------- STYLES ---------------- */
const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: "#faf6f5" },

    header: {
        paddingTop: 50,
        paddingBottom: 20,
        paddingHorizontal: 20,
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
    },

    backBtn: {
        backgroundColor: "#c4001d",
        padding: 12,
        borderRadius: 14,
    },
    backText: { color: "#fff", fontSize: 20 },

    headerTitle: {
        fontSize: 26,
        fontWeight: "800",
        color: "#b12c2c",
    },

    card: {
        backgroundColor: "#fff",
        padding: 18,
        borderRadius: 18,
        marginHorizontal: 18,
        marginBottom: 16,
        elevation: 4,
    },

    cardTitle: { fontSize: 18, fontWeight: "700" },
    cardInfo: { marginTop: 6, color: "#555" },

    progressBar: {
        height: 8,
        backgroundColor: "#eee",
        borderRadius: 6,
        marginTop: 8,
        overflow: "hidden",
    },
    progressInner: {
        height: "100%",
        backgroundColor: "#c4001d",
    },

    modalOverlay: {
        flex: 1,
        backgroundColor: "rgba(0,0,0,0.45)",
        justifyContent: "center",
        alignItems: "center",
    },
    modalBox: {
        height: 350,
        width: "85%",
        backgroundColor: "#fff",
        borderRadius: 16,
        padding: 20,
        position: "relative",
    },
    modalTitle: { fontSize: 20, fontWeight: "700", marginBottom: 12 },

    input: {
        height:40,
        borderWidth: 1,
        borderColor: "#c4001d",
        borderRadius: 10,
        paddingHorizontal: 10,
        flex: 1,
    },

    grayBtn: {
        padding: 12,
        backgroundColor: "#ccc",
        borderRadius: 10,
        flex: 1,
        alignItems: "center",
    },

    redBtn: {
        padding: 12,
        backgroundColor: "#c4001d",
        borderRadius: 10,
        flex: 1,
        alignItems: "center",
    },

    greenBtn: {
        color: 'white',
        padding: 12,
        backgroundColor: "#006400",
        borderRadius: 15,
        flex: 1,
        alignItems: "center",
        marginBottom: 10,
    },

    hintContainer: {
        position: "absolute",
        top: 10,
        left: 20,
        right: 20,
        backgroundColor: "#333",
        padding: 10,
        borderRadius: 10,
        alignItems: "center",
        zIndex: 999,
    },
    hintText: {
        color: "#fff",
        fontSize: 14,
    },
    hintBtn: {
        marginLeft: 8,
        padding: 8,
        backgroundColor: "#eee",
        borderRadius: 8,
    },
});
