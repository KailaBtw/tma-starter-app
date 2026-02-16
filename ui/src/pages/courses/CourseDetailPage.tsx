import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useDisclosure } from '@mantine/hooks';
import { IconEdit } from '@tabler/icons-react';
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

    const pageState = usePageState({
        data: course,
        loading,
        error,
        notFoundMessage: 'Course Not Found',
    });

    if (!pageState.shouldRenderContent) {
        return pageState.component;
    }

    if (!course) {
        return null;
    }

    const breadcrumbs = [
        { title: 'Dashboard', href: '/dashboard/courses' },
        { title: 'Courses', href: '/dashboard/courses' },
        { title: course.title, href: '#' },
    ];

    // Prepare menu items for PageHeader
    const menuItems = canEdit
        ? [
              {
                  label: 'Edit Course',
                  icon: <IconEdit size={16} />,
                  onClick: handleEditCourse,
              },
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
                    <div>
                        <p>
                            Modules functionality will be implemented by
                            students.
                        </p>
                        <p>This course currently has no modules.</p>
                    </div>

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
