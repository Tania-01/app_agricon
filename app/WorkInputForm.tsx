import React, { useEffect, useState, useRef } from "react";
import {
    ScrollView,
    Text,
    TouchableOpacity,
    StyleSheet,
    Animated,
    View
} from "react-native";
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";

function WavyBackground({ children }: any) {
    const anim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        Animated.loop(
            Animated.timing(anim, {
                toValue: 1,
                duration: 8000,
                useNativeDriver: true,
            })
        ).start();
    }, []);

    const translateX1 = anim.interpolate({
        inputRange: [0, 1],
        outputRange: [0, 120], // перша хвиля вправо
    });

    const translateX2 = anim.interpolate({
        inputRange: [0, 1],
        outputRange: [0, -120], // друга хвиля вліво
    });

    return (
        <View style={{ flex: 1 }}>
            {/* Нижній шар */}
            <Animated.View
                style={[
                    StyleSheet.absoluteFillObject,
                    { transform: [{ translateX: translateX1 }] }
                ]}
            >
                <LinearGradient
                    colors={["#ffb3b3", "#ffe6cc"]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={StyleSheet.absoluteFillObject}
                />
            </Animated.View>

            {/* Верхній напівпрозорий шар */}
            <Animated.View
                style={[
                    StyleSheet.absoluteFillObject,
                    { opacity: 0.5, transform: [{ translateX: translateX2 }] }
                ]}
            >
                <LinearGradient
                    colors={["#ffe6cc", "#fff7e6"]}
                    start={{ x: 1, y: 0 }}
                    end={{ x: 0, y: 1 }}
                    style={StyleSheet.absoluteFillObject}
                />
            </Animated.View>

            {/* Контент */}
            <View style={{ flex: 1 }}>
                {children}
            </View>
        </View>
    );
}

export default function WorksScreen() {
    const [works, setWorks] = useState<any[]>([]);
    const [selectedCity, setSelectedCity] = useState<string | null>(null);
    const [selectedObject, setSelectedObject] = useState<string | null>(null);
    const [selectedSubname, setSelectedSubname] = useState<string | null>(null);

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
        ? Array.from(new Set(works.filter((w) => w.city === selectedCity).map((w) => w.object)))
        : [];
    const subnames = selectedObject
        ? Array.from(new Set(works.filter((w) => w.object === selectedObject && w.subname).map((w) => w.subname)))
        : [];
    const categories = selectedSubname
        ? Array.from(new Set(works.filter(w => w.object === selectedObject && w.subname === selectedSubname && w.category).map(w => w.category)))
        : selectedObject && !selectedSubname
            ? Array.from(new Set(works.filter(w => w.object === selectedObject && w.category).map(w => w.category)))
            : [];

    const goToWorks = (params: { name: string; subname?: string | null; category?: string | null }) => {
        router.push({
            pathname: "/object/[name]",
            params: {
                name: params.name,
                subname: params.subname ?? "",
                category: params.category ?? "",
            },
        });
    };

    const handleBack = () => {
        if (selectedSubname) setSelectedSubname(null);
        else if (selectedObject) setSelectedObject(null);
        else if (selectedCity) setSelectedCity(null);
        else router.back();
    };

    const renderButton = (label: string, onPress: () => void) => (
        <TouchableOpacity style={styles.bigButton} onPress={onPress} activeOpacity={0.7}>
            <Text style={styles.bigButtonText}>{label}</Text>
        </TouchableOpacity>
    );

    return (
        <WavyBackground>
            <ScrollView style={styles.container}>
                <TouchableOpacity style={styles.backButton} onPress={handleBack}>
                    <Text style={styles.backText}>⬅ Назад</Text>
                </TouchableOpacity>

                {!selectedCity ? (
                    <>
                        <Text style={styles.title}>Оберіть місто</Text>
                        {cities.map((city, i) => renderButton(city, () => setSelectedCity(city)))}
                    </>
                ) : !selectedObject ? (
                    <>
                        <Text style={styles.title}>Об’єкти у місті: {selectedCity}</Text>
                        {objects.map((obj, i) => renderButton(obj, () => setSelectedObject(obj)))}
                    </>
                ) : !selectedSubname && subnames.length > 0 ? (
                    <>
                        <Text style={styles.title}>Типи робіт</Text>
                        {subnames.map((sub, i) => renderButton(sub, () => setSelectedSubname(sub)))}
                    </>
                ) : categories.length > 0 ? (
                    <>
                        <Text style={styles.title}>Категорії</Text>
                        {categories.map((cat, i) =>
                            renderButton(cat, () =>
                                goToWorks({ name: selectedObject, subname: selectedSubname, category: cat })
                            )
                        )}
                    </>
                ) : (
                    selectedObject && goToWorks({ name: selectedObject, subname: selectedSubname })
                )}
            </ScrollView>
        </WavyBackground>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, padding: 25 },
    backButton: {
        marginBottom: 20,
        paddingVertical: 14,
        paddingHorizontal: 18,
        backgroundColor: "#c4001d",
        borderRadius: 12,
        alignSelf: "flex-start",
    },
    backText: { color: "#fff", fontWeight: "700", fontSize: 18 },
    title: {
        fontSize: 28,
        fontWeight: "800",
        color: "#a63c3c",
        textAlign: "center",
        marginBottom: 20,
    },
    bigButton: {
        backgroundColor: "#fff",
        borderWidth: 2,
        borderColor: "#c4001d",
        paddingVertical: 18,
        borderRadius: 14,
        marginBottom: 15,
        alignItems: "center",
    },
    bigButtonText: {
        fontSize: 18,
        fontWeight: "700",
        color: "#c4001d",
    },
});
