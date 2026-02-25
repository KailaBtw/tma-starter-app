import { Badge, Button, Card, Group, Image, Text } from '@mantine/core';

export type PostCardModel = {
    ordering?: number;
    title: string;
    description?: string | null;
    status?: 'draft' | 'published' | 'locked';
    imageSrc?: string | null;
};

export default function PostCard({ post }: { post: PostCardModel }) {
    return (
        <>
            <Card
                shadow="sm"
                padding="lg"
                radius="md"
                withBorder
                style={{ height: '100%', width: '100%' }}
            >
                <Card.Section>
                    <Image src={post.imageSrc} fit="cover" />
                </Card.Section>

                <Group justify="space-between" mt="md" mb="xs">
                    <Text fw={500}>{post.title}</Text>
                    <Badge variant="light" color="blue">
                        {post.status}
                    </Badge>
                </Group>

                <Text size="sm" c="dimmed">
                    {post.description}
                </Text>

                <Button
                    variant="light"
                    color="blue"
                    fullWidth
                    mt="md"
                    radius="md"
                >
                    See more information
                </Button>
            </Card>
        </>
    );
}
