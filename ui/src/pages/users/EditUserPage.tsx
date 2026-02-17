import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Cropper, { Area } from 'react-easy-crop';
import {
    Container,
    Stack,
    Text,
    TextInput,
    Button,
    Alert,
    Paper,
    Group,
    Select,
    Switch,
    Modal,
    Title,
    Box,
    MultiSelect,
    Divider,
    FileButton,
    Avatar,
    Grid,
} from '@mantine/core';
import { IconUpload, IconPhoto } from '@tabler/icons-react';
import { useAuth } from '../../contexts/AuthContext';
import {
    getAllUsers,
    updateUserStatus,
    updateUserRole,
    updateUserProfile,
    getGroups,
    getGroup,
    addMemberToGroup,
    removeMemberFromGroup,
    getAuthHeaders,
} from '../../utils/api';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import AdminPageLayout from '../../components/layout/AdminPageLayout';
import type { User, Group as ApiGroup } from '../../types/api';

interface Crop {
    x: number;
    y: number;
}

export default function EditUserPage() {
    const { userId } = useParams<{ userId: string }>();
    const navigate = useNavigate();
    const { API_URL, userInfo } = useAuth();
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [deleteModalOpened, setDeleteModalOpened] = useState(false);
    const openDeleteModal = () => setDeleteModalOpened(true);
    const closeDeleteModal = () => setDeleteModalOpened(false);
    const [allGroups, setAllGroups] = useState<ApiGroup[]>([]);
    const [userGroups, setUserGroups] = useState<string[]>([]); // Array of group IDs the user is in

    // Form state
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [role, setRole] = useState('user');
    const [isActive, setIsActive] = useState(true);
    const [emailVerified, setEmailVerified] = useState(false);
    const [selectedGroups, setSelectedGroups] = useState<string[]>([]); // Selected group IDs for MultiSelect

    // Profile fields
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [childName, setChildName] = useState('');
    const [childSex, setChildSex] = useState<string | null>('');
    const [childDob, setChildDob] = useState('');
    const [avatarUrl, setAvatarUrl] = useState('');

    // Avatar upload state
    const [avatarFile, setAvatarFile] = useState<File | null>(null);
    const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
    const [cropModalOpened, setCropModalOpened] = useState(false);
    const [crop, setCrop] = useState<Crop>({ x: 0, y: 0 });
    const [zoom, setZoom] = useState(1);
    const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(
        null
    );
    const [uploadingAvatar, setUploadingAvatar] = useState(false);

    useEffect(() => {
        if (userId) {
            fetchUser();
        }
        fetchGroups();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [userId]);

    async function fetchGroups() {
        try {
            const groups = await getGroups();
            setAllGroups(groups);
        } catch (err) {
            console.error('Failed to fetch groups:', err);
        }
    }

    async function fetchUser() {
        if (!userId) return;
        setLoading(true);
        setError(null);
        try {
            const [users, groups] = await Promise.all([
                getAllUsers(),
                getGroups(),
            ]);

            const foundUser = users.find((u) => u.id === parseInt(userId));
            if (!foundUser) {
                setError('User not found');
                return;
            }
            setUser(foundUser);
            setUsername(foundUser.username);
            setEmail(foundUser.email);
            setRole(foundUser.role?.name || 'user');
            setIsActive(foundUser.is_active);
            setEmailVerified(foundUser.email_verified);

            // Set profile fields
            setFirstName(foundUser.first_name || '');
            setLastName(foundUser.last_name || '');
            setChildName(foundUser.child_name || '');
            setChildSex(foundUser.child_sex_assigned_at_birth || '');
            setChildDob(foundUser.child_dob || '');
            // Construct full URL if it's a relative path
            const avatarUrlValue = foundUser.avatar_url || '';
            const fullAvatarUrl =
                avatarUrlValue && !avatarUrlValue.startsWith('http')
                    ? `${API_URL.replace('/api', '')}${avatarUrlValue}`
                    : avatarUrlValue;
            setAvatarUrl(fullAvatarUrl);
            setAvatarPreview(fullAvatarUrl || null);

            // Fetch user's current groups
            const userGroupIds: string[] = [];
            for (const group of groups) {
                try {
                    const groupDetail = await getGroup(group.id);
                    if (groupDetail.members) {
                        const isMember = groupDetail.members.some(
                            (m) => m.user_id === foundUser.id
                        );
                        if (isMember) {
                            userGroupIds.push(String(group.id));
                        }
                    }
                } catch (err) {
                    console.error(`Error fetching group ${group.id}:`, err);
                }
            }
            setUserGroups(userGroupIds);
            setSelectedGroups(userGroupIds);
        } catch (err) {
            const errorMessage =
                err instanceof Error ? err.message : 'Unknown error';
            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    }

    // Avatar upload handlers
    function handleFileSelect(file: File | null) {
        if (file) {
            const reader = new FileReader();
            reader.onload = () => {
                setAvatarPreview(reader.result as string);
                setAvatarFile(file);
                setCropModalOpened(true);
            };
            reader.readAsDataURL(file);
        }
    }

    const onCropComplete = useCallback(
        (_croppedArea: Area, croppedAreaPixels: Area) => {
            setCroppedAreaPixels(croppedAreaPixels);
        },
        []
    );

    async function handleCropAndUpload() {
        if (!avatarFile || !croppedAreaPixels) return;

        setUploadingAvatar(true);
        try {
            // Create canvas to crop image
            const image = await createImage(avatarPreview!);
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');

            if (!ctx) {
                throw new Error('Could not get canvas context');
            }

            canvas.width = 255;
            canvas.height = 255;

            ctx.drawImage(
                image,
                croppedAreaPixels.x,
                croppedAreaPixels.y,
                croppedAreaPixels.width,
                croppedAreaPixels.height,
                0,
                0,
                255,
                255
            );

            // Convert canvas to blob
            canvas.toBlob(async (blob) => {
                if (!blob) {
                    setUploadingAvatar(false);
                    return;
                }
                try {
                    // Upload cropped image
                    const formData = new FormData();
                    formData.append('file', blob, 'avatar.png');

                    const uploadHeaders = getAuthHeaders(false);
                    delete uploadHeaders['Content-Type'];

                    const uploadResponse = await fetch(
                        `${API_URL}/files/upload-avatar`,
                        {
                            method: 'POST',
                            headers: uploadHeaders,
                            body: formData,
                        }
                    );

                    if (!uploadResponse.ok) {
                        const errorData = await uploadResponse
                            .json()
                            .catch(() => ({}));
                        throw new Error(
                            errorData.detail ||
                                `Failed to upload avatar: ${uploadResponse.statusText}`
                        );
                    }

                    const result = await uploadResponse.json();
                    // Construct full URL if it's a relative path
                    const fullUrl = result.url.startsWith('http')
                        ? result.url
                        : `${API_URL.replace('/api', '')}${result.url}`;
                    setAvatarUrl(fullUrl);
                    setAvatarPreview(fullUrl);
                    setCropModalOpened(false);
                    setAvatarFile(null);
                } catch (err) {
                    const errorMessage =
                        err instanceof Error
                            ? err.message
                            : 'Failed to upload avatar';
                    setError(errorMessage);
                } finally {
                    setUploadingAvatar(false);
                }
            }, 'image/png');
        } catch (err) {
            const errorMessage =
                err instanceof Error ? err.message : 'Failed to process avatar';
            setError(errorMessage);
            setUploadingAvatar(false);
        }
    }

    function createImage(url: string): Promise<HTMLImageElement> {
        return new Promise((resolve, reject) => {
            const image = new Image();
            image.addEventListener('load', () => resolve(image));
            image.addEventListener('error', (error) => reject(error));
            image.src = url;
        });
    }

    async function handleSave(e: React.FormEvent) {
        e.preventDefault();
        if (!user) return;

        setSaving(true);
        setError(null);

        try {
            // Update role if changed
            if (role !== user.role?.name) {
                await updateUserRole(user.id, role);
            }

            // Update status if changed
            if (isActive !== user.is_active) {
                await updateUserStatus(user.id, isActive);
            }

            // Update profile fields
            const profileData = {
                first_name: firstName || null,
                last_name: lastName || null,
                child_name: childName || null,
                child_sex_assigned_at_birth: childSex || null,
                child_dob: childDob || null,
                avatar_url: avatarUrl || null,
            };
            await updateUserProfile(user.id, profileData);

            // Update group memberships
            const groupsToAdd = selectedGroups.filter(
                (gid) => !userGroups.includes(gid)
            );
            const groupsToRemove = userGroups.filter(
                (gid) => !selectedGroups.includes(gid)
            );

            // Add user to new groups
            for (const groupId of groupsToAdd) {
                try {
                    await addMemberToGroup(
                        parseInt(groupId),
                        user.id,
                        'member'
                    );
                } catch (err) {
                    console.error(
                        `Failed to add user to group ${groupId}:`,
                        err
                    );
                }
            }

            // Remove user from groups
            for (const groupId of groupsToRemove) {
                try {
                    await removeMemberFromGroup(parseInt(groupId), user.id);
                } catch (err) {
                    console.error(
                        `Failed to remove user from group ${groupId}:`,
                        err
                    );
                }
            }

            // Navigate back to users page
            navigate('/dashboard/users');
        } catch (err) {
            const errorMessage =
                err instanceof Error ? err.message : 'Failed to update user';
            setError(errorMessage);
        } finally {
            setSaving(false);
        }
    }

    async function handleDelete() {
        if (!user) return;

        setSaving(true);
        setError(null);

        try {
            // First disable the user
            await updateUserStatus(user.id, false);
            // TODO: Add delete user endpoint when backend supports it
            // For now, we'll just disable the user
            setError(
                'User deletion is not yet implemented. User has been disabled instead.'
            );
            // Navigate back after a delay
            setTimeout(() => {
                navigate('/dashboard/users');
            }, 2000);
        } catch (err) {
            const errorMessage =
                err instanceof Error ? err.message : 'Failed to delete user';
            setError(errorMessage);
        } finally {
            setSaving(false);
            closeDeleteModal();
        }
    }

    if (loading) {
        return <LoadingSpinner />;
    }

    if (error && !user) {
        return (
            <Container size="md">
                <Alert color="red" title="Error" mb="md">
                    {error}
                </Alert>
                <Button onClick={() => navigate('/dashboard/users')}>
                    Back to Users
                </Button>
            </Container>
        );
    }

    if (!user) {
        return (
            <Container size="md">
                <Alert color="primary" title="Not Found" mb="md">
                    User not found.
                </Alert>
                <Button onClick={() => navigate('/dashboard/users')}>
                    Back to Users
                </Button>
            </Container>
        );
    }

    const isCurrentUser = user.id === userInfo?.id;

    return (
        <>
            <AdminPageLayout
                breadcrumbs={[
                    { title: 'Dashboard', href: '/dashboard/users' },
                    { title: 'Users', href: '/dashboard/users' },
                    { title: user.username || 'Edit User', href: '#' },
                ]}
                title={`Edit User: ${user.username || ''}`}
                actions={
                    <Group gap="sm">
                        <Button
                            variant="subtle"
                            onClick={() => navigate('/dashboard/users')}
                            disabled={saving}
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={openDeleteModal}
                            color="red"
                            variant="light"
                            disabled={isCurrentUser || saving}
                        >
                            Delete User
                        </Button>
                    </Group>
                }
                content={
                    <>
                        {error && (
                            <Alert
                                color="red"
                                title="Error"
                                mb="md"
                                onClose={() => setError(null)}
                            >
                                {error}
                            </Alert>
                        )}

                        <Paper shadow="sm" p="xl" radius="md" withBorder>
                            <form onSubmit={handleSave}>
                                <Stack gap="md">
                                    <TextInput
                                        label="Username"
                                        value={username}
                                        onChange={(e) =>
                                            setUsername(e.currentTarget.value)
                                        }
                                        disabled
                                        description="Username cannot be changed"
                                    />

                                    <TextInput
                                        label="Email"
                                        value={email}
                                        onChange={(e) =>
                                            setEmail(e.currentTarget.value)
                                        }
                                        disabled
                                        description="Email cannot be changed"
                                    />

                                    <Title order={3} mb="md" mt="lg">
                                        Profile Information
                                    </Title>
                                    <Divider mb="md" />

                                    <Grid>
                                        <Grid.Col span={6}>
                                            <TextInput
                                                label="First Name"
                                                value={firstName}
                                                onChange={(e) =>
                                                    setFirstName(
                                                        e.currentTarget.value
                                                    )
                                                }
                                                disabled={saving}
                                            />
                                        </Grid.Col>
                                        <Grid.Col span={6}>
                                            <TextInput
                                                label="Last Name"
                                                value={lastName}
                                                onChange={(e) =>
                                                    setLastName(
                                                        e.currentTarget.value
                                                    )
                                                }
                                                disabled={saving}
                                            />
                                        </Grid.Col>
                                    </Grid>

                                    <Stack gap="xs">
                                        <Text size="sm" fw={500}>
                                            Avatar
                                        </Text>
                                        <Group gap="md">
                                            <Avatar
                                                src={avatarPreview || undefined}
                                                size={80}
                                                radius="md"
                                            >
                                                <IconPhoto size={40} />
                                            </Avatar>
                                            <Stack gap="xs" style={{ flex: 1 }}>
                                                <FileButton
                                                    onChange={handleFileSelect}
                                                    accept="image/*"
                                                    disabled={
                                                        saving ||
                                                        uploadingAvatar
                                                    }
                                                >
                                                    {(props) => (
                                                        <Button
                                                            {...props}
                                                            leftSection={
                                                                <IconUpload
                                                                    size={16}
                                                                />
                                                            }
                                                            variant="light"
                                                            disabled={
                                                                saving ||
                                                                uploadingAvatar
                                                            }
                                                        >
                                                            {uploadingAvatar
                                                                ? 'Uploading...'
                                                                : 'Upload Avatar'}
                                                        </Button>
                                                    )}
                                                </FileButton>
                                                {avatarUrl && (
                                                    <Text size="xs" c="dimmed">
                                                        Avatar will be cropped
                                                        to 255x255px
                                                    </Text>
                                                )}
                                            </Stack>
                                        </Group>
                                    </Stack>

                                    <Title order={3} mb="md" mt="lg">
                                        Child Information
                                    </Title>
                                    <Divider mb="md" />

                                    <TextInput
                                        label="Child's Name"
                                        value={childName}
                                        onChange={(e) =>
                                            setChildName(e.currentTarget.value)
                                        }
                                        disabled={saving}
                                    />

                                    <Grid>
                                        <Grid.Col span={6}>
                                            <Select
                                                label="Child's Sex"
                                                value={childSex}
                                                onChange={setChildSex}
                                                data={[
                                                    {
                                                        value: '',
                                                        label: 'Not specified',
                                                    },
                                                    {
                                                        value: 'male',
                                                        label: 'Male',
                                                    },
                                                    {
                                                        value: 'female',
                                                        label: 'Female',
                                                    },
                                                    {
                                                        value: 'other',
                                                        label: 'Other',
                                                    },
                                                ]}
                                                disabled={saving}
                                                clearable
                                            />
                                        </Grid.Col>
                                        <Grid.Col span={6}>
                                            <TextInput
                                                label="Child's Date of Birth"
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

                                    <Title order={3} mb="md" mt="lg">
                                        Account Settings
                                    </Title>
                                    <Divider mb="md" />

                                    <Select
                                        label="Role"
                                        value={role}
                                        onChange={(value: string | null) =>
                                            setRole(value || 'user')
                                        }
                                        data={[
                                            { value: 'user', label: 'User' },
                                            {
                                                value: 'manager',
                                                label: 'Manager',
                                            },
                                            { value: 'admin', label: 'Admin' },
                                        ]}
                                        disabled={isCurrentUser || saving}
                                        description={
                                            isCurrentUser
                                                ? 'You cannot change your own role'
                                                : 'Select the user role'
                                        }
                                    />

                                    <Switch
                                        label="Account Active"
                                        checked={isActive}
                                        onChange={(e) =>
                                            setIsActive(e.currentTarget.checked)
                                        }
                                        disabled={isCurrentUser || saving}
                                        description={
                                            isCurrentUser
                                                ? 'You cannot disable your own account'
                                                : 'Enable or disable this user account'
                                        }
                                    />

                                    <Paper p="sm" withBorder bg="gray.0">
                                        <Stack gap="xs">
                                            <Text size="sm" fw={500}>
                                                Email Status
                                            </Text>
                                            <Text
                                                size="sm"
                                                c={
                                                    emailVerified
                                                        ? 'green'
                                                        : 'orange'
                                                }
                                            >
                                                {emailVerified
                                                    ? 'Verified'
                                                    : 'Unverified'}
                                            </Text>
                                        </Stack>
                                    </Paper>

                                    <MultiSelect
                                        label="Groups"
                                        placeholder="Select groups"
                                        data={allGroups.map((group) => ({
                                            value: String(group.id),
                                            label: group.name,
                                        }))}
                                        value={selectedGroups}
                                        onChange={setSelectedGroups}
                                        disabled={saving}
                                        searchable
                                        description="Add or remove this user from groups"
                                    />

                                    <Group justify="flex-end" mt="md">
                                        <Button
                                            variant="subtle"
                                            onClick={() =>
                                                navigate('/dashboard/users')
                                            }
                                            disabled={saving}
                                        >
                                            Cancel
                                        </Button>
                                        <Button type="submit" loading={saving}>
                                            Save Changes
                                        </Button>
                                    </Group>
                                </Stack>
                            </form>
                        </Paper>
                    </>
                }
            />

            {/* Delete Confirmation Modal */}
            <Modal
                opened={deleteModalOpened}
                onClose={closeDeleteModal}
                title="Delete User"
                centered
            >
                <Stack gap="md">
                    <Text>
                        Are you sure you want to delete user{' '}
                        <strong>{user.username}</strong>? This action cannot be
                        undone.
                    </Text>
                    <Text size="sm" c="dimmed">
                        Note: User deletion is not yet fully implemented. The
                        user will be disabled instead.
                    </Text>
                    <Group justify="flex-end">
                        <Button variant="subtle" onClick={closeDeleteModal}>
                            Cancel
                        </Button>
                        <Button
                            color="red"
                            onClick={handleDelete}
                            loading={saving}
                        >
                            Delete User
                        </Button>
                    </Group>
                </Stack>
            </Modal>

            {/* Avatar Crop Modal */}
            <Modal
                opened={cropModalOpened}
                onClose={() => {
                    setCropModalOpened(false);
                    setAvatarFile(null);
                    setAvatarPreview(avatarUrl || null);
                }}
                title="Crop Avatar"
                size="lg"
            >
                <Stack gap="md">
                    <Box
                        style={{
                            position: 'relative',
                            width: '100%',
                            height: 400,
                            background: '#000',
                        }}
                    >
                        {avatarPreview && (
                            <Cropper
                                image={avatarPreview}
                                crop={crop}
                                zoom={zoom}
                                aspect={1}
                                onCropChange={setCrop}
                                onZoomChange={setZoom}
                                onCropComplete={onCropComplete}
                            />
                        )}
                    </Box>
                    <Group justify="space-between">
                        <Text size="sm" c="dimmed">
                            Drag to reposition, scroll to zoom
                        </Text>
                        <Group>
                            <Button
                                variant="subtle"
                                onClick={() => {
                                    setCropModalOpened(false);
                                    setAvatarFile(null);
                                    setAvatarPreview(avatarUrl || null);
                                }}
                                disabled={uploadingAvatar}
                            >
                                Cancel
                            </Button>
                            <Button
                                onClick={handleCropAndUpload}
                                loading={uploadingAvatar}
                            >
                                Upload Avatar
                            </Button>
                        </Group>
                    </Group>
                </Stack>
            </Modal>
        </>
    );
}
