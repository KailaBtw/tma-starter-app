import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import {
    Stack,
    Text,
    Group,
    Badge,
    Alert,
    Table,
    Avatar,
    Card,
    SimpleGrid,
} from '@mantine/core';
import { IconUsersGroup, IconUser } from '@tabler/icons-react';
import { useViewMode } from '../../hooks/useViewMode';
import { getGroup } from '../../utils/api';
import { formatLastActive } from '../../utils/dateUtils';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import UserPageLayout from '../../components/layout/UserPageLayout';
import { designTokens } from '../../designTokens';
import type { GroupDetail, GroupMember } from '../../types/api';

/**
 * Get badge color for group role
 */
function getRoleBadgeColor(role: string | undefined): string {
    const roleLower = role?.toLowerCase();
    switch (roleLower) {
        case 'admin':
            return designTokens.roles.admin;
        case 'manager':
            return designTokens.roles.manager;
        case 'owner':
            return designTokens.roles.owner;
        case 'moderator':
            return designTokens.roles.moderator;
        case 'member':
            return designTokens.roles.member;
        case 'user':
            return designTokens.roles.user;
        default:
            return designTokens.roles.member;
    }
}

export default function UserGroupDetailPage() {
    const { groupId } = useParams<{ groupId: string }>();
    const [viewMode] = useViewMode();
    const [group, setGroup] = useState<GroupDetail | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (groupId) {
            fetchGroup();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [groupId]);

    async function fetchGroup() {
        if (!groupId) return;
        setLoading(true);
        setError(null);
        try {
            const groupData = await getGroup(Number(groupId));
            setGroup(groupData);
        } catch (err) {
            const errorMessage =
                err instanceof Error ? err.message : 'Failed to fetch group';
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
                breadcrumbs={[
                    { title: 'My Groups', href: '/dashboard/user/groups' },
                ]}
                title="Group Details"
                content={
                    <Alert color="red" title="Error">
                        {error}
                    </Alert>
                }
            />
        );
    }

    if (!group) {
        return (
            <UserPageLayout
                breadcrumbs={[
                    { title: 'My Groups', href: '/dashboard/user/groups' },
                ]}
                title="Group Details"
                content={
                    <Alert color="primary" title="Not Found">
                        Group not found.
                    </Alert>
                }
            />
        );
    }

    const breadcrumbs = [
        { title: 'Dashboard', href: '/dashboard' },
        { title: 'My Groups', href: '/dashboard/user/groups' },
        { title: group.name, href: '#' },
    ];

    const members = group.members || [];

    const rows = members.map((member: GroupMember) => {
        const fullName =
            [member.first_name, member.last_name].filter(Boolean).join(' ') ||
            'N/A';
        // Note: child_dob and avatar_url are not in GroupMember type, would need to fetch user details
        const avatarUrl = null; // Would need user object to get avatar_url

        return (
            <Table.Tr key={member.user_id}>
                <Table.Td>
                    <Group gap="sm">
                        <Avatar
                            src={avatarUrl || undefined}
                            size="sm"
                            radius="xl"
                        >
                            <IconUser size={16} />
                        </Avatar>
                        <div>
                            <Text fw={500} size="sm">
                                {fullName}
                            </Text>
                            {member.email && (
                                <Text size="xs" c="dimmed">
                                    {member.email}
                                </Text>
                            )}
                        </div>
                    </Group>
                </Table.Td>
                <Table.Td>
                    <Text size="sm">{member.username}</Text>
                </Table.Td>
                <Table.Td>
                    <Badge
                        variant="light"
                        color={getRoleBadgeColor(member.group_role)}
                    >
                        {member.group_role}
                    </Badge>
                </Table.Td>
                <Table.Td>
                    <Text size="sm" c="dimmed">
                        {formatLastActive(member.joined_at)}
                    </Text>
                </Table.Td>
            </Table.Tr>
        );
    });

    const cardView = (
        <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }} spacing="md">
            {members.map((member: GroupMember) => {
                const fullName =
                    [member.first_name, member.last_name]
                        .filter(Boolean)
                        .join(' ') || 'N/A';
                const avatarUrl = null; // Would need user object to get avatar_url

                return (
                    <Card
                        key={member.user_id}
                        shadow="sm"
                        padding="md"
                        radius="md"
                        withBorder
                    >
                        <Stack gap="sm">
                            <Group gap="sm">
                                <Avatar
                                    src={avatarUrl || undefined}
                                    size="md"
                                    radius="xl"
                                >
                                    <IconUser size={20} />
                                </Avatar>
                                <Stack gap={2} style={{ flex: 1 }}>
                                    <Text fw={500} size="lg">
                                        {fullName}
                                    </Text>
                                    <Text size="sm" c="dimmed">
                                        {member.username}
                                    </Text>
                                </Stack>
                            </Group>
                            <Group gap="xs" justify="space-between">
                                <Badge
                                    variant="light"
                                    style={{
                                        backgroundColor: getRoleBadgeColor(
                                            member.group_role
                                        ),
                                        color: designTokens.roles.textOnColored,
                                    }}
                                >
                                    {member.group_role}
                                </Badge>
                                <Text size="xs" c="dimmed">
                                    {formatLastActive(member.joined_at)}
                                </Text>
                            </Group>
                        </Stack>
                    </Card>
                );
            })}
        </SimpleGrid>
    );

    return (
        <UserPageLayout
            breadcrumbs={breadcrumbs}
            title={group.name}
            description={group.description || undefined}
            icon={IconUsersGroup}
            content={
                <>
                    <Stack gap="md">
                        <Group justify="space-between">
                            <Text size="lg" fw={500}>
                                Members ({members.length})
                            </Text>
                        </Group>

                        {members.length === 0 ? (
                            <Alert color="primary" title="No Members">
                                This group has no members yet.
                            </Alert>
                        ) : viewMode === 'card' ? (
                            cardView
                        ) : (
                            <Table striped highlightOnHover>
                                <Table.Thead>
                                    <Table.Tr>
                                        <Table.Th>Member</Table.Th>
                                        <Table.Th>Role</Table.Th>
                                        <Table.Th>Joined</Table.Th>
                                    </Table.Tr>
                                </Table.Thead>
                                <Table.Tbody>{rows}</Table.Tbody>
                            </Table>
                        )}
                    </Stack>
                </>
            }
        />
    );
}
