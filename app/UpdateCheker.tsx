import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, Linking, Platform, StyleSheet } from 'react-native';
import DeviceInfo from 'react-native-device-info';
import axios from 'axios';

export default function UpdateChecker() {
    const [latestVersion, setLatestVersion] = useState<string | null>(null);
    const [currentVersion, setCurrentVersion] = useState<string>('');

    useEffect(() => {
        // Поточна версія додатку
        const version = DeviceInfo.getVersion();
        const build = DeviceInfo.getBuildNumber();
        setCurrentVersion(`${version}(${build})`);

        // Отримання останньої версії з сервера
        axios.get('https://agricon-backend.onrender.com/version/current')
            .then(res => setLatestVersion(res.data.version))
            .catch(() => console.log('Не вдалося отримати версію'));
    }, []);

    const isOutdated = latestVersion && latestVersion !== currentVersion;

    const handleUpdate = () => {
        const url = Platform.OS === 'ios'
            ? 'https://apps.apple.com/us/app/agriconapp/id6754009747'  // НОВЕ ПОСИЛАННЯ ДЛЯ iOS
            : 'https://play.google.com/apps/internaltest/4701456739223788358'; // Android без змін

        Linking.openURL(url);
    };

    return (
        <View style={styles.container}>
            <Text style={styles.text}>Поточна версія: {currentVersion}</Text>
            {isOutdated && (
                <View style={styles.alertBox}>
                    <Text style={styles.alertText}>Доступне нове оновлення ({latestVersion})</Text>
                    <TouchableOpacity style={styles.button} onPress={handleUpdate}>
                        <Text style={styles.buttonText}>Оновити зараз</Text>
                    </TouchableOpacity>
                </View>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: { padding: 20 },
    text: { fontSize: 16, marginBottom: 8 },
    alertBox: { padding: 15, borderRadius: 10, backgroundColor: '#fff5e6', borderWidth: 1, borderColor: '#ffcc80' },
    alertText: { color: '#cc6600', marginBottom: 8 },
    button: { backgroundColor: '#007AFF', padding: 10, borderRadius: 8, alignItems: 'center' },
    buttonText: { color: 'white', fontWeight: 'bold' },
});
