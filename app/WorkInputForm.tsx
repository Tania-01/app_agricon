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
            <TouchableOpacity style={styles.backButton} onPress={() => router.push("/HomeScreen")}>
                <Text style={styles.backText}>⬅ На Головну</Text>
            </TouchableOpacity>

            {!selectedCity ? (
                <>
                    <Text style={styles.title}>Місцерозташування</Text>
                    {cities.length === 0 ? (
                        <Text style={styles.emptyText}>Немає доступних міст</Text>
                    ) : (
                        cities.map((city, i) => (
                            <TouchableOpacity key={i} style={styles.bigButton} onPress={() => setSelectedCity(city)}>
                                <Text style={styles.bigButtonText}>{city}</Text>
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
                            <TouchableOpacity key={i} style={styles.bigButton} onPress={() => setSelectedObject(obj)}>
                                <Text style={styles.bigButtonText}>{obj}</Text>
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
                            style={styles.bigButton}
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
                            <Text style={styles.bigButtonText}>{sub}</Text>
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
                            style={styles.bigButton}
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
                            <Text style={styles.bigButtonText}>{cat}</Text>
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
    container: { flex: 1, padding: 20, backgroundColor: "#fff" },

    // 🔹 Кнопка "Назад" зроблена великою, з тінню і плавною взаємодією
    backButton: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#f0f0f0",
        borderRadius: 12,
        paddingVertical: 14,
        paddingHorizontal: 25,
        alignSelf: "flex-start",
        marginTop: 25,
        marginBottom: 25,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
        elevation: 4,
    },
    backCityButton: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#f0f0f0",
        borderRadius: 12,
        paddingVertical: 12,
        paddingHorizontal: 20,
        alignSelf: "flex-start",
        marginTop: 20,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 3,
        elevation: 3,
    },
    backText: { fontSize: 18, color: "#c4001d", fontWeight: "700" },

    title: { fontSize: 26, fontWeight: "bold", marginBottom: 25, color: "#c4001d", textAlign: "center" },

    bigButton: {
        backgroundColor: "#fff",
        borderWidth: 2,
        borderColor: "#c4001d",
        paddingVertical: 20,
        borderRadius: 12,
        marginBottom: 15,
        alignItems: "center",
        justifyContent: "center",
        shadowColor: "#000",
        shadowOpacity: 0.1,
        shadowRadius: 6,
        elevation: 3,
    },
    bigButtonText: { fontSize: 20, color: "#c4001d", fontWeight: "700", textAlign: "center" },
    emptyText: { fontSize: 18, color: "#555", marginBottom: 12, textAlign: "center" },
});
