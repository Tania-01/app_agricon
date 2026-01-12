import React, { useEffect, useState } from "react";
import {
    View,
    Text,
    StyleSheet,
    TextInput,
    Image,
    Button,
    TouchableOpacity,
    Alert
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Picker } from "@react-native-picker/picker";
import {router} from "expo-router";

export default function PhotoReport() {
    const [objects, setObjects] = useState<any[]>([]);
    const [selectedObject, setSelectedObject] = useState("");
    const [note, setNote] = useState("");
    const [imageUri, setImageUri] = useState<string | null>(null);

    const getAuthHeader = async () => {
        const token = await AsyncStorage.getItem("token");
        return { Authorization: `Bearer ${token}` };
    };

    // ===============================
    //   GET OBJECTS
    // ===============================
    const fetchObjects = async () => {
        try {
            const headers = await getAuthHeader();
            const res = await axios.get(
                "https://agricon-backend-1.onrender.com/works/full-datas",
                { headers }
            );

            const unique = Array.from(new Set(res.data.map((w: any) => w.object)))
                .map((name) => ({ _id: name, name }));

            setObjects(unique);
        } catch (err) {
            console.log("Помилка при отриманні об’єктів:", err);
        }
    };

    useEffect(() => {
        fetchObjects();
    }, []);


    const pickImage = async () => {
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            quality: 0.7,
        });
        if (!result.canceled) setImageUri(result.assets[0].uri);
    };

    const takePhoto = async () => {
        const result = await ImagePicker.launchCameraAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            quality: 0.7,
        });
        if (!result.canceled) setImageUri(result.assets[0].uri);
    };
    const uploadPhoto = async () => {
        if (!imageUri) return Alert.alert("Оберіть фото");
        if (!selectedObject) return Alert.alert("Оберіть об’єкт");

        const formData = new FormData();
        formData.append("file", {
            uri: imageUri,
            name: "photo.jpg",
            type: "image/jpeg",
        } as any);
        formData.append("note", note);

        try {
            const headers = await getAuthHeader();

            await axios.post(
                `https://agricon-backend-1.onrender.com/works/${selectedObject}/photo-report`,
                formData,
                {
                    headers: {
                        ...headers,
                        "Content-Type": "multipart/form-data",
                    },
                }
            );

            Alert.alert("Фото успішно завантажено!");

            setNote("");
            setImageUri(null);

        } catch (err: any) {
            console.log("Помилка при завантаженні фото:", err.response?.data || err);
            Alert.alert("Помилка", err.response?.data?.message || "Спробуй пізніше");
        }
    };
    const handleBack = () => {
    router.back();
    };

    return (
        <View style={styles.container}>
            <TouchableOpacity style={styles.backButton} onPress={handleBack}>
                <Text style={styles.backText}>⬅ Назад</Text>
            </TouchableOpacity>

            <Text style={styles.title}>Фото-звіт</Text>

            <Picker
                selectedValue={selectedObject}
                onValueChange={(v) => setSelectedObject(v)}
                style={styles.picker}
            >
                <Picker.Item label="Оберіть об’єкт..." value="" />
                {objects.map((obj) => (
                    <Picker.Item key={obj._id} label={obj.name} value={obj.name} />
                ))}
            </Picker>

            <Button title="📸 Камера" onPress={takePhoto} />
            <View style={{ height: 10 }} />
            <Button title="🖼 Галерея" onPress={pickImage} />

            {imageUri && (
                <Image
                    source={{ uri: imageUri }}
                    style={{ width: "100%", height: 220, marginTop: 20, borderRadius: 12 }}
                />
            )}

            <TextInput
                placeholder="Нотатка"
                value={note}
                onChangeText={setNote}
                style={styles.input}
            />

            <TouchableOpacity style={styles.uploadBtn} onPress={uploadPhoto}>
                <Text style={styles.uploadText}>Завантажити</Text>
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, padding: 20, backgroundColor: "#fafafa" },
    title: { fontSize: 24, fontWeight: "700", marginBottom: 20 },
    picker: { backgroundColor: "#fff", borderRadius: 12, marginBottom: 20 },
    input: {
        borderWidth: 1,
        borderColor: "#aaa",
        borderRadius: 10,
        padding: 10,
        marginVertical: 15,
    },
    uploadBtn: {
        backgroundColor: "#0f8f3f",
        paddingVertical: 14,
        borderRadius: 12,
        alignItems: "center",
    },
    uploadText: {
        color: "#fff",
        fontSize: 16,
        fontWeight: "700",
    },
    backButton: {
        marginTop:20,
        marginBottom: 20,
        paddingVertical: 14,
        paddingHorizontal: 18,
        backgroundColor: "#c4001d",
        borderRadius: 12,
        alignSelf: "flex-start",
    },
    backText: { color: "#fff", fontWeight: "700", fontSize: 18 },
});
