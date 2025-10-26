import React from 'react';
import { View, StyleSheet, TouchableOpacity, Text, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';

const HomeScreen = () => {
    const router = useRouter();

    const confirmLogout = () => {
        Alert.alert(
            "Підтвердження виходу",
            "Ви впевнені, що хочете вийти з акаунта?",
            [
                { text: "Скасувати", style: "cancel" },
                { text: "Так", onPress: handleLogout },
            ],
            { cancelable: true }
        );
    };

    const handleLogout = async () => {
        try {
            await AsyncStorage.removeItem('token');
            router.replace('/LoginScreen'); // 🔹 перекидаємо на логін
        } catch (error) {
            console.error('Помилка при виході:', error);
            Alert.alert('Помилка', 'Не вдалося вийти з акаунта');
        }
    };

    return (
        <View style={styles.container}>
            <View style={styles.buttonGrid}>
                <TouchableOpacity
                    style={[styles.button, styles.redButton]}
                    onPress={() => router.push('/WorkInputForm')}
                >
                    <Text style={styles.buttonText}>Подача об`єму виконаних робіт</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={[styles.button, styles.whiteButton]}
                    onPress={() => router.push('/ReportScreen')}
                >
                    <Text style={[styles.buttonText, { color: '#C62828' }]}>Звіти</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={[styles.button, styles.whiteButton]}
                    onPress={() => router.push('/ChangePasswordScreen')}
                >
                    <Text style={[styles.buttonText, { color: '#C62828' }]}>Змінити пароль</Text>
                </TouchableOpacity>

                {/* 🔹 Кнопка Інструкція */}
                <TouchableOpacity
                    style={[styles.button, styles.whiteButton]}
                    onPress={() => router.push('/instruction')}
                >
                    <Text style={[styles.buttonText, { color: '#C62828' }]}>Інструкція</Text>
                </TouchableOpacity>

                {/* 🔹 Кнопка виходу */}
                <TouchableOpacity
                    style={[styles.button, styles.logoutButton]}
                    onPress={confirmLogout}
                >
                    <Text style={styles.logoutText}>Вийти з акаунта</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
};

export default HomeScreen;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FFFFFF',
        justifyContent: 'flex-end',
        alignItems: 'center',
        paddingBottom: 40,
    },
    buttonGrid: {
        width: '90%',
        alignItems: 'center',
    },
    button: {
        width: '100%',
        padding: 16,
        borderRadius: 8,
        alignItems: 'center',
        marginBottom: 12,
    },
    redButton: {
        backgroundColor: '#C62828',
    },
    whiteButton: {
        backgroundColor: '#FFFFFF',
        borderWidth: 1,
        borderColor: '#C62828',
    },
    logoutButton: {
        backgroundColor: '#E0E0E0',
        borderWidth: 1,
        borderColor: '#C62828',
        marginTop: 10,
    },
    buttonText: {
        color: '#FFFFFF',
        fontWeight: 'bold',
        fontSize: 16,
    },
    logoutText: {
        color: '#C62828',
        fontWeight: 'bold',
        fontSize: 16,
    },
});
