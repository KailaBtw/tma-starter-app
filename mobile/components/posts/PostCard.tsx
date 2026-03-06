import { View, StyleSheet } from 'react-native';
import { Card, Text } from 'react-native-paper';
import { Post } from '../../types';
import { designTokens } from '../../theme';

export interface PostCardProps {
    post: Post;
    onPress: () => void;
}

export default function PostCard({ post, onPress }: PostCardProps) {
    return (
        <Card
            style={styles.card}
            mode="elevated"
            onPress={onPress}
        >
            <Card.Content style={styles.content}>
                <View style={styles.postHeader}>
                    <View style={styles.titleRow}>
                        {post.color && (
                            <View
                                style={[
                                    styles.colorIndicator,
                                    { backgroundColor: post.color },
                                ]}
                            />
                        )}
                        <Text
                            variant="titleMedium"
                            style={styles.title}
                        >
                            {post.title || 'Post'}
                        </Text>
                    </View>
                </View>
                {post.description && (
                    <Text
                        variant="bodyMedium"
                        style={styles.description}
                        numberOfLines={2}
                    >
                        {post.description}
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
    postHeader: {
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
