import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDisclosure } from '@mantine/hooks';
import { Card, SimpleGrid, Stack, Box, Text } from '@mantine/core';
import { IconEdit, IconPlus, IconBook } from '@tabler/icons-react';
import { useAuth } from '../../contexts/AuthContext';
import { getCourse, patchCourse } from '../../utils/api';
import AdminPageLayout from '../../components/layout/AdminPageLayout';
import EditCourseModal from '../../components/courses/EditCourseModal';
import { usePageState } from '../../hooks/usePageState';
import type { CourseUpdate, CourseDetail } from '../../types/api';

export default function CourseDetailPage() {
    const { courseId } = useParams<{ courseId: string }>();
    const { userInfo } = useAuth();
    const [editModalOpened, { open: openEditModal, close: closeEditModal }] =
        useDisclosure(false);

    const navigate = useNavigate();

    // Form state for course edit
    const [courseTitle, setCourseTitle] = useState('');
    const [courseDescription, setCourseDescription] = useState('');
    const [course, setCourse] = useState<CourseDetail | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Check if user can edit (admin only)
    const canEdit = userInfo?.role?.name === 'admin';

    async function fetchCourse() {
        if (!courseId) return;
        setLoading(true);
        setError(null);
        try {
            const courseData = await getCourse(Number(courseId));
            setCourse(courseData);
        } catch (err) {
            const errorMessage =
                err instanceof Error ? err.message : 'Unknown error';
            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        if (courseId) {
            fetchCourse();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [courseId]);

    // Initialize form state when course loads
    useEffect(() => {
        if (course) {
            setCourseTitle(course.title);
            setCourseDescription(course.description || '');
        }
    }, [course]);

    function handleEditCourse() {
        if (course) {
            setCourseTitle(course.title);
            setCourseDescription(course.description || '');
            openEditModal();
        }
    }

    function handleCreateModule() {
        navigate('/dashboard/modules/new');
    }

    async function handleUpdateCourse(e: React.FormEvent) {
        e.preventDefault();
        if (!courseId) return;
        setLoading(true);
        setError(null);

        try {
            const updateData: CourseUpdate = {
                title: courseTitle.trim(),
                description: courseDescription.trim() || null,
            };

            await patchCourse(Number(courseId), updateData);
            closeEditModal();
            await fetchCourse();
        } catch (err) {
            const errorMessage =
                err instanceof Error ? err.message : 'Unknown error';
            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    }

    const breadcrumbs = course
        ? [
              { title: 'Dashboard', href: '/dashboard/courses' },
              { title: 'Courses', href: '/dashboard/courses' },
              { title: course.title, href: '#' },
          ]
        : [
              { title: 'Dashboard', href: '/dashboard/courses' },
              { title: 'Courses', href: '/dashboard/courses' },
          ];

    const pageState = usePageState({
        data: course,
        loading,
        error,
        notFoundMessage: 'Course Not Found',
        layoutComponent: AdminPageLayout,
        layoutProps: {
            breadcrumbs
        },
    });

    if (!pageState.shouldRenderContent) {
        return pageState.component;
    }

    if (!course) {
        return null;
    }

    // Prepare menu items for PageHeader
    const menuItems = canEdit
        ? [
              {
                  label: 'Edit Course',
                  icon: <IconEdit size={16} />,
                  onClick: handleEditCourse,
              },
              {
                  label: 'Create Module',
                  icon: <IconPlus size={16} />,
                  onClick: handleCreateModule,
              }
          ]
        : undefined;

    return (
        <AdminPageLayout
            breadcrumbs={breadcrumbs}
            title={course.title}
            description={course.description || undefined}
            menuItems={menuItems}
            content={
                <>
                    <Box
                        style={{
                            backgroundColor: 'var(--mantine-color-gray-2)',
                            borderRadius: '12px',
                            padding: '24px',
                            marginBottom: '24px',
                        }}
                    >
                        <Text fw={700} size="lg" mb="lg">
                            Modules
                        </Text>
                        {course.modules && course.modules.length > 0 ? (
                            <SimpleGrid cols={{ base: 1, xs: 2, sm: 2, md: 2, lg: 3 }} spacing="md">
                                {course.modules.map((module) => (
                                <Card
                                    key={module.id}
                                    shadow="sm"
                                    padding="lg"
                                    radius="md"
                                    withBorder
                                    onClick={() => navigate(`/dashboard/modules/${module.id}`)}
                                    style={{
                                        cursor: 'pointer',
                                        transition: 'transform 0.2s, box-shadow 0.2s',
                                    }}
                                    onMouseEnter={(e) => {
                                        e.currentTarget.style.transform = 'translateY(-2px)';
                                        e.currentTarget.style.boxShadow = 'var(--mantine-shadow-md)';
                                    }}
                                    onMouseLeave={(e) => {
                                        e.currentTarget.style.transform = 'translateY(0)';
                                        e.currentTarget.style.boxShadow = 'var(--mantine-shadow-sm)';
                                    }}
                                >
                                    <Stack gap="md">
                                        {/* Title and Picture */}
                                        <Box
                                            style={{
                                                display: 'flex',
                                                alignItems: 'flex-start',
                                                gap: '12px',
                                            }}
                                        >
                                            <Box
                                                style={{
                                                    padding: '12px',
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
                                            <div style={{ flex: 1, minWidth: 0 }}>
                                                <Text
                                                    fw={600}
                                                    size="lg"
                                                    lineClamp={2}
                                                    style={{ marginBottom: '4px' }}
                                                >
                                                    {module.title}
                                                </Text>
                                            </div>
                                        </Box>

                                        {/* Description */}
                                        {module.description && (
                                            <Text
                                                size="sm"
                                                lineClamp={3}
                                                c="dimmed"
                                                style={{ minHeight: '60px' }}
                                            >
                                                {module.description}
                                            </Text>
                                        )}
                                    </Stack>
                                </Card>
                            ))}
                        </SimpleGrid>
                    ) : (
                        <Text>This course has no modules.</Text>
                    )}
                    </Box>

                    {/* Edit Course Modal */}
                    {canEdit && (
                        <EditCourseModal
                            opened={editModalOpened}
                            onClose={closeEditModal}
                            courseTitle={courseTitle}
                            courseDescription={courseDescription}
                            onTitleChange={(
                                e: React.ChangeEvent<HTMLInputElement>
                            ) => setCourseTitle(e.currentTarget.value)}
                            onDescriptionChange={(
                                e: React.ChangeEvent<HTMLTextAreaElement>
                            ) => setCourseDescription(e.currentTarget.value)}
                            onSubmit={handleUpdateCourse}
                            loading={loading}
                        />
                    )}
                </>
            }
        />
    );
}
