import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Stack,
    Text,
    Card,
    Group,
    Badge,
    SimpleGrid,
    Alert,
} from '@mantine/core';
import { IconUsersGroup } from '@tabler/icons-react';
import { getGroups, getGroup } from '../../utils/api';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import UserPageLayout from '../../components/layout/UserPageLayout';
import type { Group as GroupType } from '../../types/api';

interface GroupWithMemberCount extends GroupType {
    member_count?: number;
}

export default function UserGroupsPage() {
    const navigate = useNavigate();
    const [groups, setGroups] = useState<GroupWithMemberCount[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        fetchGroups();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    async function fetchGroups() {
        setLoading(true);
        setError(null);
        try {
            // Fetch user's groups
            const groupsData = await getGroups();

            // Verify each group is accessible
            const verifiedGroups: GroupWithMemberCount[] = [];
            for (const group of groupsData) {
                try {
                    const groupDetail = await getGroup(group.id);
                    verifiedGroups.push({
                        ...group,
                        member_count: groupDetail.members?.length || 0,
                    });
                } catch (err) {
                    console.warn(
                        `User does not have access to group ${group.id}, filtering it out.`
                    );
                }
            }

            setGroups(verifiedGroups);
        } catch (err) {
            const errorMessage =
                err instanceof Error ? err.message : 'Unknown error';
            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    }

    if (loading) {
        return <LoadingSpinner />;
    }

    if (error) {
        return (
            <UserPageLayout
                breadcrumbs={[{ title: 'My Groups', href: '#' }]}
                title="My Groups"
                content={
                    <Alert color="red" title="Error">
                        {error}
                    </Alert>
                }
            />
        );
    }

    const breadcrumbs = [
        { title: 'Dashboard', href: '/dashboard' },
        { title: 'My Groups', href: '#' },
    ];

    return (
        <UserPageLayout
            breadcrumbs={breadcrumbs}
            title="My Groups"
            description="View all groups you are a member of"
            icon={IconUsersGroup}
            content={
                <>
                    {groups.length === 0 ? (
                        <Alert color="primary" title="No Groups">
                            You are not currently a member of any groups.
                            Contact your administrator to be added to a group.
                        </Alert>
                    ) : (
                        <SimpleGrid
                            cols={{ base: 1, sm: 2, lg: 3 }}
                            spacing="lg"
                        >
                            {groups.map((group) => (
                                <Card
                                    key={group.id}
                                    shadow="sm"
                                    padding="lg"
                                    radius="md"
                                    withBorder
                                    onClick={() =>
                                        navigate(
                                            `/dashboard/user/groups/${group.id}`
                                        )
                                    }
                                    style={{ cursor: 'pointer' }}
                                >
                                    <Stack gap="md">
                                        <Group
                                            justify="space-between"
                                            align="flex-start"
                                        >
                                            <Text fw={500} size="lg">
                                                {group.name}
                                            </Text>
                                            <Badge variant="light">
                                                {group.member_count || 0} member
                                                {(group.member_count || 0) !== 1
                                                    ? 's'
                                                    : ''}
                                            </Badge>
                                        </Group>
                                        {group.description && (
                                            <Text
                                                size="sm"
                                                c="dimmed"
                                                lineClamp={3}
                                            >
                                                {group.description}
                                            </Text>
                                        )}
                                    </Stack>
                                </Card>
                            ))}
                        </SimpleGrid>
                    )}
                </>
            }
        />
    );
}
