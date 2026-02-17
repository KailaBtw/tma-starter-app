import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Button,
    Table,
    Modal,
    TextInput,
    Textarea,
    Group,
    Badge,
    Text,
    Card,
    SimpleGrid,
    Stack,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { IconPlus, IconBook } from '@tabler/icons-react';
import { getGroups, createGroup } from '../../utils/api';
// InviteUser component removed - students will implement invite system
import { useViewMode } from '../../hooks/useViewMode';
import { useTableSort } from '../../hooks/useTableSort';
import ViewModeToggle from '../../components/ui/ViewModeToggle';
import SortableTableHeader from '../../components/ui/SortableTableHeader';
import DataListView from '../../components/ui/DataListView';
import AdminPageLayout from '../../components/layout/AdminPageLayout';
import type { Group as GroupType, Course } from '../../types/api';

interface GroupWithCourses extends GroupType {
    courses?: Course[];
    courses_count?: number;
    member_count?: number;
}

export default function GroupsPage() {
    const navigate = useNavigate();

    const [groups, setGroups] = useState<GroupWithCourses[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [viewMode, setViewMode] = useViewMode(true);

    // Prepare groups data for sorting (add courses_count for easier sorting)
    const groupsWithCounts = groups.map((group) => ({
        ...group,
        courses_count: group.courses?.length || 0,
    }));

    const {
        sortedData: sortedGroups,
        sortColumn,
        sortDirection,
        handleSort,
    } = useTableSort(groupsWithCounts as unknown as Record<string, unknown>[], {
        defaultSortColumn: 'name',
    });
    const [
        createModalOpened,
        { open: openCreateModal, close: closeCreateModal },
    ] = useDisclosure(false);
    const [inviteModalOpened, { close: closeInviteModal }] =
        useDisclosure(false);
    const [selectedGroup] = useState<GroupWithCourses | null>(null);

    const [groupName, setGroupName] = useState('');
    const [groupDescription, setGroupDescription] = useState('');

    useEffect(() => {
        fetchGroups();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    async function fetchGroups() {
        setLoading(true);
        setError(null);
        try {
            const data = await getGroups();

            // Course assignment will be implemented by students
            const groupsWithCourses = data.map((group) => ({
                ...group,
                courses: [],
                courses_count: 0,
            }));

            setGroups(groupsWithCourses);
        } catch (err) {
            const errorMessage =
                err instanceof Error ? err.message : 'Unknown error';
            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    }

    // Note: fetchUsers removed - users state was unused
    // If needed in future (e.g., for invite modal), can be restored

    async function handleCreateGroup(e: React.FormEvent) {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            await createGroup({
                name: groupName.trim(),
                description: groupDescription.trim() || null,
            });
            setGroupName('');
            setGroupDescription('');
            closeCreateModal();
            fetchGroups();
        } catch (err) {
            const errorMessage =
                err instanceof Error ? err.message : 'Unknown error';
            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    }

    const rows = (sortedGroups as unknown as GroupWithCourses[]).map(
        (group) => (
            <Table.Tr
                key={group.id}
                onClick={() => navigate(`/dashboard/groups/${group.id}`)}
                style={{ cursor: 'pointer' }}
            >
                <Table.Td>
                    <Text fw={500}>{group.name}</Text>
                </Table.Td>
                <Table.Td>
                    <Text size="sm" lineClamp={2}>
                        {group.description || 'No description'}
                    </Text>
                </Table.Td>
                <Table.Td>
                    <Badge variant="light">
                        {group.member_count || 0} members
                    </Badge>
                </Table.Td>
                <Table.Td>
                    <Group gap="xs">
                        <IconBook size={16} />
                        <Badge variant="light" color="primary">
                            {group.courses?.length || 0} course
                            {(group.courses?.length || 0) !== 1 ? 's' : ''}
                        </Badge>
                    </Group>
                </Table.Td>
            </Table.Tr>
        )
    );

    const cardView = (
        <SimpleGrid cols={{ base: 1, sm: 2, lg: 2 }} spacing="md">
            {(sortedGroups as unknown as GroupWithCourses[]).map((group) => (
                <Card
                    key={group.id}
                    shadow="sm"
                    padding="md"
                    radius="md"
                    withBorder
                    onClick={() => navigate(`/dashboard/groups/${group.id}`)}
                    style={{ cursor: 'pointer' }}
                >
                    <Stack gap="sm">
                        <Group justify="space-between" align="flex-start">
                            <Text fw={500} size="lg">
                                {group.name}
                            </Text>
                            <Badge variant="light">
                                {group.member_count || 0} members
                            </Badge>
                        </Group>
                        {group.description && (
                            <Text size="sm" lineClamp={3}>
                                {group.description}
                            </Text>
                        )}
                        {group.courses && group.courses.length > 0 && (
                            <Group gap="xs" mt="xs">
                                <IconBook size={16} />
                                <Text size="sm">
                                    {group.courses.length} course
                                    {group.courses.length !== 1 ? 's' : ''}
                                </Text>
                            </Group>
                        )}
                    </Stack>
                </Card>
            ))}
        </SimpleGrid>
    );

    const breadcrumbs = [
        { title: 'Dashboard', href: '/dashboard' },
        { title: 'Groups', href: '/dashboard/groups' },
    ];

    return (
        <AdminPageLayout
            title="Groups"
            description="Manage groups and group memberships."
            breadcrumbs={breadcrumbs}
            content={
                <>
                    <Group justify="flex-end" align="center" mb="md">
                        <Group gap="md">
                            <ViewModeToggle
                                value={viewMode}
                                onChange={setViewMode}
                            />
                            <Button
                                leftSection={<IconPlus size={16} />}
                                onClick={openCreateModal}
                            >
                                Create Group
                            </Button>
                        </Group>
                    </Group>

                    <DataListView
                        tableView={
                            <Table striped highlightOnHover>
                                <Table.Thead>
                                    <Table.Tr>
                                        <SortableTableHeader
                                            column="name"
                                            sortColumn={sortColumn}
                                            sortDirection={sortDirection}
                                            onSort={handleSort}
                                        >
                                            Name
                                        </SortableTableHeader>
                                        <SortableTableHeader
                                            column="description"
                                            sortColumn={sortColumn}
                                            sortDirection={sortDirection}
                                            onSort={handleSort}
                                        >
                                            Description
                                        </SortableTableHeader>
                                        <SortableTableHeader
                                            column="member_count"
                                            sortColumn={sortColumn}
                                            sortDirection={sortDirection}
                                            onSort={handleSort}
                                        >
                                            Members
                                        </SortableTableHeader>
                                        <SortableTableHeader
                                            column="courses_count"
                                            sortColumn={sortColumn}
                                            sortDirection={sortDirection}
                                            onSort={handleSort}
                                        >
                                            Courses
                                        </SortableTableHeader>
                                    </Table.Tr>
                                </Table.Thead>
                                <Table.Tbody>{rows}</Table.Tbody>
                            </Table>
                        }
                        cardView={cardView}
                        viewMode={viewMode}
                        emptyMessage="No groups found. Create your first group to get started!"
                        error={error}
                        onErrorClose={() => setError(null)}
                        loading={loading}
                        dataLength={groups.length}
                    />

                    {/* Create Group Modal */}
                    <Modal
                        opened={createModalOpened}
                        onClose={closeCreateModal}
                        title="Create New Group"
                        centered
                    >
                        <form onSubmit={handleCreateGroup}>
                            <Stack gap="md">
                                <TextInput
                                    label="Group Name"
                                    placeholder="Enter group name"
                                    value={groupName}
                                    onChange={(e) =>
                                        setGroupName(e.currentTarget.value)
                                    }
                                    required
                                    disabled={loading}
                                    autoFocus
                                />
                                <Textarea
                                    label="Description"
                                    placeholder="Enter group description (optional)"
                                    value={groupDescription}
                                    onChange={(e) =>
                                        setGroupDescription(
                                            e.currentTarget.value
                                        )
                                    }
                                    disabled={loading}
                                    rows={3}
                                />
                                <Group justify="flex-end">
                                    <Button
                                        variant="subtle"
                                        onClick={closeCreateModal}
                                        disabled={loading}
                                    >
                                        Cancel
                                    </Button>
                                    <Button type="submit" loading={loading}>
                                        Create Group
                                    </Button>
                                </Group>
                            </Stack>
                        </form>
                    </Modal>

                    {/* Invite User Modal */}
                    <Modal
                        opened={inviteModalOpened}
                        onClose={closeInviteModal}
                        title={
                            selectedGroup
                                ? `Invite User to ${selectedGroup.name}`
                                : 'Invite User'
                        }
                        centered
                    >
                        {selectedGroup && (
                            <Text>
                                Invite functionality will be implemented by
                                students.
                            </Text>
                        )}
                    </Modal>
                </>
            }
        />
    );
}
