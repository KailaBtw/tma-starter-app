import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Stack,
    TextInput,
    PasswordInput,
    Button,
    Alert,
    Paper,
    Title,
    Group,
    Select,
    Divider,
    Grid,
} from '@mantine/core';
import { createUser } from '../../utils/api';
import AdminPageLayout from '../../components/layout/AdminPageLayout';
import type { UserCreate } from '../../types/api';

export default function CreateUserPage() {
    const navigate = useNavigate();
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Form state - required fields
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [role, setRole] = useState('user');

    // Profile fields (optional)
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [childName, setChildName] = useState('');
    const [childSex, setChildSex] = useState('');
    const [childDob, setChildDob] = useState('');

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setSaving(true);
        setError(null);

        try {
            const userData: UserCreate = {
                username: username.trim(),
                email: email.trim(),
                password: password,
                role: role,
                first_name: firstName.trim() || null,
                last_name: lastName.trim() || null,
                child_name: childName.trim() || null,
                child_sex_assigned_at_birth: childSex || null,
                child_dob: childDob || null,
            };

            await createUser(userData);
            // Navigate back to users list
            navigate('/dashboard/users');
        } catch (err) {
            const errorMessage =
                err instanceof Error ? err.message : 'Unknown error';
            setError(errorMessage);
            setSaving(false);
        }
    }

    const breadcrumbs = [
        { title: 'Dashboard', href: '/dashboard/users' },
        { title: 'Users', href: '/dashboard/users' },
        { title: 'Create User', href: '#' },
    ];

    return (
        <AdminPageLayout
            breadcrumbs={breadcrumbs}
            title="Create New User"
            description="Create a new user account"
            content={
                <Paper p="xl" withBorder>
                    <form onSubmit={handleSubmit}>
                        <Stack gap="xl">
                            {error && (
                                <Alert color="red" title="Error">
                                    {error}
                                </Alert>
                            )}

                            {/* Required Fields Section */}
                            <Stack gap="md">
                                <Title order={3}>Required Information</Title>
                                <Stack gap="md">
                                    <TextInput
                                        label="Username"
                                        placeholder="Enter username"
                                        value={username}
                                        onChange={(e) =>
                                            setUsername(e.currentTarget.value)
                                        }
                                        required
                                        disabled={saving}
                                        autoComplete="off"
                                        autoFocus
                                    />
                                    <TextInput
                                        label="Email"
                                        placeholder="Enter email"
                                        type="email"
                                        value={email}
                                        onChange={(e) =>
                                            setEmail(e.currentTarget.value)
                                        }
                                        required
                                        disabled={saving}
                                        autoComplete="email"
                                    />
                                    <PasswordInput
                                        label="Password"
                                        placeholder="Enter password"
                                        value={password}
                                        onChange={(e) =>
                                            setPassword(e.currentTarget.value)
                                        }
                                        required
                                        disabled={saving}
                                        autoComplete="new-password"
                                    />
                                    <Select
                                        label="Role"
                                        placeholder="Select role"
                                        data={[
                                            {
                                                value: 'user',
                                                label: 'User',
                                            },
                                            {
                                                value: 'manager',
                                                label: 'Manager',
                                            },
                                            {
                                                value: 'admin',
                                                label: 'Admin',
                                            },
                                        ]}
                                        value={role}
                                        onChange={(value) =>
                                            setRole(value || 'user')
                                        }
                                        disabled={saving}
                                    />
                                </Stack>
                            </Stack>

                            <Divider />

                            {/* Profile Fields Section */}
                            <Stack gap="md">
                                <Title order={3}>
                                    Profile Information (Optional)
                                </Title>
                                <Grid>
                                    <Grid.Col span={{ base: 12, sm: 6 }}>
                                        <TextInput
                                            label="First Name"
                                            placeholder="Enter first name"
                                            value={firstName}
                                            onChange={(e) =>
                                                setFirstName(
                                                    e.currentTarget.value
                                                )
                                            }
                                            disabled={saving}
                                        />
                                    </Grid.Col>
                                    <Grid.Col span={{ base: 12, sm: 6 }}>
                                        <TextInput
                                            label="Last Name"
                                            placeholder="Enter last name"
                                            value={lastName}
                                            onChange={(e) =>
                                                setLastName(
                                                    e.currentTarget.value
                                                )
                                            }
                                            disabled={saving}
                                        />
                                    </Grid.Col>
                                    <Grid.Col span={{ base: 12, sm: 6 }}>
                                        <TextInput
                                            label="Child's Name"
                                            placeholder="Enter child's name"
                                            value={childName}
                                            onChange={(e) =>
                                                setChildName(
                                                    e.currentTarget.value
                                                )
                                            }
                                            disabled={saving}
                                        />
                                    </Grid.Col>
                                    <Grid.Col span={{ base: 12, sm: 6 }}>
                                        <Select
                                            label="Child's Sex"
                                            placeholder="Select sex"
                                            data={[
                                                {
                                                    value: 'M',
                                                    label: 'Male',
                                                },
                                                {
                                                    value: 'F',
                                                    label: 'Female',
                                                },
                                            ]}
                                            value={childSex}
                                            onChange={(value) =>
                                                setChildSex(value || '')
                                            }
                                            disabled={saving}
                                        />
                                    </Grid.Col>
                                    <Grid.Col span={{ base: 12, sm: 6 }}>
                                        <TextInput
                                            label="Child's Date of Birth"
                                            placeholder="YYYY-MM-DD"
                                            type="date"
                                            value={childDob}
                                            onChange={(e) =>
                                                setChildDob(
                                                    e.currentTarget.value
                                                )
                                            }
                                            disabled={saving}
                                        />
                                    </Grid.Col>
                                </Grid>
                            </Stack>

                            <Group justify="flex-end" mt="xl">
                                <Button
                                    variant="subtle"
                                    onClick={() => navigate('/dashboard/users')}
                                    disabled={saving}
                                >
                                    Cancel
                                </Button>
                                <Button type="submit" loading={saving}>
                                    Create User
                                </Button>
                            </Group>
                        </Stack>
                    </form>
                </Paper>
            }
        />
    );
}
