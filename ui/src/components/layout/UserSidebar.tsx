import { useState, useEffect, useMemo, useCallback } from 'react';
import {
    Box,
    Stack,
    Group,
    NavLink,
    ActionIcon,
    Tooltip,
    Text,
} from '@mantine/core';
import { useMediaQuery } from '@mantine/hooks';
import { useNavigate, useLocation, useParams } from 'react-router-dom';
import {
    IconBook,
    IconUsersGroup,
    IconChartBar,
    IconChevronLeft,
    IconChevronRight,
} from '@tabler/icons-react';
import { useSidebar } from '../../hooks/useSidebar';
import { useAuth } from '../../contexts/AuthContext';
import { getCourse } from '../../utils/api';
import type { CourseDetail } from '../../types/api';

export const USER_SIDEBAR_WIDTH = 240;
export const USER_SIDEBAR_COLLAPSED_WIDTH = 60;

interface NavItem {
    label: string;
    icon: React.ComponentType<{ size?: number }>;
    value: string;
    path: string;
}

const navItems: NavItem[] = [
    {
        label: 'My Courses',
        icon: IconBook,
        value: 'courses',
        path: '/dashboard/user/courses',
    },
    {
        label: 'My Groups',
        icon: IconUsersGroup,
        value: 'groups',
        path: '/dashboard/user/groups',
    },
    {
        label: 'Progress',
        icon: IconChartBar,
        value: 'progress',
        path: '/dashboard/user/progress',
    },
];

// Module unlocking logic will be implemented by students

interface UserSidebarProps {
    contentOnly?: boolean;
}

