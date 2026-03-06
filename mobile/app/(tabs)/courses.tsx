import { View, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import {
    ActivityIndicator,
    Snackbar,
    Appbar,
    useTheme,
} from 'react-native-paper';
import { useRouter } from 'expo-router';
import ProtectedRoute from '../../components/ProtectedRoute';
import { getUserCourses } from '../../services/courses';
import { Course } from '../../types';
import { designTokens } from '../../theme';
import CourseCard from '../../components/courses/CourseCard';
import EmptyCoursesCard from '../../components/courses/EmptyCoursesCard';

export default function CoursesScreen() {
    const router = useRouter();
    const theme = useTheme();
    const {
        data: courses,
        isLoading,
        error,
        refetch,
        isRefetching,
    } = useQuery<Course[]>({
        queryKey: ['userCourses'],
        queryFn: getUserCourses,
    });

    if (isLoading) {
        return (
            <View
                style={[
                    styles.center,
                    { backgroundColor: theme.colors.background },
                ]}
            >
                <ActivityIndicator size="large" color={theme.colors.primary} />
            </View>
        );
    }

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
                        title="My Courses"
                        titleStyle={styles.headerTitle}
                    />
                </Appbar.Header>

                <ScrollView
                    style={styles.scrollView}
                    contentContainerStyle={styles.scrollContent}
                    refreshControl={
                        <RefreshControl
                            refreshing={isRefetching}
                            onRefresh={() => refetch()}
                        />
                    }
                >
                    {courses && courses.length === 0 ? (
                        <EmptyCoursesCard />
                    ) : (
                        courses?.map((course) => (
                            <CourseCard
                                key={course.id}
                                course={course}
                                onPress={() =>
                                    router.push(`/(tabs)/courses/${course.id}`)
                                }
                            />
                        ))
                    )}
                </ScrollView>

                {error && (
                    <Snackbar
                        visible={Boolean(error)}
                        onDismiss={() => {}}
                        duration={4000}
                        style={styles.snackbar}
                    >
                        Error loading courses. Please try again.
                    </Snackbar>
                )}
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
    center: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerTitle: {
        fontWeight: '600',
        fontSize: 20,
    },
    snackbar: {
        marginBottom: designTokens.spacing.lg,
        zIndex: 9999,
        elevation: 9999,
    },
});
