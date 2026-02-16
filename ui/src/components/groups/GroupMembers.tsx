import { useState, useEffect } from 'react';
import {
    Stack,
    Table,
    Badge,
    ActionIcon,
    Text,
    Alert,
    Group,
    Card,
    SimpleGrid,
    Avatar,
    Box,
} from '@mantine/core';
import { IconTrash, IconAlertCircle, IconUser } from '@tabler/icons-react';
import { getGroup, removeMemberFromGroup } from '../../utils/api';
import { useTableSort } from '../../hooks/useTableSort';
import SortableTableHeader from '../ui/SortableTableHeader';
import { designTokens } from '../../designTokens';
import type { GroupDetail } from '../../types/api';

interface GroupMembersProps {
    group: GroupDetail;
    onUpdate?: () => void;
    API_URL: string;
    canEdit?: boolean;
    viewMode?: 'card' | 'table';
}

export default function GroupMembers({
    group,
    onUpdate,
    API_URL,
    canEdit = false,
    viewMode = 'card',
}: GroupMembersProps) {
    const [members, setMembers] = useState(group.members || []);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Table sorting for members
    const {
        sortedData: sortedMembers,
        sortColumn,
        sortDirection,
        handleSort,
    } = useTableSort(members as unknown as Record<string, unknown>[], {
        defaultSortColumn: 'username',
    });

    // Helper function to construct full avatar URL
    function getAvatarUrl(
        avatarUrl: string | null | undefined
    ): string | undefined {
        if (!avatarUrl) return undefined;
        // If it's already a full URL (starts with http), return as is
        if (avatarUrl.startsWith('http')) {
            return avatarUrl;
        }
        // Otherwise, construct full URL from API base
        return `${API_URL.replace('/api', '')}${avatarUrl}`;
    }

    useEffect(() => {
        fetchMembers();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [group.id]);

    // Refresh members when group.members changes (e.g., when a new member is added)
    useEffect(() => {
        if (group.members) {
            setMembers(group.members);
        }
    }, [group.members]);

    async function fetchMembers() {
        setLoading(true);
        setError(null);
        try {
            const updatedGroup = await getGroup(group.id);
            setMembers(updatedGroup.members || []);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Unknown error');
        } finally {
            setLoading(false);
        }
    }

    async function handleRemoveMember(userId: number) {
        if (
            !confirm(
                'Are you sure you want to remove this member from the group?'
            )
        ) {
            return;
        }

        setLoading(true);
        setError(null);

        try {
            await removeMemberFromGroup(group.id, userId);
            await fetchMembers();
            if (onUpdate) onUpdate();
        } catch (err) {
            const errorMessage =
                err instanceof Error
                    ? err.message
                    : 'Failed to remove member from group';
            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    }

    function getRoleBadgeColor(role: string): string {
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
                return designTokens.roles.user;
        }
    }

    // Course progress functionality will be implemented by students

    return (
        <Stack gap="md">
            {error && (
                <Alert
                    icon={<IconAlertCircle size={16} />}
                    color="red"
                    title="Error"
                    onClose={() => setError(null)}
                >
                    {error}
                </Alert>
            )}

            {members.length === 0 ? (
                <Text ta="center" py="xl">
                    No members in this group yet.
                </Text>
            ) : (
                <>
                    {viewMode === 'card' ? (
                        <SimpleGrid
                            cols={{ base: 1, sm: 1, md: 2, lg: 2 }}
                            spacing="md"
                        >
                            {(sortedMembers as unknown as typeof members).map(
                                (member) => {
                                    const avatarUrl = getAvatarUrl(
                                        (
                                            member as (typeof members)[0] & {
                                                avatar_url?: string | null;
                                            }
                                        ).avatar_url
                                    );
                                    return (
                                        <Card
                                            key={member.user_id}
                                            shadow="sm"
                                            padding={0}
                                            radius="md"
                                            withBorder
                                            style={{ overflow: 'hidden' }}
                                        >
                                            <Group gap={0} align="stretch">
                                                <Box
                                                    style={{
                                                        width: '120px',
                                                        height: '100%',
                                                        position: 'relative',
                                                        overflow: 'hidden',
                                                        flexShrink: 0,
                                                    }}
                                                >
                                                    <Avatar
                                                        src={avatarUrl}
                                                        size="100%"
                                                        radius={0}
                                                        style={{
                                                            width: '100%',
                                                            height: '100%',
                                                            borderRadius: 0,
                                                            objectFit: 'cover',
                                                        }}
                                                    >
                                                        <IconUser size={80} />
                                                    </Avatar>
                                                </Box>
                                                <Stack
                                                    gap="sm"
                                                    p="md"
                                                    style={{ flex: 1 }}
                                                >
                                                    {/* Header Section */}
                                                    <Group
                                                        justify="space-between"
                                                        align="flex-start"
                                                    >
                                                        <Stack
                                                            gap={4}
                                                            style={{
                                                                flex: 1,
                                                                minWidth: 0,
                                                            }}
                                                        >
                                                            <Text
                                                                fw={600}
                                                                size="lg"
                                                            >
                                                                {
                                                                    member.username
                                                                }
                                                            </Text>
                                                            <Text size="sm">
                                                                {member.email}
                                                            </Text>
                                                        </Stack>
                                                        <Group
                                                            gap="xs"
                                                            style={{
                                                                flexShrink: 0,
                                                            }}
                                                        >
                                                            {member.user_role && (
                                                                <Badge
                                                                    style={{
                                                                        backgroundColor:
                                                                            getRoleBadgeColor(
                                                                                member.user_role
                                                                            ),
                                                                        color: designTokens
                                                                            .roles
                                                                            .textOnColored,
                                                                    }}
                                                                    variant="light"
                                                                    size="md"
                                                                >
                                                                    {member.user_role
                                                                        .charAt(
                                                                            0
                                                                        )
                                                                        .toUpperCase() +
                                                                        member.user_role.slice(
                                                                            1
                                                                        )}
                                                                </Badge>
                                                            )}
                                                            {canEdit && (
                                                                <ActionIcon
                                                                    variant="subtle"
                                                                    color="red"
                                                                    size="sm"
                                                                    onClick={() =>
                                                                        handleRemoveMember(
                                                                            member.user_id
                                                                        )
                                                                    }
                                                                    disabled={
                                                                        loading
                                                                    }
                                                                    title="Remove from Group"
                                                                >
                                                                    <IconTrash
                                                                        size={
                                                                            16
                                                                        }
                                                                    />
                                                                </ActionIcon>
                                                            )}
                                                        </Group>
                                                    </Group>

                                                    {/* Course Progress Section - TODO: Students will implement */}
                                                </Stack>
                                            </Group>
                                        </Card>
                                    );
                                }
                            )}
                        </SimpleGrid>
                    ) : (
                        <Table highlightOnHover>
                            <Table.Thead>
                                <Table.Tr>
                                    <SortableTableHeader
                                        column="username"
                                        sortColumn={sortColumn}
                                        sortDirection={sortDirection}
                                        onSort={handleSort}
                                    >
                                        Username
                                    </SortableTableHeader>
                                    <SortableTableHeader
                                        column="email"
                                        sortColumn={sortColumn}
                                        sortDirection={sortDirection}
                                        onSort={handleSort}
                                    >
                                        Email
                                    </SortableTableHeader>
                                    <SortableTableHeader
                                        column="group_role"
                                        sortColumn={sortColumn}
                                        sortDirection={sortDirection}
                                        onSort={handleSort}
                                    >
                                        Role
                                    </SortableTableHeader>
                                    {/* Course progress columns - TODO: Students will implement */}
                                    {canEdit && (
                                        <Table.Th>
                                            <Text size="sm" fw={500}>
                                                Actions
                                            </Text>
                                        </Table.Th>
                                    )}
                                </Table.Tr>
                            </Table.Thead>
                            <Table.Tbody>
                                {(
                                    sortedMembers as unknown as typeof members
                                ).map((member, index) => {
                                    const avatarUrl = getAvatarUrl(
                                        (
                                            member as (typeof members)[0] & {
                                                avatar_url?: string | null;
                                            }
                                        ).avatar_url
                                    );
                                    return (
                                        <Table.Tr
                                            key={member.user_id}
                                            style={{
                                                backgroundColor:
                                                    index % 2 === 0
                                                        ? 'white'
                                                        : 'transparent',
                                            }}
                                        >
                                            <Table.Td>
                                                <Group gap="sm">
                                                    <Avatar
                                                        src={avatarUrl}
                                                        size={40}
                                                        radius="md"
                                                    >
                                                        <IconUser size={20} />
                                                    </Avatar>
                                                    <Text>
                                                        {member.username}
                                                    </Text>
                                                </Group>
                                            </Table.Td>
                                            <Table.Td>
                                                <Text size="sm">
                                                    {member.email}
                                                </Text>
                                            </Table.Td>
                                            <Table.Td>
                                                {member.user_role && (
                                                    <Badge
                                                        style={{
                                                            backgroundColor:
                                                                getRoleBadgeColor(
                                                                    member.user_role
                                                                ),
                                                            color: designTokens
                                                                .roles
                                                                .textOnColored,
                                                        }}
                                                        variant="light"
                                                    >
                                                        {member.user_role
                                                            .charAt(0)
                                                            .toUpperCase() +
                                                            member.user_role.slice(
                                                                1
                                                            )}
                                                    </Badge>
                                                )}
                                            </Table.Td>
                                            {/* Course progress cells - TODO: Students will implement */}
                                            {canEdit && (
                                                <Table.Td>
                                                    <ActionIcon
                                                        variant="light"
                                                        color="red"
                                                        onClick={() =>
                                                            handleRemoveMember(
                                                                member.user_id
                                                            )
                                                        }
                                                        disabled={loading}
                                                        title="Remove Member"
                                                    >
                                                        <IconTrash size={16} />
                                                    </ActionIcon>
                                                </Table.Td>
                                            )}
                                        </Table.Tr>
                                    );
                                })}
                            </Table.Tbody>
                        </Table>
                    )}
                </>
            )}
        </Stack>
    );
}
