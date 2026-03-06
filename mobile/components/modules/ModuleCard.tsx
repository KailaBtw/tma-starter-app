import { View, StyleSheet } from 'react-native';
import { Card, Text } from 'react-native-paper';
import { Module } from '../../types';
import { designTokens } from '../../theme';

export interface ModuleCardProps {
    module: Module;
    onPress: () => void;
}

export default function ModuleCard({ module, onPress }: ModuleCardProps) {
    return (
        <Card style={styles.card} mode="elevated" onPress={onPress}>
            <Card.Content style={styles.content}>
                <View style={styles.moduleHeader}>
                    <View style={styles.titleRow}>
                        {module.color && (
                            <View
                                style={[
                                    styles.colorIndicator,
                                    { backgroundColor: module.color },
                                ]}
                            />
                        )}
                        <Text variant="titleMedium" style={styles.title}>
                            {module.title || 'Module'}
                        </Text>
                    </View>
                </View>
                {module.description && (
                    <Text
                        variant="bodyMedium"
                        style={styles.description}
                        numberOfLines={2}
                    >
                        {module.description}
                    </Text>
                )}
            </Card.Content>
        </Card>
    );
}

const styles = StyleSheet.create({
    card: {
        marginBottom: designTokens.spacing.lg,
        borderRadius: designTokens.borderRadius.lg,
    },
    content: {
        padding: designTokens.spacing.xl,
    },
    moduleHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: designTokens.spacing.sm,
    },
    titleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    colorIndicator: {
        width: 20,
        height: 20,
        borderRadius: 10,
        marginRight: designTokens.spacing.md,
    },
    title: {
        fontWeight: '600',
        flex: 1,
    },
    description: {
        marginTop: designTokens.spacing.sm,
        opacity: 0.7,
        lineHeight: 20,
    },
});
