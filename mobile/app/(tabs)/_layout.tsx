import { Tabs } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Platform, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { designTokens } from '../../theme';

export default function TabsLayout() {
    const insets = useSafeAreaInsets();

    // Calculate tab bar height with safe area insets
    const baseHeight = Platform.OS === 'ios' ? 88 : 64;
    const bottomPadding =
        Platform.OS === 'ios' ? 24 : Math.max(insets.bottom, 8);
    const tabBarHeight =
        baseHeight + (Platform.OS === 'android' ? insets.bottom : 0);

    // Dynamic style (depends on runtime values)
    const tabBarStyle = {
        ...styles.tabBarBase,
        height: tabBarHeight,
        paddingBottom: bottomPadding,
    };

    // Tab bar styling configuration
    const screenOptions = {
        headerShown: Boolean(false),
        tabBarActiveTintColor: designTokens.tabBar.active,
        tabBarInactiveTintColor: designTokens.tabBar.inactive,
        tabBarStyle,
        tabBarLabelStyle: styles.label,
        tabBarIconStyle: styles.icon,
    };

    return (
        <Tabs screenOptions={screenOptions}>
            <Tabs.Screen
                name="home"
                options={{
                    title: 'Home',
                    tabBarIcon: ({ color, size }) => (
                        <MaterialCommunityIcons
                            name="home"
                            size={size}
                            color={color}
                        />
                    ),
                }}
            />
            <Tabs.Screen
                name="groups"
                options={{
                    title: 'Groups',
                    tabBarIcon: ({ color, size }) => (
                        <MaterialCommunityIcons
                            name="account-group"
                            size={size}
                            color={color}
                        />
                    ),
                }}
            />
            <Tabs.Screen
                name="courses"
                options={{
                    title: 'Courses',
                    tabBarIcon: ({ color, size }) => (
                        <MaterialCommunityIcons
                            name="book-open-variant"
                            size={size}
                            color={color}
                        />
                    ),
                }}
            />
            <Tabs.Screen
                name="progress"
                options={{
                    title: 'Progress',
                    tabBarIcon: ({ color, size }) => (
                        <MaterialCommunityIcons
                            name="chart-line"
                            size={size}
                            color={color}
                        />
                    ),
                }}
            />
            <Tabs.Screen
                name="profile"
                options={{
                    title: 'Profile',
                    tabBarIcon: ({ color, size }) => (
                        <MaterialCommunityIcons
                            name="account"
                            size={size}
                            color={color}
                        />
                    ),
                }}
            />
            {/* Detail screens - hidden from tab bar but tabs remain visible */}
            <Tabs.Screen
                name="courses/[id]"
                options={{
                    href: null, // Hide from tab bar
                }}
            />
            <Tabs.Screen
                name="groups/[id]"
                options={{
                    href: null, // Hide from tab bar
                }}
            />
            <Tabs.Screen
                name="modules/[id]"
                options={{
                    href: null,
                }}
            />
            <Tabs.Screen
                name="posts/[id]"
                options={{
                    href: null,
                }}
            />
            <Tabs.Screen
                name="files/[id]"
                options={{
                    href: null,
                }}
            />
            <Tabs.Screen
                name="quizzes/[id]/take"
                options={{
                    href: null,
                }}
            />
        </Tabs>
    );
}

const styles = StyleSheet.create({
    tabBarBase: {
        backgroundColor: designTokens.tabBar.background,
        borderTopWidth: 1,
        borderTopColor: designTokens.tabBar.border,
        paddingTop: designTokens.spacing.sm,
        elevation: 8,
        shadowColor: designTokens.tabBar.shadow,
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    label: {
        fontSize: 12,
        fontWeight: '600',
        marginTop: designTokens.spacing.xs,
    },
    icon: {
        marginTop: designTokens.spacing.xs,
    },
});
