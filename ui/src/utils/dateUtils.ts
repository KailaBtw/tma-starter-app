/**
 * Date utility functions
 */

export interface Age {
    years: number;
    months: number;
}

const MINUTE: number = 60_000;
const HOUR: number = 60 * MINUTE;

/**
 * Format age object (with years and months) into a readable string
 * @param age - Age object with { years: number, months: number }
 * @returns Formatted age string (e.g., "2 years, 3 months" or "Less than 1 month")
 */
export function formatAge(age: Age | null | undefined): string {
    if (!age) return 'N/A';

    const parts: string[] = [];
    if (age.years > 0) {
        parts.push(`${age.years} year${age.years !== 1 ? 's' : ''}`);
    }
    if (age.months > 0) {
        parts.push(`${age.months} month${age.months !== 1 ? 's' : ''}`);
    }

    if (parts.length === 0) {
        return 'Less than 1 month';
    }

    return parts.join(', ');
}

/**
 * Format date for display (relative time or absolute date)
 * @param date - Date to format
 * @returns Formatted date string
 */
export function formatLastActive(
    date: string | Date | null | undefined
): string {
    if (!date) return 'N/A';
    const dateObj = new Date(date);
    if (isNaN(dateObj.getTime())) return 'N/A';

    const now = new Date();
    const diffMs = now.getTime() - dateObj.getTime();

    // Handle future dates or same moment
    if (diffMs <= 0) {
        return 'Just now';
    }

    // Check if same day (ignoring time)
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const dateDay = new Date(
        dateObj.getFullYear(),
        dateObj.getMonth(),
        dateObj.getDate()
    );
    const isToday = dateDay.getTime() === today.getTime();

    if (isToday) {
        const diffHours = Math.floor(diffMs / HOUR);
        if (diffHours === 0) {
            const diffMins = Math.floor(diffMs / MINUTE);
            return diffMins <= 1 ? 'Just now' : `${diffMins} minutes ago`;
        }
        return diffHours === 1 ? '1 hour ago' : `${diffHours} hours ago`;
    }

    // Calculate days difference
    const diffDays = Math.floor(
        (today.getTime() - dateDay.getTime()) / (1000 * 60 * 60 * 24)
    );

    if (diffDays === 1) {
        return 'Yesterday';
    } else if (diffDays < 7) {
        return `${diffDays} days ago`;
    } else {
        // Format as MM/DD/YYYY
        return dateObj.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year:
                dateObj.getFullYear() !== now.getFullYear()
                    ? 'numeric'
                    : undefined,
        });
    }
}
