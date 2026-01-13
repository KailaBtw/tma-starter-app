import { useState, useRef } from 'react';
import {
    View,
    StyleSheet,
    ScrollView,
    KeyboardAvoidingView,
    Platform,
} from 'react-native';
import { TextInput, Button, Text, Snackbar } from 'react-native-paper';
import type { TextInput as RNTextInput } from 'react-native';
import { useAuth } from '../../contexts/AuthContext';
import { designTokens } from '../../theme';

export default function LoginScreen() {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [showPassword, setShowPassword] = useState(false);
    const passwordInputRef = useRef<RNTextInput>(null);
    const { login } = useAuth();

    const handleLogin = async () => {
        if (!username || !password) {
            setError('Please enter both username and password');
            return;
        }

        setLoading(true);
        setError(null);

        try {
            await login(username, password);
        } catch (err: unknown) {
            const errorMessage =
                err instanceof Error
                    ? err.message
                    : 'Login failed. Please try again.';
            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    return (
        <KeyboardAvoidingView
            style={styles.container}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
            <ScrollView contentContainerStyle={styles.scrollContent}>
                <View style={styles.content}>
                    <View style={styles.header}>
                        <Text variant="headlineLarge" style={styles.title}>
                            Welcome Back
                        </Text>
                        <Text variant="bodyLarge" style={styles.subtitle}>
                            Sign in to continue to your courses
                        </Text>
                    </View>

                    <View style={styles.form}>
                        <TextInput
                            label="Username"
                            value={username}
                            onChangeText={setUsername}
                            mode="outlined"
                            style={styles.input}
                            autoCapitalize="none"
                            disabled={loading}
                            returnKeyType="next"
                            onSubmitEditing={() =>
                                passwordInputRef.current?.focus()
                            }
                            blurOnSubmit={false}
                            left={<TextInput.Icon icon="account" />}
                        />

                        <TextInput
                            ref={passwordInputRef}
                            label="Password"
                            value={password}
                            onChangeText={setPassword}
                            mode="outlined"
                            style={styles.input}
                            secureTextEntry={!showPassword}
                            disabled={loading}
                            autoCapitalize="none"
                            autoCorrect={false}
                            returnKeyType="go"
                            onSubmitEditing={handleLogin}
                            blurOnSubmit={true}
                            left={<TextInput.Icon icon="lock" />}
                            right={
                                <TextInput.Icon
                                    icon={showPassword ? 'eye-off' : 'eye'}
                                    onPress={() =>
                                        setShowPassword(!showPassword)
                                    }
                                    forceTextInputFocus={false}
                                />
                            }
                        />

                        <Button
                            mode="contained"
                            onPress={handleLogin}
                            loading={loading}
                            disabled={loading}
                            style={styles.button}
                            contentStyle={styles.buttonContent}
                            labelStyle={styles.buttonLabel}
                            accessible={true}
                            accessibilityRole="button"
                            accessibilityLabel="Sign in"
                        >
                            Sign In
                        </Button>
                    </View>
                </View>
            </ScrollView>

            <Snackbar
                visible={Boolean(error)}
                onDismiss={() => setError(null)}
                duration={4000}
                style={styles.snackbar}
            >
                {error || ''}
            </Snackbar>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    scrollContent: {
        flexGrow: 1,
        justifyContent: 'center',
        padding: designTokens.spacing.xxl,
    },
    content: {
        width: '100%',
        maxWidth: 420,
        alignSelf: 'center',
    },
    header: {
        marginBottom: 40,
        alignItems: 'center',
    },
    title: {
        marginBottom: designTokens.spacing.md,
        textAlign: 'center',
        fontWeight: '700',
    },
    subtitle: {
        textAlign: 'center',
        opacity: 0.7,
        lineHeight: 22,
    },
    form: {
        width: '100%',
    },
    input: {
        marginBottom: designTokens.spacing.xl,
    },
    button: {
        marginTop: designTokens.spacing.sm,
        borderRadius: designTokens.borderRadius.md,
        paddingVertical: designTokens.spacing.xs,
    },
    buttonContent: {
        paddingVertical: designTokens.spacing.sm,
    },
    buttonLabel: {
        fontSize: 16,
        fontWeight: '600',
    },
    snackbar: {
        marginBottom: designTokens.spacing.lg,
    },
});
