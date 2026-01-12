import React, { useEffect, useState, useRef } from 'react';
import {
    View,
    StyleSheet,
    TouchableOpacity,
    Text,
    Alert,
    Platform,
    Linking,
    Animated,
    ImageBackground,
    Modal
} from 'react-native';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import DeviceInfo from 'react-native-device-info';
import axios from 'axios';

const IOS_APP_URL = 'https://apps.apple.com/us/app/agriconapp/id6754009747';
const ANDROID_APP_URL =
    'https://play.google.com/apps/internaltest/4701456739223788358';

const HomeScreen = () => {
    const router = useRouter();

    const [appVersion, setAppVersion] = useState('');
    const [buildNumber, setBuildNumber] = useState('');
    const [latestVersion, setLatestVersion] = useState<string | null>(null);
    const [showUpdateModal, setShowUpdateModal] = useState(false);

    const scaleAnim = useRef(new Animated.Value(1)).current;

    const animatePress = () => {
        Animated.sequence([
            Animated.timing(scaleAnim, {
                toValue: 0.96,
                duration: 100,
                useNativeDriver: true
            }),
            Animated.timing(scaleAnim, {
                toValue: 1,
                duration: 100,
                useNativeDriver: true
            })
        ]).start();
    };

    useEffect(() => {
        setAppVersion(DeviceInfo.getVersion());
        setBuildNumber(DeviceInfo.getBuildNumber());

        axios
            .get('https://agricon-backend.onrender.com/version/current')
            .then(res => {
                setLatestVersion(res.data.version);

                if (res.data.version !== DeviceInfo.getVersion()) {
                    setShowUpdateModal(true);
                }
            })
            .catch(() => console.log('Не вдалося отримати версію'));
    }, []);

    const handleUpdate = async () => {
        const url = Platform.OS === 'ios' ? IOS_APP_URL : ANDROID_APP_URL;

        const supported = await Linking.canOpenURL(url);

        if (!supported) {
            Alert.alert('Помилка', 'Не вдалося відкрити сторінку оновлення');
            return;
        }

        await Linking.openURL(url);
    };

    const confirmLogout = () => {
        Alert.alert(
            'Підтвердження виходу',
            'Ви впевнені, що хочете вийти?',
            [
                { text: 'Скасувати', style: 'cancel' },
                { text: 'Так', onPress: handleLogout }
            ]
        );
    };

    const handleLogout = async () => {
        await AsyncStorage.removeItem('token');
        router.replace('/LoginScreen');
    };

    return (
        <ImageBackground
            source={require('../assets/images/bac.jpg')}
            style={styles.background}
            resizeMode="cover"
        >
            <View style={styles.overlay} />

            {/* 🔔 MODAL UPDATE */}
            <Modal
                visible={showUpdateModal}
                transparent
                animationType="fade"
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalCard}>
                        <Text style={styles.modalTitle}>
                            Доступне оновлення
                        </Text>

                        <Text style={styles.modalText}>
                            Ваша версія: {appVersion}
                        </Text>
                        <Text style={styles.modalText}>
                            Нова версія: {latestVersion}
                        </Text>

                        <TouchableOpacity
                            style={styles.modalUpdateBtn}
                            onPress={handleUpdate}
                        >
                            <Text style={styles.modalUpdateText}>
                                Оновити
                            </Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            onPress={() => setShowUpdateModal(false)}
                        >
                            <Text style={styles.modalLaterText}>
                                Оновити пізніше
                            </Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>

            {/* HEADER */}
            <View style={styles.header}>
                <Text style={styles.headerTitle}>AGRICON</Text>
                <Text style={styles.headerSubtitle}>
                    Система обліку робіт
                </Text>
            </View>

            {/* VERSION */}
            <View style={styles.versionCard}>
                <Text style={styles.versionLabel}>Поточна версія</Text>
                <Text style={styles.versionValue}>
                    {appVersion} ({buildNumber})
                </Text>
            </View>

            {/* MENU */}
            <Animated.View
                style={[
                    styles.menuContainer,
                    { transform: [{ scale: scaleAnim }] }
                ]}
            >
                <TouchableOpacity
                    style={[styles.menuItem, styles.redCard]}
                    onPress={() => {
                        animatePress();
                        router.push('/WorkInputForm');
                    }}
                >
                    <Text style={styles.menuItemTitle}>
                        Внести виконані роботи
                    </Text>
                    <Text style={styles.menuItemDesc}>
                        Подати обсяг виконаних робіт
                    </Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={[styles.menuItem, styles.whiteCard]}
                    onPress={() => {
                        animatePress();
                        router.push('/ReportScreen');
                    }}
                >
                    <Text style={[styles.menuItemTitle, styles.textRed]}>
                        Звіти
                    </Text>
                    <Text style={styles.menuItemDesc}>
                        Перегляд та експорт звітів
                    </Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={[styles.menuItem, styles.whiteCard]}
                    onPress={() => {
                        animatePress();
                        router.push('/ChangePasswordScreen');
                    }}
                >
                    <Text style={[styles.menuItemTitle, styles.textRed]}>
                        Змінити пароль
                    </Text>
                    <Text style={styles.menuItemDesc}>
                        Оновлення даних доступу
                    </Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={[styles.menuItem, styles.whiteCard]}
                    onPress={() => {
                        animatePress();
                        router.push('/instruction');
                    }}
                >
                    <Text style={[styles.menuItemTitle, styles.textRed]}>
                        Інструкція
                    </Text>
                    <Text style={styles.menuItemDesc}>
                        Коротка памʼятка по роботі
                    </Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={styles.logoutBtn}
                    onPress={confirmLogout}
                >
                    <Text style={styles.logoutText}>Вийти</Text>
                </TouchableOpacity>
            </Animated.View>
        </ImageBackground>
    );
};

