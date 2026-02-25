import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Stack,
    TextInput,
    Button,
    Alert,
    Paper,
    Title,
    Group,
    Divider,
    Grid,
} from '@mantine/core';
import { createModule } from '../../utils/api';
import AdminPageLayout from '../../components/layout/AdminPageLayout';
import type { ModuleCreate } from '../../types/api';


export default function CreateModulePage() {
    const navigate = useNavigate();
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Form state - required fields
    const [title, setTitle] = useState('');

    // Optional fields
    const [description, setDescription] = useState('');
    const [color, setColor] = useState('');

    async function handleSubmit(e: React.FormEvent) {
            e.preventDefault();
            setSaving(true);
            setError(null);
    
            try {
                const moduleData: ModuleCreate = {
                    title: title.trim(),
                    description: description.trim() || null,
                    color: color.trim() || null
                };

                await createModule(moduleData);
                        // Navigate back to modules list
                        navigate('/dashboard/courses/${course.id}');
                    } catch (err) {
                        const errorMessage =
                            err instanceof Error ? err.message : 'Unknown error';
                        setError(errorMessage);
                        setSaving(false);
                    }
                }

    const breadcrumbs = [
        { title: 'Dashboard', href: '/dashboard/users' }, //Maybe change this?
        { title: 'Modules', href: '/dashboard/modules' },
        { title: 'Create Module', href: '#' },
    ];

    return(
        <AdminPageLayout
                    breadcrumbs={breadcrumbs}
                    title="Create New Module"
                    description="Create a new module"
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
                                                label="Title"
                                                placeholder="Enter title"
                                                value={title}
                                                onChange={(e) =>
                                                    setTitle(e.currentTarget.value)
                                                }
                                                required
                                                disabled={saving}
                                                autoComplete="off"
                                                autoFocus
                                            />
                                        </Stack>
                                    </Stack>
        
                                    <Divider />
        
                                    {/* Optional Fields Section */}
                                    <Stack gap="md">
                                        <Title order={3}>
                                            Additional Information (Optional)
                                        </Title>
                                        <Grid>
                                            <Grid.Col span={{ base: 12, sm: 6 }}>
                                                <TextInput
                                                    label="Description"
                                                    placeholder="Enter a description"
                                                    value={description}
                                                    onChange={(e) =>
                                                        setDescription(
                                                            e.currentTarget.value
                                                        )
                                                    }
                                                    disabled={saving}
                                                />
                                            </Grid.Col>
                                            <Grid.Col span={{ base: 12, sm: 6 }}>
                                                <TextInput
                                                    label="Color"
                                                    placeholder="Enter module color"
                                                    value={color}
                                                    onChange={(e) =>
                                                        setColor(
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
                                            onClick={() => navigate('/dashboard/courses/${course.id}')}
                                            disabled={saving}
                                        >
                                            Cancel
                                        </Button>
                                        <Button 
                                            type="submit" 
                                            onClick={() => handleSubmit}
                                            loading={saving}
                                            >
                                            Create Module
                                        </Button>
                                    </Group>
                                </Stack>
                            </form>
                        </Paper>
                    }
                />
            );
}
