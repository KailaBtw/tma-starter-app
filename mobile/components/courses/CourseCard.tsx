import { Card, Text } from 'react-native-paper';
import { Course } from '../../types';
import { designTokens } from '../../theme';
import { View, StyleSheet } from 'react-native';
import { useTheme } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import InfoBadge from '../../components/InfoBadge';
import { API_URL } from '../../services/api';

export interface CourseCardProps {
    course: Course;
    onPress: () => void;
}

export default function CourseCard({ course, onPress }: CourseCardProps) {
    const theme = useTheme();
    return (
        <Card style={styles.card} mode="elevated" onPress={onPress}>
            {course.file_url && (
                <Card.Cover
                    source={{
                        uri: course.file_url.startsWith('http')
                            ? course.file_url
                            : `${API_URL}${course.file_url}`,
                    }}
                    style={styles.cardCover}
                />
            )}
            <Card.Content style={styles.cardContent}>
                <View style={styles.cardHeader}>
                    <View style={styles.cardTitleContainer}>
                        <Text variant="titleLarge" style={styles.cardTitle}>
                            {course.title}
                        </Text>
                        {course.module_count !== undefined && (
                            <InfoBadge
                                icon="book-open-variant"
                                text={`${course.module_count} ${course.module_count === 1 ? 'module' : 'modules'}`}
                            />
                        )}
                    </View>
                    <MaterialCommunityIcons
                        name="chevron-right"
                        size={24}
                        color={theme.colors.onSurfaceVariant}
                    />
                </View>
                {course.description && (
                    <Text
                        variant="bodyMedium"
                        style={styles.description}
                        numberOfLines={2}
                    >
                        {course.description}
                    </Text>
                )}
            </Card.Content>
        </Card>
    );
}

const styles = StyleSheet.create({
    courseHeader: {
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
    card: {
        marginBottom: designTokens.spacing.lg,
        borderRadius: designTokens.borderRadius.lg,
        overflow: 'hidden',
    },
    cardCover: {
        height: 160,
        borderRadius: 0,
        borderTopLeftRadius: designTokens.borderRadius.lg,
        borderTopRightRadius: designTokens.borderRadius.lg,
    },
    cardContent: {
        padding: designTokens.spacing.xl,
    },
    cardHeader: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
        marginBottom: designTokens.spacing.md,
    },
    cardTitleContainer: {
        flex: 1,
    },
    cardTitle: {
        fontWeight: '600',
        marginBottom: designTokens.spacing.sm,
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
