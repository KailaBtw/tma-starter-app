import { describe, it, expect } from 'vitest';
import { validateModuleTitle } from '../moduleUtils';

describe('moduleUtils.validateModuleTitle', () => {
  it('returns error when title is empty/whitespace', () => {
    expect(validateModuleTitle('')).toBe('Title is required');
    expect(validateModuleTitle('   ')).toBe('Title is required');
  });

  it('returns null when title is valid', () => {
    expect(validateModuleTitle('Strength Training')).toBeNull();
  });
});