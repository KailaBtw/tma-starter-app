import { Stack, Text, Alert, Card, SimpleGrid } from '@mantine/core';
import { IconBook } from '@tabler/icons-react';
import { useAuth } from '../../contexts/AuthContext';
import { getCourses } from '../../utils/api';
import { useState, useEffect } from 'react';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import UserPageLayout from '../../components/layout/UserPageLayout';
import type { Course } from '../../types/api';

export default function UserCoursesPage() {
    const { API_URL } = useAuth();
    const [courses, setCourses] = useState<Course[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        fetchCourses();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    async function fetchCourses() {
        setLoading(true);
        setError(null);
        try {
            // Fetch user's courses (filtered by groups)
            const coursesData = await getCourses(API_URL);
            setCourses(coursesData);
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
                breadcrumbs={[{ title: 'My Courses', href: '#' }]}
                title="My Courses"
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
        { title: 'My Courses', href: '#' },
    ];

    return (
        <UserPageLayout
            breadcrumbs={breadcrumbs}
            title="My Courses"
            description="View all courses assigned to your groups"
            icon={IconBook}
            content={
                <>
                    {courses.length === 0 ? (
                        <Alert color="primary" title="No Courses">
                            You are not currently assigned to any courses.
                            Contact your administrator to be added to a course.
                        </Alert>
                    ) : (
                        <SimpleGrid
                            cols={{ base: 1, sm: 2, lg: 3 }}
                            spacing="lg"
                        >
                            {courses.map((course) => (
                                <Card
                                    key={course.id}
                                    shadow="sm"
                                    padding="lg"
                                    radius="md"
                                    withBorder
                                >
                                    <Stack gap="md">
                                        <Text fw={500} size="lg">
                                            {course.title}
                                        </Text>
                                        {course.description && (
                                            <Text
                                                size="sm"
                                                c="dimmed"
                                                lineClamp={3}
                                            >
                                                {course.description}
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
