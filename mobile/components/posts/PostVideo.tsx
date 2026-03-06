import { useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Card, Text, ActivityIndicator } from 'react-native-paper';
import { WebView } from 'react-native-webview';
import type { PostVideo as PostVideoType } from '../../types/api';
import { getVimeoEmbedUrl } from '../../utils/videoHelpers';

type Props = {
    post: PostVideoType;
};

export default function PostVideo({ post }: Props) {
    const [isLoading, setIsLoading] = useState(true);
    const [hadError, setHadError] = useState(false);

    const embedUrl = useMemo(() => {
        const id = post.vimeoId?.trim();
        if (!id) return null;
        return getVimeoEmbedUrl(id);
    }, [post.vimeoId]);

    return (
        <Card style={styles.card} mode="outlined">
            <Card.Content style={styles.content}>
                <Text variant="titleMedium">{post.title}</Text>

                {!!post.text?.trim() && (
                    <Text variant="bodyMedium" style={styles.text}>
                        {post.text}
                    </Text>
                )}

                {!embedUrl ? (
                    <View style={styles.fallback}>
                        <Text variant="bodyMedium">
                            Video unavailable (missing Vimeo ID).
                        </Text>
                    </View>
                ) : hadError ? (
                    <View style={styles.fallback}>
                        <Text variant="bodyMedium">Couldnt load the video</Text>
                        <Text variant="bodySmall" style={styles.muted}>
                            Check the Vimeo ID and try again.
                        </Text>
                    </View>
                ) : (
                    <View style={styles.videoWrap}>
                        {isLoading && (
                            <View style={styles.loader}>
                                <ActivityIndicator />
                                <Text variant="bodySmall" style={styles.muted}>
                                    Loading video...
                                </Text>
                            </View>
                        )}

                        <WebView
                            source={{ uri: embedUrl }}
                            onLoadStart={() => setIsLoading(true)}
                            onLoadEnd={() => setIsLoading(false)}
                            onError={() => {
                                setIsLoading(false);
                                setHadError(true);
                            }}
                            javaScriptEnabled
                            domStorageEnabled
                            allowsFullscreenVideo
                            scrollEnabled={false}
                            style={styles.webview}
                        />
                    </View>
                )}
            </Card.Content>
        </Card>
    );
}

const styles = StyleSheet.create({
    card: { marginBottom: 12 },
    content: { gap: 8 },
    text: { marginTop: 4 },
    videoWrap: {
        width: '100%',
        aspectRatio: 16 / 9,
        borderRadius: 12,
        overflow: 'hidden',
        position: 'relative',
    },
    webview: { flex: 1, backgroundColor: 'transparent' },
    loader: {
        position: 'absolute',
        zIndex: 2,
        inset: 0,
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
    },
    fallback: { paddingVertical: 14 },
    muted: { opacity: 0.7 },
});
