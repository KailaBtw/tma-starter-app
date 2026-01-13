import { useNavigate } from 'react-router-dom';
import {
    Container,
    Title,
    Stack,
    Text,
    Box,
    Center,
    Button,
} from '@mantine/core';
import { designTokens } from '../../designTokens';
import { useAuth } from '../../contexts/AuthContext';

export default function HomePage() {
    const navigate = useNavigate();
    const { userInfo } = useAuth();

    // Layout wrapper styles - HomePage doesn't need sidebar margin (it's a landing page)
    const layoutWrapperStyles: React.CSSProperties = {
        marginLeft: 0, // No sidebar margin for landing page
        width: '100%',
        marginTop: '170px', // Account for navbar height (keep as fixed value for navbar)
    };

    return (
        <Box style={layoutWrapperStyles}>
            <Container size="md" py="xl" px={{ base: 'sm', sm: 'md' }}>
                <Stack gap="xl" align="center">
                    <Title
                        order={1}
                        style={{
                            textAlign: 'center',
                            color: 'var(--mantine-color-blue-6)',
                            fontSize: '2.5rem',
                        }}
                    >
                        Three Moves Ahead
                    </Title>
                    <Text
                        size="lg"
                        style={{
                            textAlign: 'center',
                            color: 'var(--mantine-color-gray-7)',
                            maxWidth: '600px',
                        }}
                    >
                        Some tagline here.
                    </Text>
                    <Button
                        size="lg"
                        onClick={() => {
                            // Navigate to appropriate dashboard based on user role
                            const userRole = userInfo?.role?.name;
                            if (userRole === 'admin') {
                                navigate('/dashboard/courses');
                            } else {
                                // For regular users, go to their courses page
                                navigate('/dashboard/user/courses');
                            }
                        }}
                        style={{
                            marginTop: designTokens.spacing.sm,
                        }}
                    >
                        Get Started
                    </Button>
                    <Center mt="xl">
                        <Box
                            style={{
                                display: 'flex',
                                gap: designTokens.spacing.xl,
                                fontSize:
                                    designTokens.typography.fontSize['4xl'],
                                lineHeight:
                                    designTokens.typography.lineHeight.tight,
                            }}
                        >
                            <span>🌟</span>
                            <span>📚</span>
                            <span>🎨</span>
                            <span>🎵</span>
                            <span>🧸</span>
                        </Box>
                    </Center>
                </Stack>
            </Container>
        </Box>
    );
}
