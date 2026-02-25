// ui/src/utils/moduleUtils.ts
export function validateModuleTitle(title: string): string | null {
    if (!title.trim()) return 'Title is required';
    if (title.trim().length > 100)
        return 'Title must be at most 100 characters';
    return null;
}
