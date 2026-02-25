import { Badge, Button, Group, SimpleGrid, Stack, Text } from '@mantine/core';
import { IconEdit, IconPlus } from '@tabler/icons-react';

import PostCard from './PostCard';
import type { PostCardModel } from './PostCard';

const POST_IMAGE_PLACEHOLDER =
    'https://raw.githubusercontent.com/mantinedev/mantine/master/.demo/images/bg-8.png';

interface ModuleDetailCardProps {
    title: string;
    description?: string | null;
    canEdit?: boolean;
    onEdit?: () => void;
    posts?: PostCardModel[];
}

const EMPTY_POST_PLACEHOLDER: PostCardModel = {
    title: 'No Posts',
    description:
        'This module currently has no posts, you can add posts by clicking the button to the right.',
    status: 'draft',
    ordering: 0,
    imageSrc: null,
};

export default function ModuleDetailCard({
    posts,
    canEdit,
    onEdit,
}: ModuleDetailCardProps) {
    const resolvedPosts = posts ?? [];

    return (
        <Stack gap="md">
            <Group justify="space-between" align="center">
                <Group gap="xs">
                    <Text fw={600}>Posts</Text>
                    <Badge variant="light" color="gray">
                        {resolvedPosts.length}
                    </Badge>
                </Group>
                <Group gap="xs">
                    {canEdit && (
                        <Button
                            variant="subtle"
                            size="sm"
                            leftSection={<IconEdit size={16} />}
                            onClick={onEdit}
                        >
                            Edit Module
                        </Button>
                    )}
                    <Button
                        variant="subtle"
                        size="sm"
                        leftSection={<IconPlus size={16} />}
                        disabled
                        title="Post creation will be implemented later"
                    >
                        New post
                    </Button>
                </Group>
            </Group>

            {resolvedPosts.length > 0 ? (
                <SimpleGrid cols={{ base: 1, sm: 2, md: 3 }}>
                    {resolvedPosts.map((post, idx) => (
                        <PostCard
                            key={`${post.title}-${post.ordering ?? idx}`}
                            post={{
                                ...post,
                                imageSrc:
                                    post.imageSrc ?? POST_IMAGE_PLACEHOLDER,
                            }}
                        />
                    ))}
                </SimpleGrid>
            ) : (
                <SimpleGrid cols={{ base: 1, sm: 2, md: 3 }}>
                    <PostCard post={EMPTY_POST_PLACEHOLDER} />
                </SimpleGrid>
            )}
        </Stack>
    );
}
