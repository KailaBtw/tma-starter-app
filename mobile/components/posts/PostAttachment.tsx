import { View, StyleSheet, ScrollView, Pressable } from 'react-native';
import { PostAttachmentType } from '../../types';
import theme, { designTokens } from '../../theme';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Appbar, Card, Text } from 'react-native-paper';

interface props {
    postInfo: PostAttachmentType;
}
export default function PostAttachment({ postInfo }: props) {
    function handleDownload() {
        console.log('Eventually handle download');
    }

    // TODO: Add imagined behavior for download button
    // Ex. disabled during download, on press color change behavior?

    function generateReadableFileSize() {
        // File sizes are in bytes originally, ex. 1024000
        const fileSizeBites = postInfo.fileSize;

        // bytes to kilobytes
        const fileSizeKB: number = fileSizeBites / 1000;

        const fileSizeMB: number = fileSizeKB / 1000;
        if (fileSizeMB < 1) return fileSizeKB.toFixed(3) + ' KB';

        const fileSizeGB: number = fileSizeMB / 1000;
        if (fileSizeGB < 1) return fileSizeMB.toFixed(3) + ' MB';

        const fileSizeTB: number = fileSizeGB / 1000;
        if (fileSizeTB < 1) return fileSizeGB.toFixed(3) + ' GB';
        return fileSizeTB.toFixed(3) + ' TB';
    }

    return (
        <View
            style={[
                styles.container,
                { backgroundColor: theme.colors.background },
            ]}
        >
            <Appbar.Header elevated>
                <Appbar.Content
                    title={postInfo.title}
                    titleStyle={styles.headerTitle}
                />
            </Appbar.Header>

            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={styles.scrollContent}
            >
                <Text style={styles.postText}>{postInfo.text}</Text>
                <Card style={styles.emptyCard} mode="elevated">
                    <Pressable onPress={handleDownload}>
                        <Card.Content style={styles.emptyContent}>
                            <MaterialCommunityIcons
                                name="download"
                                size={64}
                                color={theme.colors.onSurfaceVariant}
                                style={styles.emptyIcon}
                            />
                            <View style={styles.cardTextContent}>
                                <Text
                                    variant="titleLarge"
                                    style={styles.emptyTitle}
                                >
                                    Download PDF
                                </Text>
                                <Text
                                    variant="bodyMedium"
                                    style={styles.emptyText}
                                >
                                    {postInfo.fileName}
                                    {'\t'}
                                    {generateReadableFileSize()}
                                </Text>
                            </View>
                        </Card.Content>
                    </Pressable>
                </Card>
            </ScrollView>
        </View>
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
        marginTop: designTokens.spacing.xxl,
        borderRadius: designTokens.borderRadius.lg,
    },
    emptyContent: {
        padding: designTokens.spacing.xxxl,
        flex: 1,
        flexDirection: 'row',
        justifyContent: 'center',
        gap: 24, // alignItems: 'center',
    },
    emptyIcon: {
        // marginBottom: designTokens.spacing.lg,
        opacity: 0.5,
    },
    emptyTitle: {
        marginBottom: designTokens.spacing.sm,
        fontWeight: '600',
    },
    emptyText: {
        textAlign: 'left',
        opacity: 0.7,
    },
    cardTextContent: {
        flex: 1,
        justifyContent: 'center',
    },
    postText: {
        textAlign: 'center',
    },
});
