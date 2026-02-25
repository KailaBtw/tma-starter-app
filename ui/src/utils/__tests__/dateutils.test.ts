import { describe, it, expect } from 'vitest';
import { formatAge, formatLastActive } from '../dateUtils';

const MINUTE: number = 60_000;
const HOUR: number = 60 * MINUTE;
const DAY: number = 24 * HOUR; //noqa

describe('dateUtils.formatAge', () => {
    it('returns N/A for null/undefined', () => {
        expect(formatAge(null)).toBe('N/A');
        expect(formatAge(undefined)).toBe('N/A');
    });

    it('handles years/months with correct pluralization', () => {
        expect(formatAge({ years: 1, months: 1 })).toBe('1 year, 1 month');
        expect(formatAge({ years: 2, months: 0 })).toBe('2 years');
        expect(formatAge({ years: 0, months: 3 })).toBe('3 months');
    });

    it('handles the 0 years / 0 months case', () => {
        expect(formatAge({ years: 0, months: 0 })).toBe('Less than 1 month');
    });
});

describe('dateUtils.formatLastActive', () => {
    it('returns N/A for null/undefined', () => {
        expect(formatLastActive(null)).toBe('N/A');
        expect(formatLastActive(undefined)).toBe('N/A');
    });

    it('returns N/A for invalid date strings', () => {
        expect(formatLastActive('not-a-date')).toBe('N/A');
    });

    it('returns Yesterday for dates one day ago', () => {
        const now = new Date();
        const today = new Date(
            now.getFullYear(),
            now.getMonth(),
            now.getDate()
        );
        const dateDay = new Date(
            today.getFullYear(),
            today.getMonth(),
            today.getDate() - 1
        );
        expect(formatLastActive(dateDay)).toBe('Yesterday');
    });

    it('returns X minutes ago for dates within the last hour', () => {
        const now = new Date();
        const dateMin = new Date(now.getTime() - 5 * MINUTE);
        expect(formatLastActive(dateMin)).toBe('5 minutes ago');
    });

    it.skip('returns 1 hour ago for dates between 1 and 2 hours ago', () => {
        const now = new Date();
        const dateMin = new Date(now.getTime() - HOUR);
        expect(formatLastActive(dateMin)).toBe('1 hour ago');
    });

    it('returns x days ago for dates over 1 day less than 7 days ago', () => {
        const now = new Date();
        const dateMin = new Date(now.getTime() - 2 * DAY);
        expect(formatLastActive(dateMin)).toBe('2 days ago');
    });

    it('returns year for dates more than a year old', () => {
        const now = new Date();
        const dateMin = new Date(now.getTime() - 400 * DAY);
        const dateStr = formatLastActive(dateMin);
        expect(dateStr).toContain(dateMin.getFullYear().toString());
    });

    it('returns Just now for future dates (or same moment)', () => {
        // the underscore is a numeric separator in JS/TS
        // to make big numbers easier to read.
        // 60,000 milliseconds = 60 seconds = 1 minute.
        const future = new Date(Date.now() + MINUTE);
        expect(formatLastActive(future)).toBe('Just now');
    });
});