export default HomeScreen;

/* ================== STYLES ================== */

const styles = StyleSheet.create({
    background: { flex: 1 },
    overlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.35)'
    },

    header: { paddingTop: 80, marginBottom: 25, alignItems: 'center' },
    headerTitle: { fontSize: 34, fontWeight: '900', color: '#fff' },
    headerSubtitle: { fontSize: 15, color: '#eee', marginTop: 4 },

    versionCard: {
        width: '88%',
        alignSelf: 'center',
        backgroundColor: 'rgba(255,255,255,0.88)',
        padding: 20,
        borderRadius: 16,
        marginBottom: 30
    },
    versionLabel: { fontSize: 15, color: '#444' },
    versionValue: { fontSize: 20, fontWeight: 'bold', color: '#111' },

    menuContainer: { width: '90%', alignSelf: 'center' },
    menuItem: {
        padding: 22,
        borderRadius: 16,
        marginBottom: 15
    },
    redCard: { backgroundColor: 'rgba(198,40,40,0.9)' },
    whiteCard: {
        backgroundColor: 'rgba(255,255,255,0.9)',
        borderWidth: 1,
        borderColor: '#C62828'
    },
    menuItemTitle: { fontSize: 18, fontWeight: '700', color: '#FFF' },
    menuItemDesc: { marginTop: 4, fontSize: 13, color: '#EEE' },
    textRed: { color: '#C62828' },

    logoutBtn: {
        backgroundColor: 'rgba(240,240,240,0.85)',
        padding: 16,
        borderRadius: 12,
        marginTop: 10,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#C62828'
    },
    logoutText: { color: '#C62828', fontWeight: 'bold', fontSize: 16 },

    /* MODAL */
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.6)',
        justifyContent: 'center',
        alignItems: 'center'
    },
    modalCard: {
        width: '85%',
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 24,
        alignItems: 'center'
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: 12
    },
    modalText: { fontSize: 14, color: '#444', marginBottom: 6 },
    modalUpdateBtn: {
        backgroundColor: '#007AFF',
        paddingVertical: 10,
        paddingHorizontal: 30,
        borderRadius: 10,
        marginTop: 15
    },
    modalUpdateText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
    modalLaterText: {
        marginTop: 15,
        color: '#777',
        fontSize: 14
    }
});
