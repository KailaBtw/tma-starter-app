import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useDisclosure } from '@mantine/hooks';
import { IconEdit } from '@tabler/icons-react';
import { useAuth } from '../../contexts/AuthContext';
import { getModule, patchModule } from '../../utils/api';
import AdminPageLayout from '../../components/layout/AdminPageLayout';
import EditModuleModal from '../../components/modules/EditModuleModal';
import { usePageState } from '../../hooks/usePageState';
import type { ModuleUpdate, ModuleDetail } from '../../types/api';
import ModuleDetailCard from '../../components/modules/ModuleDetailCard';

export default function ModuleDetailPage() {
    const { moduleId } = useParams<{ moduleId: string }>();
    const { userInfo } = useAuth();
    const [editModalOpened, { open: openEditModal, close: closeEditModal }] =
        useDisclosure(false);

    // Form state for moduile edit
    const [moduleTitle, setModuleTitle] = useState('');
    const [moduleDescription, setModuleDescription] = useState('');
    const [module, setModule] = useState<ModuleDetail | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Check if user can edit (admin only)
    const canEdit = userInfo?.role?.name === 'admin';

    async function fetchModule() {
        if (!moduleId) return;
        setLoading(true);
        setError(null);
        try {
            const moduleData = await getModule(Number(moduleId));
            setModule(moduleData);
        } catch (err) {
            const errorMessage =
                err instanceof Error ? err.message : 'Unknown error';
            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        if (moduleId) {
            fetchModule();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [moduleId]);

    // Initialize form state when module loads
    useEffect(() => {
        if (module) {
            setModuleTitle(module.title);
            setModuleDescription(module.description || '');
        }
    }, [module]);

    function handleEditModule() {
        if (module) {
            setModuleTitle(module.title);
            setModuleDescription(module.description || '');
            openEditModal();
        }
    }

    async function handleUpdateModule(e: React.FormEvent) {
        e.preventDefault();
        if (!moduleId) return;
        setLoading(true);
        setError(null);

        try {
            const updateData: ModuleUpdate = {
                title: moduleTitle.trim(),
                description: moduleDescription.trim() || null,
            };

            await patchModule(Number(moduleId), updateData);
            closeEditModal();
            await fetchModule();
        } catch (err) {
            const errorMessage =
                err instanceof Error ? err.message : 'Unknown error';
            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    }

    const pageState = usePageState({
        data: module,
        loading,
        error,
        notFoundMessage: 'module Not Found',
    });

    if (!pageState.shouldRenderContent) {
        return pageState.component;
    }

    if (!module) {
        return null;
    }

    const breadcrumbs = [
        { title: 'Dashboard', href: '/dashboard/modules' },
        { title: 'Modules', href: '/dashboard/modules' },
        { title: module.title, href: '#' },
    ];

    // Prepare menu items for PageHeader
    const menuItems = canEdit
        ? [
              {
                  label: 'Edit Module',
                  icon: <IconEdit size={16} />,
                  onClick: handleEditModule,
              },
          ]
        : undefined;

    return (
        <AdminPageLayout
            breadcrumbs={breadcrumbs}
            title={module.title}
            description={module.description || undefined}
            menuItems={menuItems}
            content={
                <>
                    <ModuleDetailCard
                        description={module.description || undefined}
                        title={module.title}
                        canEdit={canEdit}
                        onEdit={handleEditModule}
                    />
                    {/* Edit module Modal */}
                    {canEdit && (
                        <EditModuleModal
                            opened={editModalOpened}
                            onClose={closeEditModal}
                            moduleTitle={moduleTitle}
                            moduleDescription={moduleDescription}
                            onTitleChange={(
                                e: React.ChangeEvent<HTMLInputElement>
                            ) => setModuleTitle(e.currentTarget.value)}
                            onDescriptionChange={(
                                e: React.ChangeEvent<HTMLTextAreaElement>
                            ) => setModuleDescription(e.currentTarget.value)}
                            onSubmit={handleUpdateModule}
                            loading={loading}
                        />
                    )}
                </>
            }
        />
    );
}
