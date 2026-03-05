import {
    View,
    StyleSheet,
    ScrollView,
    Linking,
    useWindowDimensions,
} from 'react-native';
import { PostAttachmentType } from '../../types';
import theme, { designTokens } from '../../theme';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Appbar, Card, Text, Button } from 'react-native-paper';
import { useState } from 'react';
import generateReadableFileSize from '../../utils/generateReadableFileSize';

interface props {
    postInfo: PostAttachmentType;
}
export default function PostAttachment({ postInfo }: props) {
    const { width } = useWindowDimensions();
    const [isDownloading, setIsDownloading] = useState<boolean>(false);
    // ^ Later used to disable download button while downloading

    function handleDownload() {
        console.log('Eventually handle download');

        // Dummy code showing that download button can disable during download
        setIsDownloading(true);
        setTimeout(() => {
            setIsDownloading(false);
        }, 2000);
    }

    const openWebsite = () => {
        Linking.openURL(postInfo.pdfUrl);
    };

    // Used to change the layout a bit on larger screens
    const responsiveStyle = StyleSheet.create({
        flexContainer: {
            flex: 1,
            flexDirection: width > 600 ? 'row' : 'column',
            justifyContent: 'space-between',
        },

        cardWidth: {
            width: width > 600 ? '47%' : 'auto',
        },
    });

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
                <View style={responsiveStyle.flexContainer}>
                    <Button
                        icon="link-variant"
                        mode="elevated"
                        onPress={openWebsite}
                        style={[styles.emptyCard, responsiveStyle.cardWidth]}
                    >
                        {postInfo.pdfUrl}
                    </Button>

                    {/* <Card style={styles.emptyCard} mode="elevated"> */}
                    <Button
                        mode="elevated"
                        onPress={handleDownload}
                        disabled={isDownloading}
                        style={[styles.emptyCard, responsiveStyle.cardWidth]}
                    >
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
                                    {'\t\t'}
                                    {generateReadableFileSize(
                                        postInfo.fileSize
                                    )}
                                </Text>
                            </View>
                        </Card.Content>
                    </Button>
                </View>
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
        padding: designTokens.spacing.md,
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
        justifyContent: 'space-between',
        gap: 24,
        alignItems: 'center',
    },
    emptyIcon: {
        // marginBottom: designTokens.spacing.lg,
        opacity: 0.5,
    },
    emptyTitle: {
        marginBottom: designTokens.spacing.sm,
        fontWeight: '600',
        // textAlign: 'center',
    },
    emptyText: {
        textAlign: 'left',
        opacity: 0.7,
        // textAlign: 'center',
    },
    cardTextContent: {
        flex: 1,
        justifyContent: 'center',
    },
    postText: {
        textAlign: 'center',
    },
});
