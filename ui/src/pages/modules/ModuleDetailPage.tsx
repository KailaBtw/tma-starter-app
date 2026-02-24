import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { IconTrash } from '@tabler/icons-react';
import { deleteModule } from '../../utils/api';
import AdminPageLayout from '../../components/layout/AdminPageLayout';

export default function ModuleDetailPage() {
    const { moduleId } = useParams<{ moduleId: string }>();
    const navigate = useNavigate();

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    async function handleDeleteModule() {
        if (!moduleId) return;

        //Confirming delete message
        const confirmation = window.confirm(
            'Are you sure you want to delete this module?'
        );
        if (!confirmation) return;

        setLoading(true);
        setError(null);
        try {
            await deleteModule(Number(moduleId));
            navigate(-1);
        } catch (err) {
            setError(
                err instanceof Error
                    ? err.message
                    : 'Failed to delete the Module.'
            );
        } finally {
            setLoading(false);
        }
    }

    const breadcrumbs = [
        { title: 'Dashboard', href: '/dashboard/modules' },
        { title: 'Modules', href: '/dashboard/modules' },
        { title: 'Module Detail', href: '#' },
    ];

    const menuItems = [
        {
            label: loading ? 'Deleting...' : 'Delete Module',
            icon: <IconTrash size={16} />,
            onClick: handleDeleteModule,
            disabled: loading,
        },
    ];

    return (
        <AdminPageLayout
            breadcrumbs={breadcrumbs}
            title="Module Detail"
            menuItems={menuItems}
            content={
                <>
                    {error && <p style={{ color: 'red' }}>{error}</p>}
                    <p>Module details will be implemented</p>
                </>
            }
        />
    );
}
