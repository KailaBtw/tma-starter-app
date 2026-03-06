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
import PostCard from '../../../components/posts/PostCard';
import { getModuleDetail } from '../../../services/modules';
import { ModuleDetail, Module, Post } from '../../../types';
import { designTokens } from '../../../theme';
import { dummyPosts } from '../../../utils/dummyPost';


export default function ModuleDetailScreen() {
    const { id, courseId } = useLocalSearchParams<{
        id: string;
        courseId?: string;
    }>();
    const router = useRouter();
    const moduleId = parseInt(id || '0', 10);

    const {
        data: module,
        isLoading,
        error,
        refetch,
        isRefetching,
    } = useQuery<ModuleDetail>({
        queryKey: ['moduleDetail', moduleId],
        queryFn: () => getModuleDetail(moduleId),
        enabled: Boolean(moduleId && moduleId > 0),
    });

    const posts = module?.posts?.length ? module.posts : dummyPosts;

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
                            if (courseId) {
                                router.replace(
                                    `/(tabs)/courses/${courseId}`
                                );
                            } else if (router.canGoBack()) {
                                router.back();
                            } else {
                                router.replace('/(tabs)/courses');
                            }
                        }}
                    />
                    <Appbar.Content title={module?.title || 'Module'} />
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

                        {module && (
                            <>
                                {module.description && (
                                    <Card style={styles.card}>
                                        <Card.Content>
                                            <Text variant="bodyLarge">
                                                {module.description}
                                            </Text>
                                        </Card.Content>
                                    </Card>
                                )}

                                <Text
                                    variant="titleLarge"
                                    style={styles.sectionTitle}
                                >
                                    Posts
                                </Text>

                                {posts.length === 0 ? (
                                    <Card style={styles.card} mode="outlined">
                                        <Card.Content style={{ padding: designTokens.spacing.xxl, alignItems: 'center' }}>
                                            <Text variant="bodyMedium" style={{ opacity: 0.7 }}>
                                                No posts in this module.
                                            </Text>
                                        </Card.Content>
                                    </Card>
                                ) : (
                                    posts
                                        .sort((a, b) => ('ordering' in a && 'ordering' in b ? a.ordering - b.ordering : (a.id - b.id)))
                                        .map((post) => (
                                            <PostCard
                                                key={post.id}
                                                post={post as Post}
                                                onPress={() =>
                                                router.push(
                                                    `/(tabs)/posts/${post.id}?moduleId=${moduleId}${courseId ? `&courseId=${courseId}` : ''}`
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
    message: { marginBottom: designTokens.spacing.sm },
    subtitle: { opacity: 0.7, textAlign: 'center' },
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
