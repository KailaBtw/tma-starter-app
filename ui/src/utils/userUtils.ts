/**
 * Construct full avatar URL from relative or absolute URL
 * @param avatarUrl - Avatar URL (can be relative or absolute)
 * @param apiUrl - Base API URL
 * @returns Full avatar URL or null
 */
import { getApiUrl } from './apiClient';

export function getAvatarUrl(
    avatarUrl: string | null | undefined,
    apiUrl: string
): string | null {
    if (!avatarUrl) return null;
    // If it's already a full URL (starts with http), return as is
    if (avatarUrl.startsWith('http')) {
        return avatarUrl;
    }
    // Otherwise, construct full URL from API base
    return `${apiUrl.replace('/api', '')}${avatarUrl}`;
}

import { designTokens } from '../designTokens';

/**
 * Get badge color for user role
 * @param roleName - Role name ('admin', 'manager', 'user', 'owner', 'moderator', 'member')
 * @returns Hex color code from design tokens
 */
export function getRoleBadgeColor(roleName: string): string {
    const role = roleName?.toLowerCase();
    switch (role) {
        case 'admin':
            return designTokens.roles.admin;
        case 'manager':
            return designTokens.roles.manager;
        case 'owner':
            return designTokens.roles.owner;
        case 'moderator':
            return designTokens.roles.moderator;
        case 'member':
            return designTokens.roles.member;
        case 'user':
            return designTokens.roles.user;
        default:
            return designTokens.roles.user;
    }
}

/**
 * Build a map of user_id -> array of group names
 * @param groups - Array of group objects
 * @param apiUrl - Base API URL
 * @returns Map of user_id -> array of group names
 */
export async function buildUserGroupsMap(
    groups: Array<{ id: number; name: string }>,
    apiUrl = getApiUrl()
): Promise<Record<number, string[]>> {
    const { getGroup } = await import('./api');
    const userGroupsMap: Record<number, string[]> = {};

    for (const group of groups) {
        try {
            const groupDetail = await getGroup(group.id, apiUrl);
            const members = groupDetail.members;
            if (members && Array.isArray(members)) {
                for (const member of members) {
                    const userId = member.user_id;
                    if (!userGroupsMap[userId]) {
                        userGroupsMap[userId] = [];
                    }
                    const userGroups = userGroupsMap[userId];
                    if (userGroups) {
                        userGroups.push(group.name);
                    }
                }
            }
        } catch (err) {
            console.error(`Error fetching group ${group.id} details:`, err);
        }
    }

    return userGroupsMap;
}
