import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Button,
    Table,
    Modal,
    TextInput,
    Textarea,
    Group,
    Text,
    Badge,
    Card,
    SimpleGrid,
    Stack,
    Box,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { IconPlus, IconBook } from '@tabler/icons-react';
import { getCourses, createCourse } from '../../utils/api';
import { useViewMode } from '../../hooks/useViewMode';
import { useTableSort } from '../../hooks/useTableSort';
import ViewModeToggle from '../../components/ui/ViewModeToggle';
import SortableTableHeader from '../../components/ui/SortableTableHeader';
import DataListView from '../../components/ui/DataListView';
import AdminPageLayout from '../../components/layout/AdminPageLayout';
import type { Course, CourseCreate } from '../../types/api';

export default function CoursesPage() {
    const navigate = useNavigate();

    const [courses, setCourses] = useState<Course[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [viewMode, setViewMode] = useViewMode(true);
    const {
        sortedData: sortedCourses,
        sortColumn,
        sortDirection,
        handleSort,
    } = useTableSort(courses as unknown as Record<string, unknown>[], {
        defaultSortColumn: 'title',
    });
    const [
        createModalOpened,
        { open: openCreateModal, close: closeCreateModal },
    ] = useDisclosure(false);

    const [courseTitle, setCourseTitle] = useState('');
    const [courseDescription, setCourseDescription] = useState('');

    useEffect(() => {
        fetchCourses();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    async function fetchCourses() {
        setLoading(true);
        setError(null);
        try {
            const data = await getCourses();
            setCourses(data);
        } catch (err) {
            const errorMessage =
                err instanceof Error ? err.message : 'Unknown error';
            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    }

    async function handleCreateCourse(e: React.FormEvent) {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            const courseData: CourseCreate = {
                title: courseTitle.trim(),
                description: courseDescription.trim() || null,
            };

            // File upload functionality will be implemented by students

            // Create the course
            await createCourse(courseData);
            setCourseTitle('');
            setCourseDescription('');
            closeCreateModal();
            fetchCourses();
        } catch (err) {
            const errorMessage =
                err instanceof Error ? err.message : 'Unknown error';
            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    }

    const rows = (sortedCourses as unknown as Course[]).map((course) => {
        return (
            <Table.Tr
                key={course.id}
                onClick={() => navigate(`/dashboard/courses/${course.id}`)}
                style={{ cursor: 'pointer' }}
            >
                <Table.Td>
                    <Box
                        style={{
                            width: 48,
                            height: 48,
                            borderRadius: '8px',
                            backgroundColor: 'var(--mantine-color-blue-0)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                        }}
                    >
                        <IconBook
                            size={24}
                            style={{
                                color: 'var(--mantine-color-blue-6)',
                            }}
                        />
                    </Box>
                </Table.Td>
                <Table.Td>
                    <Text fw={500} c="blue">
                        {course.title}
                    </Text>
                </Table.Td>
                <Table.Td>
                    <Text size="sm" lineClamp={2}>
                        {course.description || 'No description'}
                    </Text>
                </Table.Td>
                <Table.Td>
                    <Badge variant="light">
                        {course.module_count || 0} modules
                    </Badge>
                </Table.Td>
            </Table.Tr>
        );
    });

    const cardView = (
        <SimpleGrid cols={{ base: 1, xs: 2, sm: 2, md: 2, lg: 3 }} spacing="md">
            {(sortedCourses as unknown as Course[]).map((course) => {
                return (
                    <Card
                        key={course.id}
                        shadow="sm"
                        padding="lg"
                        radius="md"
                        withBorder
                        onClick={() =>
                            navigate(`/dashboard/courses/${course.id}`)
                        }
                        style={{
                            cursor: 'pointer',
                            transition: 'transform 0.2s, box-shadow 0.2s',
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.transform =
                                'translateY(-2px)';
                            e.currentTarget.style.boxShadow =
                                'var(--mantine-shadow-md)';
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.transform = 'translateY(0)';
                            e.currentTarget.style.boxShadow =
                                'var(--mantine-shadow-sm)';
                        }}
                    >
                        <Stack gap="md">
                            {/* Icon and Title */}
                            <Group gap="sm" align="flex-start">
                                <Box
                                    style={{
                                        padding: '12px',
                                        borderRadius: '8px',
                                        backgroundColor:
                                            'var(--mantine-color-blue-0)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                    }}
                                >
                                    <IconBook
                                        size={24}
                                        style={{
                                            color: 'var(--mantine-color-blue-6)',
                                        }}
                                    />
                                </Box>
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <Text
                                        fw={600}
                                        size="lg"
                                        lineClamp={2}
                                        style={{ marginBottom: '4px' }}
                                    >
                                        {course.title}
                                    </Text>
                                </div>
                            </Group>

                            {/* Description */}
                            {course.description && (
                                <Text
                                    size="sm"
                                    lineClamp={3}
                                    c="dimmed"
                                    style={{ minHeight: '60px' }}
                                >
                                    {course.description}
                                </Text>
                            )}

                            {/* Footer with module count */}
                            <Group
                                justify="space-between"
                                align="center"
                                mt="auto"
                            >
                                <Badge
                                    variant="light"
                                    color="blue"
                                    size="md"
                                    leftSection={<IconBook size={14} />}
                                >
                                    {course.module_count || 0} module
                                    {(course.module_count || 0) !== 1
                                        ? 's'
                                        : ''}
                                </Badge>
                            </Group>
                        </Stack>
                    </Card>
                );
            })}
        </SimpleGrid>
    );

    const breadcrumbs = [
        { title: 'Dashboard', href: '/dashboard' },
        { title: 'Courses', href: '/dashboard/courses' },
    ];

    return (
        <AdminPageLayout
            title="Courses"
            description="Manage all courses, modules, and course content."
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
                                Create Course
                            </Button>
                        </Group>
                    </Group>

                    <DataListView
                        tableView={
                            <Table striped highlightOnHover>
                                <Table.Thead>
                                    <Table.Tr>
                                        <Table.Th style={{ width: 60 }}>
                                            Image
                                        </Table.Th>
                                        <SortableTableHeader
                                            column="title"
                                            sortColumn={sortColumn}
                                            sortDirection={sortDirection}
                                            onSort={handleSort}
                                        >
                                            Title
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
                                            column="module_count"
                                            sortColumn={sortColumn}
                                            sortDirection={sortDirection}
                                            onSort={handleSort}
                                        >
                                            Modules
                                        </SortableTableHeader>
                                    </Table.Tr>
                                </Table.Thead>
                                <Table.Tbody>{rows}</Table.Tbody>
                            </Table>
                        }
                        cardView={cardView}
                        viewMode={viewMode}
                        emptyMessage="No courses found. Create your first course to get started!"
                        error={error}
                        onErrorClose={() => setError(null)}
                        loading={loading}
                        dataLength={courses.length}
                    />

                    {/* Create Course Modal */}
                    <Modal
                        opened={createModalOpened}
                        onClose={closeCreateModal}
                        title="Create New Course"
                        centered
                    >
                        <form onSubmit={handleCreateCourse}>
                            <Stack gap="md">
                                <TextInput
                                    label="Course Title"
                                    placeholder="Enter course title"
                                    value={courseTitle}
                                    onChange={(e) =>
                                        setCourseTitle(e.currentTarget.value)
                                    }
                                    required
                                    disabled={loading}
                                    autoFocus
                                />
                                <Textarea
                                    label="Description"
                                    placeholder="Enter course description (optional)"
                                    value={courseDescription}
                                    onChange={(e) =>
                                        setCourseDescription(
                                            e.currentTarget.value
                                        )
                                    }
                                    disabled={loading}
                                    rows={3}
                                />
                                {/* File upload functionality will be implemented by students */}
                                <Group justify="flex-end">
                                    <Button
                                        variant="subtle"
                                        onClick={() => {
                                            closeCreateModal();
                                        }}
                                        disabled={loading}
                                    >
                                        Cancel
                                    </Button>
                                    <Button type="submit" loading={loading}>
                                        Create Course
                                    </Button>
                                </Group>
                            </Stack>
                        </form>
                    </Modal>
                </>
            }
        />
    );
}
