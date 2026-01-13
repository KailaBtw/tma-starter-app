import { Stack } from 'expo-router';
import { PaperProvider } from 'react-native-paper';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider } from '../contexts/AuthContext';
import { ErrorBoundary } from '../components/ErrorBoundary';
import appTheme from '../theme';

// Configure React Query client with default options
// retry: 1 means failed queries will automatically retry once before showing an error
const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            retry: 1,
        },
    },
});

export default function RootLayout() {
    return (
        <SafeAreaProvider>
            <ErrorBoundary>
                <PaperProvider theme={appTheme}>
                    <QueryClientProvider client={queryClient}>
                        <AuthProvider>
                            <Stack
                                screenOptions={{ headerShown: Boolean(false) }}
                            >
                                <Stack.Screen name="index" />
                                <Stack.Screen name="(auth)/home" />
                                <Stack.Screen name="(auth)/login" />
                                <Stack.Screen name="(tabs)" />
                            </Stack>
                        </AuthProvider>
                    </QueryClientProvider>
                </PaperProvider>
            </ErrorBoundary>
        </SafeAreaProvider>
    );
}
