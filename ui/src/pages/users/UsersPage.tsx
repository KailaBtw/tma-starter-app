import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { getAllUsers, getGroups } from '../../utils/api';
import { useViewMode } from '../../hooks/useViewMode';
import { useTableSort } from '../../hooks/useTableSort';
import { buildUserGroupsMap } from '../../utils/userUtils';
import DataListView from '../../components/ui/DataListView';
import UserTableView from '../../components/users/UserTableView';
import UserCardView from '../../components/users/UserCardView';
import UserListHeader from '../../components/users/UserListHeader';
import AdminPageLayout from '../../components/layout/AdminPageLayout';
import type { User } from '../../types/api';

export default function UsersPage() {
    const { API_URL } = useAuth();
    const navigate = useNavigate();

    const [users, setUsers] = useState<User[]>([]);
    const [userGroups, setUserGroups] = useState<Record<number, string[]>>({}); // Map of user_id -> array of group names
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [viewMode, setViewMode] = useViewMode(true);
    const {
        sortedData: sortedUsers,
        sortColumn,
        sortDirection,
        handleSort,
    } = useTableSort(users as unknown as Record<string, unknown>[], {
        defaultSortColumn: 'username',
    });

    useEffect(() => {
        fetchUsers();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []); // fetchUsers is intentionally omitted - we only want to fetch on mount

    async function fetchUsers() {
        setLoading(true);
        setError(null);
        try {
            const [usersData, groupsData] = await Promise.all([
                getAllUsers(),
                getGroups(),
            ]);
            setUsers(usersData);

            // Build user groups mapping
            const userGroupsMap = await buildUserGroupsMap(groupsData);
            setUserGroups(userGroupsMap);
        } catch (err) {
            const errorMessage =
                err instanceof Error ? err.message : 'Unknown error';
            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    }

    function handleUserClick(user: User) {
        navigate(`/dashboard/users/${user.id}/edit`);
    }

    const breadcrumbs = [
        { title: 'Dashboard', href: '/dashboard' },
        { title: 'Users', href: '/dashboard/users' },
    ];

    return (
        <AdminPageLayout
            title="Users"
            description="Manage user accounts, roles, and permissions."
            breadcrumbs={breadcrumbs}
            content={
                <>
                    <UserListHeader
                        viewMode={viewMode}
                        setViewMode={setViewMode}
                        onCreateClick={() => navigate('/dashboard/users/new')}
                    />
                    <DataListView
                        tableView={
                            <UserTableView
                                users={sortedUsers as unknown as User[]}
                                userGroups={userGroups}
                                API_URL={API_URL}
                                onUserClick={handleUserClick}
                                sortColumn={sortColumn}
                                sortDirection={sortDirection}
                                onSort={handleSort}
                            />
                        }
                        cardView={
                            <UserCardView
                                users={sortedUsers as unknown as User[]}
                                userGroups={userGroups}
                                API_URL={API_URL}
                                onUserClick={handleUserClick}
                            />
                        }
                        viewMode={viewMode}
                        emptyMessage="No users found."
                        error={error}
                        onErrorClose={() => setError(null)}
                        loading={loading}
                        dataLength={users.length}
                    />
                </>
            }
        />
    );
}
