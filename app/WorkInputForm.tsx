import React, { useEffect, useState } from "react";
import { ScrollView, Text, TouchableOpacity, StyleSheet } from "react-native";
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";

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

    // 🔹 автоматичний перехід якщо немає subname або category
    useEffect(() => {
        if (works.length > 0 && selectedObject) {
            const objectWorks = works.filter((w) => w.object === selectedObject);
            const hasNoSubnameOrCategory = objectWorks.some(
                (w) =>
                    !w.subname ||
                    w.subname.trim() === "" ||
                    !w.category ||
                    w.category.trim() === ""
            );

            if (hasNoSubnameOrCategory) {
                router.push({
                    pathname: "/object/[name]",
                    params: { name: selectedObject },
                });
            }
        }
    }, [works, selectedObject]);

    // 🔹 фільтри
    const cities = Array.from(new Set(works.map((w) => w.city)));
    const objects = selectedCity
        ? Array.from(new Set(works.filter((w) => w.city === selectedCity).map((w) => w.object)))
        : [];
    const subnames = selectedObject
        ? Array.from(new Set(works.filter((w) => w.object === selectedObject).map((w) => w.subname)))
        : [];
    const categories = selectedSubname
        ? Array.from(
            new Set(
                works
                    .filter((w) => w.object === selectedObject && w.subname === selectedSubname)
                    .map((w) => w.category)
                    .filter(Boolean)
            )
        )
        : [];

    return (
        <ScrollView style={styles.container}>
            {/* 🔹 Назад */}
            <TouchableOpacity style={styles.backButton} onPress={() => router.push("/HomeScreen")}>
                <Text style={styles.backText}>⬅ Назад</Text>
            </TouchableOpacity>

            {!selectedCity ? (
                <>
                    <Text style={styles.title}>Місцерозташування</Text>
                    {cities.length === 0 ? (
                        <Text style={styles.emptyText}>Немає доступних міст</Text>
                    ) : (
                        cities.map((city, i) => (
                            <TouchableOpacity key={i} style={styles.objectButton} onPress={() => setSelectedCity(city)}>
                                <Text style={styles.objectText}>{city}</Text>
                            </TouchableOpacity>
                        ))
                    )}
                </>
            ) : !selectedObject ? (
                <>
                    <Text style={styles.title}>Об’єкти у місті: {selectedCity}</Text>
                    {objects.length === 0 ? (
                        <Text style={styles.emptyText}>Немає об’єктів у цьому місті</Text>
                    ) : (
                        objects.map((obj, i) => (
                            <TouchableOpacity key={i} style={styles.objectButton} onPress={() => setSelectedObject(obj)}>
                                <Text style={styles.objectText}>{obj}</Text>
                            </TouchableOpacity>
                        ))
                    )}
                    <TouchableOpacity style={styles.backCityButton} onPress={() => setSelectedCity(null)}>
                        <Text style={styles.backText}>⬅ Повернутись до міст</Text>
                    </TouchableOpacity>
                </>
            ) : !selectedSubname ? (
                <>
                    <Text style={styles.title}>Типи робіт для об’єкта: {selectedObject}</Text>
                    {subnames.map((sub, i) => (
                        <TouchableOpacity
                            key={i}
                            style={styles.objectButton}
                            onPress={() => {
                                const hasCategory = works.some(
                                    (w) => w.object === selectedObject && w.subname === sub && w.category
                                );
                                if (!hasCategory) {
                                    router.push({
                                        pathname: "/object/[name]",
                                        params: { name: selectedObject, subname: sub },
                                    });
                                } else {
                                    setSelectedSubname(sub);
                                }
                            }}
                        >
                            <Text style={styles.objectText}>{sub}</Text>
                        </TouchableOpacity>
                    ))}
                    <TouchableOpacity style={styles.backCityButton} onPress={() => setSelectedObject(null)}>
                        <Text style={styles.backText}>⬅ Повернутись до об’єктів</Text>
                    </TouchableOpacity>
                </>
            ) : categories.length > 0 ? (
                <>
                    <Text style={styles.title}>Категорії для: {selectedSubname}</Text>
                    {categories.map((cat, i) => (
                        <TouchableOpacity
                            key={i}
                            style={styles.objectButton}
                            onPress={() =>
                                router.push({
                                    pathname: "/object/[name]",
                                    params: {
                                        name: selectedObject,
                                        subname: selectedSubname,
                                        category: cat,
                                    },
                                })
                            }
                        >
                            <Text style={styles.objectText}>{cat}</Text>
                        </TouchableOpacity>
                    ))}
                    <TouchableOpacity style={styles.backCityButton} onPress={() => setSelectedSubname(null)}>
                        <Text style={styles.backText}>⬅ Повернутись до типів робіт</Text>
                    </TouchableOpacity>
                </>
            ) : (
                router.push({
                    pathname: "/object/[name]",
                    params: { name: selectedObject, subname: selectedSubname },
                })
            )}
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, padding: 16, backgroundColor: "#fff" },
    backButton: { marginTop: 25, marginBottom: 16, padding: 8, alignSelf: "flex-start" },
    backCityButton: { marginTop: 20, padding: 8, alignSelf: "flex-start" },
    backText: { fontSize: 16, color: "#c4001d", fontWeight: "600" },
    title: { fontSize: 24, fontWeight: "bold", marginBottom: 20, color: "#c4001d" },
    objectButton: {
        backgroundColor: "#fff",
        borderWidth: 1,
        borderColor: "#c4001d",
        padding: 12,
        borderRadius: 8,
        marginBottom: 12,
    },
    objectText: { fontSize: 18, color: "#c4001d", fontWeight: "600" },
    emptyText: { fontSize: 16, color: "#333", marginBottom: 12 },
});
