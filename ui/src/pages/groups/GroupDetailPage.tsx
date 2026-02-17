import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    Stack,
    Text,
    Group,
    Button,
    Alert,
    Modal,
    TextInput,
    Textarea,
    SegmentedControl,
    Title,
    Card,
    Box,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import {
    IconEdit,
    IconMail,
    IconLayoutGrid,
    IconTable,
    IconBook,
} from '@tabler/icons-react';
import { useAuth } from '../../contexts/AuthContext';
import { designTokens } from '../../designTokens';
import { getGroup, patchGroup, getGroupCourses } from '../../utils/api';
import GroupMembers from '../../components/groups/GroupMembers';
import AdminPageLayout from '../../components/layout/AdminPageLayout';
import { usePageState } from '../../hooks/usePageState';
import type { GroupDetail, GroupUpdate, Course } from '../../types/api';

// Course assignment and progress tracking will be implemented by students

export default function GroupDetailPage() {
    const { groupId } = useParams<{ groupId: string }>();
    const navigate = useNavigate();
    const { API_URL, userInfo } = useAuth();
    const [group, setGroup] = useState<GroupDetail | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [courses, setCourses] = useState<Course[]>([]);
    const [coursesLoading, setCoursesLoading] = useState(false);
    const [editModalOpened, { open: openEditModal, close: closeEditModal }] =
        useDisclosure(false);
    const [
        inviteModalOpened,
        { open: openInviteModal, close: closeInviteModal },
    ] = useDisclosure(false);
    // Course assignment modal removed - students will implement

    // Form state for group edit
    const [groupName, setGroupName] = useState('');
    const [groupDescription, setGroupDescription] = useState('');
    // Get default view mode from localStorage or default to 'card'
    const getDefaultViewMode = (): 'table' | 'card' => {
        const stored = localStorage.getItem('view_mode_preference');
        return stored && (stored === 'table' || stored === 'card')
            ? (stored as 'table' | 'card')
            : 'card';
    };
    const [viewMode, setViewMode] = useState<'table' | 'card'>(
        getDefaultViewMode()
    );

    // Course assignment functionality will be implemented by students

    // Check if user can edit (admin or manager) - use effective user for permissions
    const canEdit =
        userInfo?.role?.name === 'admin' || userInfo?.role?.name === 'manager';

    useEffect(() => {
        if (groupId) {
            fetchGroup();
            fetchGroupCourses();
            // Note: fetchUsers removed - users state was unused
            // If needed in future (e.g., for invite modal), can be restored
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [groupId, canEdit]);

    // Save view mode to localStorage when it changes
    useEffect(() => {
        localStorage.setItem('view_mode_preference', viewMode);
    }, [viewMode]);

    async function fetchGroup() {
        if (!groupId) return;
        setLoading(true);
        setError(null);
        try {
            const groupData = await getGroup(Number(groupId));
            setGroup(groupData);
            // Initialize form state
            setGroupName(groupData.name);
            setGroupDescription(groupData.description || '');
        } catch (err) {
            const errorMessage =
                err instanceof Error ? err.message : 'Unknown error';
            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    }

    // Note: fetchUsers removed - users state was unused
    // If needed in future, can be restored

    async function fetchGroupCourses() {
        if (!groupId) return;
        setCoursesLoading(true);
        try {
            const data = await getGroupCourses(Number(groupId));
            setCourses(data);
        } catch (err) {
            console.error('Error fetching group courses:', err);
        } finally {
            setCoursesLoading(false);
        }
    }

    // Course assignment and progress tracking functions will be implemented by students

    function handleEditGroup() {
        if (group) {
            setGroupName(group.name);
            setGroupDescription(group.description || '');
            openEditModal();
        }
    }

    async function handleUpdateGroup(e: React.FormEvent) {
        e.preventDefault();
        if (!groupId) return;
        setLoading(true);
        setError(null);

        try {
            const updateData: GroupUpdate = {
                name: groupName.trim(),
                description: groupDescription.trim() || null,
            };
            await patchGroup(Number(groupId), updateData);
            closeEditModal();
            // Refresh group data
            await fetchGroup();
        } catch (err) {
            const errorMessage =
                err instanceof Error ? err.message : 'Unknown error';
            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    }

    // Course assignment handler will be implemented by students

    const pageState = usePageState({
        data: group,
        loading,
        error,
        notFoundMessage: 'Group Not Found',
    });

    if (!pageState.shouldRenderContent) {
        return pageState.component;
    }

    if (!group) {
        return null;
    }

    const breadcrumbs = [
        { title: 'Dashboard', href: '/dashboard/groups' },
        { title: 'Groups', href: '/dashboard/groups' },
        { title: group.name, href: '#' },
    ];

    return (
        <AdminPageLayout
            breadcrumbs={breadcrumbs}
            title={group.name}
            description={group.description || undefined}
            actions={
                canEdit ? (
                    <Button
                        variant="light"
                        leftSection={<IconEdit size={16} />}
                        onClick={handleEditGroup}
                    >
                        Edit Group
                    </Button>
                ) : undefined
            }
            content={
                <>
                    {error && (
                        <Alert
                            color="red"
                            title="Error"
                            onClose={() => setError(null)}
                        >
                            {error}
                        </Alert>
                    )}

                    {/* Courses Section */}
                    <div>
                        <Title order={2} mb="md">
                            Courses
                        </Title>
                        {coursesLoading ? (
                            <Text>Loading courses...</Text>
                        ) : courses.length === 0 ? (
                            <Text c="dimmed" mb="md">
                                No courses assigned to this group yet.
                            </Text>
                        ) : (
                            <Stack gap="sm">
                                {courses.map((course) => (
                                    <Card
                                        key={course.id}
                                        shadow="sm"
                                        padding={0}
                                        radius="md"
                                        withBorder
                                        style={{
                                            cursor: 'pointer',
                                            overflow: 'hidden',
                                        }}
                                        onClick={() =>
                                            navigate(
                                                `/dashboard/courses/${course.id}`
                                            )
                                        }
                                        onKeyDown={(e) => {
                                            if (
                                                e.key === 'Enter' ||
                                                e.key === ' '
                                            ) {
                                                e.preventDefault();
                                                navigate(
                                                    `/dashboard/courses/${course.id}`
                                                );
                                            }
                                        }}
                                        tabIndex={0}
                                        role="button"
                                    >
                                        <Group
                                            gap={0}
                                            align="stretch"
                                            style={{ minHeight: '100%' }}
                                        >
                                            <Box
                                                style={{
                                                    width: '120px',
                                                    minHeight: '100%',
                                                    backgroundColor:
                                                        designTokens
                                                            .moduleColors
                                                            .darkBlue,
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    flexShrink: 0,
                                                }}
                                            >
                                                <IconBook
                                                    size={48}
                                                    style={{
                                                        color: designTokens
                                                            .surface.white,
                                                    }}
                                                />
                                            </Box>
                                            <Stack
                                                gap="sm"
                                                p="md"
                                                style={{
                                                    flex: 1,
                                                    minHeight: '100%',
                                                }}
                                            >
                                                <Text fw={600} size="md">
                                                    {course.title}
                                                </Text>
                                                {course.description && (
                                                    <Text c="dimmed" size="sm">
                                                        {course.description}
                                                    </Text>
                                                )}
                                            </Stack>
                                        </Group>
                                    </Card>
                                ))}
                            </Stack>
                        )}
                    </div>

                    {/* Members Section */}
                    <div style={{ marginTop: designTokens.spacing.xxxl }}>
                        <Group
                            gap="xs"
                            mb="md"
                            justify="space-between"
                            align="center"
                        >
                            <Title order={2}>Members</Title>
                            <Group gap="sm" align="center">
                                {canEdit && (
                                    <Button
                                        variant="filled"
                                        color="teal"
                                        leftSection={<IconMail size={16} />}
                                        onClick={openInviteModal}
                                        style={{
                                            backgroundColor:
                                                designTokens.app.primary,
                                            color: designTokens.surface.white,
                                        }}
                                    >
                                        Invite Member
                                    </Button>
                                )}
                                <SegmentedControl
                                    value={viewMode}
                                    onChange={(val) =>
                                        setViewMode(val as 'table' | 'card')
                                    }
                                    data={[
                                        {
                                            value: 'table',
                                            label: <IconTable size={16} />,
                                        },
                                        {
                                            value: 'card',
                                            label: <IconLayoutGrid size={16} />,
                                        },
                                    ]}
                                />
                            </Group>
                        </Group>
                        <GroupMembers
                            group={group}
                            onUpdate={fetchGroup}
                            API_URL={API_URL}
                            canEdit={canEdit}
                            viewMode={viewMode}
                        />
                    </div>

                    {/* Edit Group Modal */}
                    {canEdit && (
                        <Modal
                            opened={editModalOpened}
                            onClose={closeEditModal}
                            title="Edit Group"
                            centered
                        >
                            <form onSubmit={handleUpdateGroup}>
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
                                            onClick={closeEditModal}
                                            disabled={loading}
                                        >
                                            Cancel
                                        </Button>
                                        <Button type="submit" loading={loading}>
                                            Update Group
                                        </Button>
                                    </Group>
                                </Stack>
                            </form>
                        </Modal>
                    )}

                    {/* Invite Member Modal - TODO: Students will implement invite system */}
                    {canEdit && (
                        <Modal
                            opened={inviteModalOpened}
                            onClose={closeInviteModal}
                            title={`Invite Member to ${group.name}`}
                            centered
                        >
                            <Text>
                                Invite functionality will be implemented by
                                students.
                            </Text>
                        </Modal>
                    )}

                    {/* Assign Course Modal - TODO: Students will implement */}
                </>
            }
        />
    );
}