export default function UserSidebar({ contentOnly = false }: UserSidebarProps) {
    // ALL HOOKS MUST BE CALLED FIRST - before any conditional returns
    const { collapsed, setCollapsed, closeDrawer } = useSidebar();
    const navigate = useNavigate();
    const location = useLocation();
    const params = useParams();
    const { userInfo, API_URL } = useAuth();
    const isUser = userInfo?.role?.name === 'user';
    const isAdmin = userInfo?.role?.name === 'admin';
    const isMobile = useMediaQuery('(max-width: 768px)');

    // Check if we're on a preview route (admins can see sidebar in preview mode)
    const isPreviewRoute = location.pathname.includes('/preview');

    // Course navigation state (modules will be implemented by students)
    const [course, setCourse] = useState<CourseDetail | null>(null);
    const [, setLoadingCourse] = useState(false);

    // Determine active section based on current route
    const getCurrentSection = (): string => {
        const path = location.pathname;
        if (path.startsWith('/dashboard/user/courses')) return 'courses';
        if (path.startsWith('/dashboard/user/groups')) return 'groups';
        if (path.startsWith('/dashboard/user/progress')) return 'progress';
        // Default to courses for homepage and /dashboard
        if (path === '/' || path === '/dashboard') return 'courses';
        return 'courses';
    };

    const currentSection = getCurrentSection();
    const courseId = params.courseId;
    // Module ID will be used when module navigation is implemented
    // const moduleId = params.moduleId ? parseInt(params.moduleId) : null;

    // Check if we're on a course or module page (memoized to prevent infinite loops)
    // Include both user routes and preview routes
    const showCourseNav = useMemo(() => {
        const path = location.pathname;
        return !!(
            path.match(/\/dashboard\/user\/courses\/\d+$/) ||
            path.match(/\/dashboard\/user\/courses\/\d+\/modules\/\d+$/) ||
            path.match(/\/dashboard\/courses\/\d+\/modules\/\d+\/preview$/)
        );
    }, [location.pathname]);

    const fetchCourseData = useCallback(async () => {
        if (!courseId || !API_URL) return;

        setLoadingCourse(true);
        try {
            // Fetch course
            const courseData = await getCourse(Number(courseId), API_URL);
            setCourse(courseData);
            // Module functionality will be implemented by students
        } catch (err) {
            console.error('Error fetching course data:', err);
        } finally {
            setLoadingCourse(false);
        }
    }, [courseId, API_URL]);

    // Fetch course data when on course pages
    useEffect(() => {
        if (showCourseNav && courseId && API_URL) {
            fetchCourseData();
        } else {
            setCourse(null);
        }
    }, [showCourseNav, courseId, fetchCourseData, API_URL]);

    // NOW we can do early returns - all hooks have been called
    // Desktop: Show sidebar if user is a regular user OR if on preview route
    if (!isMobile && !isUser && !isPreviewRoute) {
        return null;
    }

    const handleNavClick = (item: NavItem) => {
        navigate(item.path);
        if (isMobile) {
            closeDrawer();
        }
    };

    // Module navigation will be implemented by students

    const toggleCollapsed = () => {
        setCollapsed(!collapsed);
    };

    // Render navigation content (reusable for both sidebar and drawer)
    const renderNavContent = (showLabels = true) => (
        <Stack gap={0} p="xs" style={{ flex: 1, overflowY: 'auto' }}>
            {navItems.map((item) => {
                const Icon = item.icon;
                const isActive =
                    currentSection === item.value && !showCourseNav;
                const isCoursesItem = item.value === 'courses';

                // For "My Courses", render with children if on course/module page
                const hasSubmenu =
                    isCoursesItem && showCourseNav && course && showLabels;
                const navLink = (
                    <NavLink
                        key={item.value}
                        label={showLabels ? item.label : undefined}
                        leftSection={<Icon size={20} />}
                        active={isActive}
                        opened={hasSubmenu ? true : undefined}
                        onClick={(e) => {
                            if (hasSubmenu) {
                                e.preventDefault();
                                e.stopPropagation();
                            } else {
                                handleNavClick(item);
                            }
                        }}
                        style={{
                            borderRadius: 'var(--mantine-radius-md)',
                            marginBottom: '4px',
                        }}
                        variant="subtle"
                    >
                        {/* Course and Module Navigation - TODO: Students will implement modules */}
                        {hasSubmenu && (
                            <Stack gap={0} pl="md" mt={4} mb={4}>
                                <Text
                                    size="xs"
                                    fw={600}
                                    c="dimmed"
                                    px="xs"
                                    py={2}
                                    style={{
                                        textTransform: 'uppercase',
                                        letterSpacing: '0.5px',
                                    }}
                                >
                                    {course.title}
                                </Text>
                                <Text size="sm" c="dimmed" px="xs" py={2}>
                                    Modules will be implemented by students
                                </Text>
                            </Stack>
                        )}
                    </NavLink>
                );

                if (!showLabels) {
                    return (
                        <Tooltip
                            key={item.value}
                            label={item.label}
                            position="right"
                        >
                            <div>{navLink}</div>
                        </Tooltip>
                    );
                }

                return navLink;
            })}
        </Stack>
    );

    // If contentOnly mode, just render the navigation content
    if (contentOnly) {
        const isHomepage =
            location.pathname === '/' || location.pathname === '/dashboard';
        const hasAccess = isUser || isPreviewRoute || (isHomepage && !isAdmin);
        if (!hasAccess) {
            return null;
        }
        // Render just the content (used in unified mobile drawer)
        return renderNavContent(true);
    }

    // Mobile: Don't render drawer here - Layout handles the unified drawer
    if (isMobile) {
        return null;
    }

    // Desktop: Render as fixed sidebar
    return (
        <Box
            style={{
                position: 'fixed',
                left: 0,
                top: '70px', // Below navbar
                height: 'calc(100vh - 70px)',
                width: collapsed
                    ? USER_SIDEBAR_COLLAPSED_WIDTH
                    : USER_SIDEBAR_WIDTH,
                backgroundColor: 'var(--mantine-color-white)',
                borderRight: '1px solid var(--mantine-color-gray-2)',
                transition: 'width 0.2s ease',
                zIndex: 100,
                overflow: 'hidden',
            }}
        >
            <Stack gap={0} h="100%">
                {/* Collapse Toggle */}
                <Group
                    justify={collapsed ? 'center' : 'flex-end'}
                    p="sm"
                    style={{
                        borderBottom: '1px solid var(--mantine-color-gray-2)',
                    }}
                >
                    <Tooltip
                        label={
                            collapsed ? 'Expand sidebar' : 'Collapse sidebar'
                        }
                        position="right"
                    >
                        <ActionIcon
                            variant="subtle"
                            onClick={toggleCollapsed}
                            size="sm"
                        >
                            {collapsed ? (
                                <IconChevronRight size={16} />
                            ) : (
                                <IconChevronLeft size={16} />
                            )}
                        </ActionIcon>
                    </Tooltip>
                </Group>

                {/* Navigation Items */}
                {renderNavContent(!collapsed)}
            </Stack>
        </Box>
    );
}
