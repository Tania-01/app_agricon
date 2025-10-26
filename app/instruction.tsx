import React, { useState } from 'react';
import {
    ScrollView,
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    LayoutAnimation,
    Platform,
    UIManager,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';

if (Platform.OS === 'android') {
    UIManager.setLayoutAnimationEnabledExperimental &&
    UIManager.setLayoutAnimationEnabledExperimental(true);
}

export default function InstructionsScreen() {
    const navigation = useNavigation();
    const [expandedSections, setExpandedSections] = useState<Record<number, boolean>>({});

    const sections = [
        {
            title: '1. Головний екран',
            content: `
- Подача об’єму виконаних робіт – перейти до списку міст та об’єктів, де можна внести або редагувати обсяг робіт.
- Звіти – генерація Excel звітів.
- Змінити пароль – змінити пароль акаунта.
- Вийти з акаунта – вихід з додатку з підтвердженням.
      `,
        },
        {
            title: '2. Сторінка об’єктів',
            content: `
- Вибір міста → об’єкта → типу робіт → категорії.
- Використовуйте кнопки «⬅ Повернутись…» для навігації назад.
- Якщо об’єкт не має subname або category, відбудеться автоматичний перехід на сторінку деталей об’єкта.
      `,
        },
        {
            title: '3. Сторінка деталей об’єкта',
            content: `
- Перегляд робіт: показує виконані обсяги.
- Додавання обсягу: натисніть роботу → введіть кількість → підтвердьте «Додати».
- Редагування останнього запису: натисніть «Редагувати».
- Натисніть «⬅ Назад», щоб повернутись на сторінку об’єктів.
      `,
        },
        {
            title: '4. Сторінка звітів',
            content: `
- Вибір міста та об’єкта.
- Вибір періоду звіту: за місяць або за весь час.
- Натисніть «Завантажити Excel» для експорту.
- Використовуйте «⬅ Повернутись…» для зміни об’єкта або періоду.
      `,
        },
        {
            title: '5. Зміна пароля',
            content: `
- Введіть старий пароль, новий пароль та підтвердження.
- Натисніть «Змінити пароль».
- Після успіху отримаєте підтвердження.
      `,
        },
        {
            title: '6. Вихід з додатку',
            content: `
- Натисніть «Вийти з акаунта».
- Підтвердіть вихід у спливаючому вікні.
- Після виходу потрапите на екран входу.
      `,
        },
    ];

    const toggleSection = (index: number) => {
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        setExpandedSections(prev => ({ ...prev, [index]: !prev[index] }));
    };

    return (
        <ScrollView style={styles.container} contentContainerStyle={{ padding: 16 }}>
            <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
                <Text style={styles.backText}>⬅ Назад</Text>
            </TouchableOpacity>

            <Text style={styles.header}>Інтерактивна інструкція користувача</Text>

            {sections.map((section, index) => (
                <View key={index} style={styles.section}>
                    <TouchableOpacity onPress={() => toggleSection(index)}>
                        <Text style={styles.title}>{section.title}</Text>
                    </TouchableOpacity>
                    {expandedSections[index] && (
                        <View style={styles.contentContainer}>
                            <Text style={styles.text}>{section.content.trim()}</Text>
                        </View>
                    )}
                </View>
            ))}

            <Text style={styles.footer}>Ця інструкція допоможе швидко орієнтуватись у додатку.</Text>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
        paddingTop: Platform.OS === 'ios' ? 60 : 40, // 🔹 Відступ зверху
    },
    backButton: {
        alignSelf: 'flex-start',
        backgroundColor: '#c4001d',
        borderRadius: 12,
        paddingVertical: 10,
        paddingHorizontal: 18,
        marginBottom: 20,
    },
    backText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
    },
    header: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#c4001d',
        marginBottom: 20,
        textAlign: 'center',
    },
    section: {
        marginBottom: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#ccc',
        paddingBottom: 10,
    },
    title: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#c4001d',
    },
    contentContainer: { marginTop: 8 },
    text: {
        fontSize: 16,
        color: '#333',
        lineHeight: 22,
    },
    footer: {
        fontSize: 16,
        color: '#555',
        textAlign: 'center',
        marginVertical: 20,
    },
});
