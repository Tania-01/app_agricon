import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface SummaryCardProps {
    title: string;
    value: string;
    unit?: string;
    backgroundColor?: string;
}

const SummaryCard: React.FC<SummaryCardProps> = ({
                                                     title,
                                                     value,
                                                     unit,
                                                     backgroundColor = '#F2F2F2',
                                                 }) => {
    return (
        <View style={[styles.card, { backgroundColor }]}>
            <Text style={styles.title}>{title}</Text>
            <Text style={styles.value}>
                {value}
                {unit && <Text style={styles.unit}> {unit}</Text>}
            </Text>
        </View>
    );
};

const styles = StyleSheet.create({
    card: {
        padding: 16,
        borderRadius: 12,
        marginVertical: 8,
        shadowColor: '#000',
        shadowOpacity: 0.05,
        shadowOffset: { width: 0, height: 2 },
        elevation: 2,
    },
    title: {
        fontSize: 14,
        color: '#666',
        marginBottom: 4,
    },
    value: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#333',
    },
    unit: {
        fontSize: 16,
        fontWeight: 'normal',
        color: '#555',
    },
});

export default SummaryCard;
