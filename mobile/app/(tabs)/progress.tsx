import { View, StyleSheet, ScrollView } from 'react-native';
import { Card, Text, Appbar, useTheme } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import ProtectedRoute from '../../components/ProtectedRoute';
import { designTokens } from '../../theme';

export default function ProgressScreen() {
    const theme = useTheme();

    return (
        <ProtectedRoute>
            <View
                style={[
                    styles.container,
                    { backgroundColor: theme.colors.background },
                ]}
            >
                <Appbar.Header elevated>
                    <Appbar.Content
                        title="My Progress"
                        titleStyle={styles.headerTitle}
                    />
                </Appbar.Header>

                <ScrollView
                    style={styles.scrollView}
                    contentContainerStyle={styles.scrollContent}
                >
                    <Card style={styles.emptyCard} mode="outlined">
                        <Card.Content style={styles.emptyContent}>
                            <MaterialCommunityIcons
                                name="chart-line"
                                size={64}
                                color={theme.colors.onSurfaceVariant}
                                style={styles.emptyIcon}
                            />
                            <Text
                                variant="titleLarge"
                                style={styles.emptyTitle}
                            >
                                To Be Implemented
                            </Text>
                            <Text variant="bodyMedium" style={styles.emptyText}>
                                This feature will be implemented by students.
                            </Text>
                        </Card.Content>
                    </Card>
                </ScrollView>
            </View>
        </ProtectedRoute>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        padding: designTokens.spacing.xl,
        paddingBottom: designTokens.spacing.xxxl,
    },
    headerTitle: {
        fontWeight: '600',
        fontSize: 20,
    },
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
