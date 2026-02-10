import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Stack,
    Text,
    Card,
    Group,
    Badge,
    SimpleGrid,
    Alert,
} from '@mantine/core';
import { IconUsersGroup } from '@tabler/icons-react';
import { useAuth } from '../../contexts/AuthContext';
import { getGroups, getGroup } from '../../utils/api';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import UserPageLayout from '../../components/layout/UserPageLayout';
import type { Group as GroupType } from '../../types/api';

interface GroupWithMemberCount extends GroupType {
    member_count?: number;
}

export default function PracticeGroupsPage() {
  const { API_URL } = useAuth();
  const navigate = useNavigate();
  const [groups, setGroups] = useState<GroupWithMemberCount[]>([])
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchItems() {
      try {
        setLoading(true);
        setError(null);
        const token = localStorage.getItem('auth_token');
        const res = await fetch(`${API_URL}/groups`, {
          headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        });
        if (!res.ok) throw new Error('Failed to fetch groups');
        setItems(await res.json());
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    }
    fetchItems();
  }, [API_URL]);

  // UI states
  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;
  if (items.length === 0) return <div>No groups found.</div>;

  const breadcrumbs = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'My Groups', href: '#' },
  ];
  const { items: any } = fetchItems();
  
  const filterItems = (query: string) => {
    return items.filter((item: any) => 
      item.name.toLowerCase().includes(query.toLowerCase())
    );
  };

  return (
    <UserPageLayout
          breadcrumbs={breadcrumbs}
          title="My Groups Practice Page"
          description="View all stuff"
          icon={IconUsersGroup}
          
          content={
              <ul>
                  {items.map((item: any) => (
                      <li key={item.id}>
                          <a
                              href="#"
                              onClick={() => navigate(`/dashboard/user/groups/${item.id}`)}
                          >
                              {item.name}
                          </a>
                      </li>
                  ))}
              </ul>
          }
      />
  );
}


// <>
//                   {groups.length === 0 ? (
//                       <Alert color="primary" title="No Groups">
//                           You are not currently a member of any groups.
//                           Contact your administrator to be added to a group.
//                       </Alert>
//                   ) : (
//                       <SimpleGrid
//                           cols={{ base: 1, sm: 2, lg: 3 }}
//                           spacing="lg"
//                       >
//                           {groups.map((group) => (
//                               <Card
//                                   key={group.id}
//                                   shadow="sm"
//                                   padding="lg"
//                                   radius="md"
//                                   withBorder
//                                   onClick={() =>
//                                       navigate(
//                                           `/dashboard/user/groups/${group.id}`
//                                       )
//                                   }
//                                   style={{ cursor: 'pointer' }}
//                               >
//                                   <Stack gap="md">
//                                       <Group
//                                           justify="space-between"
//                                           align="flex-start"
//                                       >
//                                           <Text fw={500} size="lg">
//                                               {group.name}
//                                           </Text>
//                                           <Badge variant="light">
//                                               {group.member_count || 0} member
//                                               {(group.member_count || 0) !== 1
//                                                   ? 's'
//                                                   : ''}
//                                           </Badge>
//                                       </Group>
//                                       {group.description && (
//                                           <Text
//                                               size="sm"
//                                               c="dimmed"
//                                               lineClamp={3}
//                                           >
//                                               {group.description}
//                                           </Text>
//                                       )}
//                                   </Stack>
//                               </Card>
//                           ))}
//                       </SimpleGrid>
//                   )}
//               </>