import { Stack, Text, Alert, Card } from '@mantine/core';
import { IconChartBar } from '@tabler/icons-react';
import UserPageLayout from '../../components/layout/UserPageLayout';

export default function UserProgressPage() {
    const breadcrumbs = [
        { title: 'Dashboard', href: '/dashboard' },
        { title: 'Progress', href: '#' },
    ];

    return (
        <UserPageLayout
            breadcrumbs={breadcrumbs}
            title="Progress"
            description="Track your learning progress across courses"
            icon={IconChartBar}
            content={
                <Card shadow="sm" padding="lg" radius="md" withBorder>
                    <Stack gap="md">
                        <Alert color="primary" title="Coming Soon">
                            Progress tracking will be implemented in a future
                            assignment. This page will show your completion
                            status for courses and modules.
                        </Alert>
                    </Stack>
                </Card>
            }
        />
    );
}
