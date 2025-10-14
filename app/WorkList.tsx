import React from 'react';
import { View, Text } from 'react-native';

const mockData = [
    { name: 'Укладка плитки', total: 100, done: 30 },
    { name: 'Бетонування', total: 50, done: 50 },
];

const WorkList = () => {
    return (
        <View>
            {mockData.map((item, index) => (
                <View key={index} style={{ marginVertical: 8 }}>
                    <Text>{item.name}</Text>
                    <Text>Виконано: {item.done} / {item.total}</Text>
                    <Text>Залишилось: {item.total - item.done}</Text>
                </View>
            ))}
        </View>
    );
};

export default WorkList;
