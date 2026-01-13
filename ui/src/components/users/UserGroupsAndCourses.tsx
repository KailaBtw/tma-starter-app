import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Stack,
    Title,
    Text,
    Card,
    Group,
    Badge,
    SimpleGrid,
    Loader,
    Center,
    Alert,
    RingProgress,
} from '@mantine/core';
import { IconUsers, IconBook, IconInfoCircle } from '@tabler/icons-react';
import { useAuth } from '../../contexts/AuthContext';
import {
    getGroups,
    getCourses,
    getGroupCourses,
    getGroup,
} from '../../utils/api';
import type { Group as ApiGroup, Course } from '../../types/api';

// TODO: These types and functions will be implemented in future assignments
interface CourseGroup {
    course_id: number;
    group_id: number;
}

// Types for future implementation (commented out until needed):
// interface UserProgress {
//     post_id: number;
//     status_code: string;
// }
// interface CourseModule {
//     module_id: number;
// }
// interface Post {
//     id: number;
// }

interface CourseProgress {
    completed: number;
    total: number;
    percentage: number;
}

interface UserGroupsAndCoursesProps {
    API_URL: string;
}

export default function UserGroupsAndCourses({
    API_URL,
}: UserGroupsAndCoursesProps) {
    const navigate = useNavigate();
    const { userInfo } = useAuth();
    const [groups, setGroups] = useState<ApiGroup[]>([]);
    const [courses, setCourses] = useState<Course[]>([]);
    const [courseProgress, setCourseProgress] = useState<
        Record<number, CourseProgress>
    >({});
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        fetchData();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    async function fetchData() {
        setLoading(true);
        setError(null);
        try {
            // Fetch user's groups (backend filters to only groups user is a member of)
            const groupsData = await getGroups(API_URL);

            // Verify each group is accessible (defensive check)
            // The backend should already filter correctly, but we verify to be safe
            const verifiedGroups: ApiGroup[] = [];
            for (const group of groupsData) {
                try {
                    // Try to access the group details - this will fail with 403 if user doesn't have access
                    await getGroup(group.id, API_URL);
                    verifiedGroups.push(group);
                } catch (err) {
                    // If we can't access this group, skip it and log a warning
                    console.warn(
                        `User does not have access to group ${group.id} (${group.name}), filtering it out.`
                    );
                }
            }

            setGroups(verifiedGroups);

            // Fetch all course-group relationships
            // TODO: This will be implemented when course-group relationships API is available
            const courseGroupsData: CourseGroup[] = [];
            for (const group of verifiedGroups) {
                try {
                    const groupCourses = await getGroupCourses(
                        group.id,
                        API_URL
                    );
                    groupCourses.forEach((course) => {
                        courseGroupsData.push({
                            course_id: course.id,
                            group_id: group.id,
                        });
                    });
                } catch (err) {
                    console.warn(
                        `Error fetching courses for group ${group.id}:`,
                        err
                    );
                }
            }

            // Get unique course IDs from user's verified groups
            const userGroupIds = new Set(verifiedGroups.map((g) => g.id));
            const accessibleCourseIds = new Set(
                courseGroupsData
                    .filter((cg: CourseGroup) => userGroupIds.has(cg.group_id))
                    .map((cg: CourseGroup) => cg.course_id)
            );

            // Fetch all courses and filter to only accessible ones
            const allCourses = await getCourses(API_URL);
            const accessibleCourses = allCourses.filter((course) =>
                accessibleCourseIds.has(course.id)
            );

            setCourses(accessibleCourses);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Unknown error');
        } finally {
            setLoading(false);
        }
    }

    // Fetch course progress when courses are loaded
    useEffect(() => {
        if (courses.length > 0 && userInfo?.id) {
            fetchCourseProgress();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [courses, userInfo?.id]);

    async function fetchCourseProgress() {
        if (!userInfo?.id) return;

        try {
            // TODO: Progress tracking will be implemented in a future assignment
            // For now, set all progress to 0
            const progressMapData: Record<number, CourseProgress> = {};

            for (const course of courses) {
                // TODO: When modules and posts are implemented, calculate actual progress
                progressMapData[course.id] = {
                    completed: 0,
                    total: 0,
                    percentage: 0,
                };
            }

            /* Future implementation:
            // Fetch all user progress for the current user
            const allProgress = await getUserProgress(
                userInfo.id,
                null,
                API_URL
            );

            // Create a map of post_id -> progress
            const progressMap: Record<number, UserProgress> = {};
            allProgress.forEach((progress: UserProgress) => {
                progressMap[progress.post_id] = progress;
            });

            // Calculate progress for each course
            for (const course of courses) {
                try {
                    // Get all modules for this course
                    const courseModules = await getCourseModules(
                        course.id,
                        null,
                        API_URL
                    );

                    // Get all posts for all modules in this course
                    let totalPosts = 0;
                    let completedPosts = 0;

                    for (const courseModule of courseModules) {
                        try {
                            const modulePosts = await getPosts(
                                courseModule.module_id,
                                API_URL
                            );
                            totalPosts += modulePosts.length;
                            completedPosts += modulePosts.filter(
                                (post: Post) =>
                                    progressMap[post.id]?.status_code ===
                                    'completed'
                            ).length;
                        } catch (err) {
                            console.error(
                                `Error fetching posts for module ${courseModule.module_id}:`,
                                err
                            );
                        }
                    }

                    const percentage =
                        totalPosts > 0
                            ? Math.round((completedPosts / totalPosts) * 100)
                            : 0;

                    progressMapData[course.id] = {
                        completed: completedPosts,
                        total: totalPosts,
                        percentage,
                    };
                } catch (err) {
                    console.error(
                        `Error calculating progress for course ${course.id}:`,
                        err
                    );
                    progressMapData[course.id] = {
                        completed: completedPosts,
                        total: totalPosts,
                        percentage:
                            totalPosts > 0
                                ? Math.round((completedPosts / totalPosts) * 100)
                                : 0,
                    };
                } catch (err) {
                    console.error(
                        `Error calculating progress for course ${course.id}:`,
                        err
                    );
                    progressMapData[course.id] = {
                        completed: 0,
                        total: 0,
                        percentage: 0,
                    };
                }
            }
            */

            setCourseProgress(progressMapData);
        } catch (err) {
            console.error('Error fetching course progress:', err);
        }
    }

    if (loading) {
        return (
            <Center py="xl">
                <Loader size="lg" />
            </Center>
        );
    }

    if (error) {
        return (
            <Alert color="red" title="Error">
                {error}
            </Alert>
        );
    }

    return (
        <Stack gap="xl">
            {/* Groups Section */}
            <div>
                <Group gap="xs" mb="md">
                    <IconUsers size={20} />
                    <Title order={2}>My Groups</Title>
                </Group>
                {groups.length === 0 ? (
                    <Alert
                        icon={<IconInfoCircle size={16} />}
                        color="primary"
                        title="No Groups"
                    >
                        <Text size="sm">
                            You are not currently a member of any groups.
                        </Text>
                    </Alert>
                ) : (
                    <SimpleGrid cols={{ base: 1, sm: 2, lg: 2 }} spacing="md">
                        {groups.map((group) => (
                            <Card
                                key={group.id}
                                shadow="sm"
                                padding="md"
                                radius="md"
                                withBorder
                                onClick={() =>
                                    navigate(`/dashboard/groups/${group.id}`)
                                }
                                style={{ cursor: 'pointer' }}
                            >
                                <Stack gap="sm">
                                    <Group
                                        justify="space-between"
                                        align="flex-start"
                                    >
                                        <Text fw={500} size="lg">
                                            {group.name}
                                        </Text>
                                        <Badge variant="light">
                                            {(
                                                group as ApiGroup & {
                                                    member_count?: number;
                                                }
                                            ).member_count || 0}{' '}
                                            members
                                        </Badge>
                                    </Group>
                                    {group.description && (
                                        <Text size="sm" lineClamp={3}>
                                            {group.description}
                                        </Text>
                                    )}
                                </Stack>
                            </Card>
                        ))}
                    </SimpleGrid>
                )}
            </div>

            {/* Courses Section */}
            <div>
                <Group gap="xs" mb="md">
                    <IconBook size={20} />
                    <Title order={2}>My Courses</Title>
                </Group>
                {courses.length === 0 ? (
                    <Alert
                        icon={<IconInfoCircle size={16} />}
                        color="primary"
                        title="No Courses"
                    >
                        <Text size="sm">
                            No courses are currently assigned to your groups.
                        </Text>
                    </Alert>
                ) : (
                    <SimpleGrid cols={{ base: 1, sm: 2, lg: 2 }} spacing="md">
                        {courses.map((course) => (
                            <Card
                                key={course.id}
                                shadow="sm"
                                padding="md"
                                radius="md"
                                withBorder
                                onClick={() =>
                                    navigate(`/dashboard/courses/${course.id}`)
                                }
                                style={{ cursor: 'pointer' }}
                            >
                                <Stack gap="sm">
                                    <Group
                                        justify="space-between"
                                        align="flex-start"
                                    >
                                        <Group gap="xs" align="center">
                                            <Text fw={500} size="lg">
                                                {course.title}
                                            </Text>
                                            {userInfo?.id &&
                                                courseProgress[course.id] &&
                                                (courseProgress[course.id]
                                                    ?.total ?? 0) > 0 && (
                                                    <Badge
                                                        size="sm"
                                                        variant="light"
                                                        color={
                                                            (courseProgress[
                                                                course.id
                                                            ]?.percentage ??
                                                                0) === 100
                                                                ? 'green'
                                                                : (courseProgress[
                                                                        course
                                                                            .id
                                                                    ]
                                                                        ?.percentage ??
                                                                        0) > 0
                                                                  ? 'blue'
                                                                  : 'gray'
                                                        }
                                                    >
                                                        {courseProgress[
                                                            course.id
                                                        ]?.percentage ?? 0}
                                                        %
                                                    </Badge>
                                                )}
                                        </Group>
                                        <Badge variant="light" color="primary">
                                            {course.module_count || 0} module
                                            {(course.module_count || 0) !== 1
                                                ? 's'
                                                : ''}
                                        </Badge>
                                    </Group>
                                    {course.description && (
                                        <Text size="sm" lineClamp={3}>
                                            {course.description}
                                        </Text>
                                    )}
                                    {userInfo?.id &&
                                        courseProgress[course.id] &&
                                        (courseProgress[course.id]?.total ??
                                            0) > 0 && (
                                            <Stack gap="xs" mt="sm">
                                                <Group
                                                    gap="xs"
                                                    justify="space-between"
                                                >
                                                    <Text size="xs">
                                                        {courseProgress[
                                                            course.id
                                                        ]?.completed ?? 0}{' '}
                                                        of{' '}
                                                        {courseProgress[
                                                            course.id
                                                        ]?.total ?? 0}{' '}
                                                        posts completed
                                                    </Text>
                                                </Group>
                                                <Group gap="md" align="center">
                                                    <RingProgress
                                                        size={80}
                                                        thickness={8}
                                                        sections={[
                                                            {
                                                                value:
                                                                    courseProgress[
                                                                        course
                                                                            .id
                                                                    ]
                                                                        ?.percentage ??
                                                                    0,
                                                                color:
                                                                    (courseProgress[
                                                                        course
                                                                            .id
                                                                    ]
                                                                        ?.percentage ??
                                                                        0) ===
                                                                    100
                                                                        ? 'green'
                                                                        : 'blue',
                                                            },
                                                        ]}
                                                        label={
                                                            <Text
                                                                size="xs"
                                                                ta="center"
                                                                fw={700}
                                                            >
                                                                {courseProgress[
                                                                    course.id
                                                                ]?.percentage ??
                                                                    0}
                                                                %
                                                            </Text>
                                                        }
                                                    />
                                                </Group>
                                            </Stack>
                                        )}
                                </Stack>
                            </Card>
                        ))}
                    </SimpleGrid>
                )}
            </div>
        </Stack>
    );
}
