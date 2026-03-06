import { Card, Text } from 'react-native-paper';
import { designTokens } from '../../theme';
import { StyleSheet } from 'react-native';
import { useTheme } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';

export default function EmptyCoursesCard() {
    const theme = useTheme();
    return (
        <Card style={styles.emptyCard} mode="outlined">
            <Card.Content style={styles.emptyContent}>
                <MaterialCommunityIcons
                    name="book-open-variant-outline"
                    size={64}
                    color={theme.colors.onSurfaceVariant}
                    style={styles.emptyIcon}
                />
                <Text variant="titleLarge" style={styles.emptyTitle}>
                    No Courses Yet
                </Text>
                <Text variant="bodyMedium" style={styles.emptyText}>
                    No courses have been assigned to your groups yet.
                </Text>
            </Card.Content>
        </Card>
    );
}

const styles = StyleSheet.create({
    emptyCard: {
        marginTop: designTokens.spacing.xxxl,
        borderRadius: designTokens.borderRadius.lg,
    },
    emptyContent: {
        padding: designTokens.spacing.xxxl,
        alignItems: 'center',
    },
    emptyIcon: {
        marginBottom: designTokens.spacing.lg,
        opacity: 0.5,
    },
    emptyTitle: {
        marginBottom: designTokens.spacing.sm,
        fontWeight: '600',
    },
    emptyText: {
        textAlign: 'center',
        opacity: 0.7,
    },
});
