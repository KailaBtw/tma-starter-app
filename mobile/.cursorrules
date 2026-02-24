> Don't forget to rename this file `.cursorrules`

# Three Moves Ahead - Mobile App

## Tech Stack
- React Native 0.81.5
- Expo SDK 54 (managed workflow)
- TypeScript 5.9.2 (strict mode)
- Expo Router 6.0.21 (file-based routing)
- React Native Paper 5.14.5 (Material Design 3)
- React Query 5.90.12 (data fetching)
- React 19.1.0

## Navigation
- Use Expo Router for all navigation (file-based routing)
- Files in `app/` directory become routes automatically
- Use `useRouter()` and `useLocalSearchParams()` from expo-router
- Route groups: `(tabs)/` and `(auth)/` are groups, not routes
- Dynamic routes: `[id].tsx` creates routes with parameters
- NEVER use react-router-dom, Next.js router, or React Navigation

Example navigation:
```typescript
import { useRouter, useLocalSearchParams } from 'expo-router';

const router = useRouter();
const { id } = useLocalSearchParams<{ id: string }>();
router.push(`/(tabs)/modules/${moduleId}`);
```

## Components
- Use React Native components: View, Text, ScrollView, FlatList, Image, Pressable
- NEVER use web components: div, p, button, input, a, span
- Use React Native Paper for UI components: Card, Button, TextInput, etc.
- Always import from 'react-native' or 'react-native-paper', never from 'react-dom' or web libraries

## Styling
- Use StyleSheet.create() for all styles
- Use design tokens from theme.ts: designTokens.spacing.xl, designTokens.colors.primary, etc.
- NEVER use CSS, CSS-in-JS, styled-components, or Tailwind CSS
- Use Flexbox for layout (React Native's default)
- Colors should come from theme.ts, not hard-coded

Example:
```typescript
import { StyleSheet } from 'react-native';
import { designTokens } from '../theme';

const styles = StyleSheet.create({
  container: {
    padding: designTokens.spacing.xl,
    backgroundColor: designTokens.colors.surface,
  },
});
```

## TypeScript
- Always use proper TypeScript types, never `any`
- Types are defined in `types/api.ts` (Module, Course, Post, etc.)
- Use existing types when available
- Define interfaces for component props
- Handle nullable fields (use `| null` or `?`)

Example:
```typescript
import { Module } from '../types';

interface ModuleCardProps {
  module: Module;
  onPress: () => void;
}

export default function ModuleCard({ module, onPress }: ModuleCardProps) {
  // ...
}
```

## Data Fetching
- Use React Query (useQuery, useMutation) for all API calls
- Service functions are in `services/` directory
- Query keys should be arrays: ['moduleDetail', moduleId]
- Always handle loading, error, and success states
- Use ActivityIndicator for loading, Snackbar for errors

Example:
```typescript
import { useQuery } from '@tanstack/react-query';
import { getModuleDetail } from '../services/courses';

const { data, isLoading, error } = useQuery({
  queryKey: ['moduleDetail', moduleId],
  queryFn: () => getModuleDetail(moduleId),
});
```

## File Structure
- Components: `components/` directory
- Screens: `app/` directory (Expo Router)
- Services: `services/` directory (API calls)
- Types: `types/api.ts`
- Utils: `utils/` directory
- Theme: `theme.ts`

## Common Mistakes to Avoid
- DON'T use web components (div, button, p, etc.)
- DON'T use CSS or CSS-in-JS
- DON'T use react-router-dom or Next.js router
- DON'T use window.localStorage (use Expo SecureStore)
- DON'T use fetch without React Query for data fetching
- DON'T use `any` types
- DON'T hard-code colors or spacing (use design tokens)

## Code Style
- Use semicolons
- Use 2-space indentation
- Use single quotes for strings
- Export default for components
- Use named exports for utilities
- Follow existing code patterns in the codebase
