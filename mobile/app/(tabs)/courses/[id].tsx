import { View, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import {
    Card,
    Text,
    ActivityIndicator,
    Snackbar,
    Appbar,
} from 'react-native-paper';
import { useLocalSearchParams, useRouter } from 'expo-router';
import ProtectedRoute from '../../../components/ProtectedRoute';
import ModuleCard from '../../../components/modules/ModuleCard';
import { getCourseDetail } from '../../../services/courses';
import { CourseDetail, Module } from '../../../types';
import { designTokens } from '../../../theme';

export default function CourseDetailScreen() {
    const { id } = useLocalSearchParams<{ id: string }>();
    const router = useRouter();
    const courseId = parseInt(id || '0', 10);

    const {
        data: course,
        isLoading,
        error,
        refetch,
        isRefetching,
    } = useQuery<CourseDetail>({
        queryKey: ['courseDetail', courseId],
        queryFn: () => getCourseDetail(courseId),
        enabled: Boolean(courseId && courseId > 0),
    });

    if (isLoading) {
        return (
            <View style={styles.center}>
                <ActivityIndicator size="large" />
            </View>
        );
    }

    return (
        <ProtectedRoute>
            <View style={styles.container}>
                <Appbar.Header>
                    <Appbar.BackAction
                        onPress={() => {
                            router.replace('/(tabs)/courses');
                        }}
                    />
                    <Appbar.Content title={course?.title || 'Course'} />
                </Appbar.Header>

                <ScrollView
                    refreshControl={
                        <RefreshControl
                            refreshing={isRefetching}
                            onRefresh={() => refetch()}
                        />
                    }
                >
                    <View style={styles.content}>
                        {error && (
                            <Snackbar
                                visible={Boolean(error)}
                                onDismiss={() => {}}
                                duration={4000}
                            >
                                Error loading course. Please try again.
                            </Snackbar>
                        )}

                        {course && (
                            <>
                                {course.description && (
                                    <Card style={styles.card}>
                                        <Card.Content>
                                            <Text variant="bodyLarge">
                                                {course.description}
                                            </Text>
                                        </Card.Content>
                                    </Card>
                                )}

                                <Text
                                    variant="titleLarge"
                                    style={styles.sectionTitle}
                                >
                                    Modules
                                </Text>

                                {!course.modules ||
                                course.modules.length === 0 ? (
                                    <Card style={styles.card} mode="outlined">
                                        <Card.Content
                                            style={{
                                                padding:
                                                    designTokens.spacing.xxl,
                                                alignItems: 'center',
                                            }}
                                        >
                                            <Text
                                                variant="bodyMedium"
                                                style={{ opacity: 0.7 }}
                                            >
                                                No modules in this course.
                                            </Text>
                                        </Card.Content>
                                    </Card>
                                ) : (
                                    course.modules
                                        .sort(
                                            (a: Module, b: Module) =>
                                                a.ordering - b.ordering
                                        )
                                        .map((module: Module) => (
                                            <ModuleCard
                                                key={module.id}
                                                module={module}
                                                onPress={() =>
                                                    router.push(
                                                        `/(tabs)/modules/${module.id}?courseId=${courseId}`
                                                    )
                                                }
                                            />
                                        ))
                                )}
                            </>
                        )}
                    </View>
                </ScrollView>
            </View>
        </ProtectedRoute>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    content: {
        padding: designTokens.spacing.xl,
        paddingBottom: designTokens.spacing.xxxl,
    },
    center: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    card: {
        marginBottom: designTokens.spacing.lg,
        borderRadius: designTokens.borderRadius.lg,
    },
    sectionTitle: {
        marginBottom: designTokens.spacing.lg,
        marginTop: designTokens.spacing.sm,
        fontWeight: '600',
    },
});
