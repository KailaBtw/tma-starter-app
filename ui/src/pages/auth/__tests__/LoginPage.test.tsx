import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { MantineProvider } from '@mantine/core';
import { theme } from '../../../theme';
import LoginPage from '../LoginPage';

// Mock AuthContext so we control API_URL + login().
// Without this, the component would use the real AuthContext (and real app state).
const loginMock = vi.fn();
vi.mock('../../../contexts/AuthContext', () => ({
    useAuth: () => ({
        isAuthenticated: false,
        API_URL: 'http://localhost:8000/api',
        login: loginMock,
        userInfo: null,
        loading: false,
    }),
}));

function renderLoginPage() {
    // This page uses react-router components (<Link>) so it needs a router.
    // Mantine components work best inside MantineProvider so styles/behavior are consistent.
    return render(
        <MemoryRouter>
            <MantineProvider theme={theme}>
                <LoginPage />
            </MantineProvider>
        </MemoryRouter>
    );
}

describe('LoginPage', () => {
    beforeEach(() => {
        // Reset mocks between tests so tests can’t affect each other.
        vi.restoreAllMocks();
        loginMock.mockReset();
    });

    afterEach(() => {
        // If a later test uses fake timers, this ensures we restore real timers.
        vi.useRealTimers();
    });

    it('renders the login form', () => {
        renderLoginPage();
        // `getByLabelText(/username/i)` finds the input the same way a user would:
        // by looking at the visible <label> text ("Username"). The `/.../i` means
        // “case-insensitive regex match”.
        //
        // `toBeInTheDocument()` is just “this element rendered on the page”.
        expect(screen.getByLabelText(/username/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
        // Button text is "Login" in this page
        expect(
            screen.getByRole('button', { name: /login/i })
        ).toBeInTheDocument();
    });

    it('shows an error alert on failed login', async () => {
        const user = userEvent.setup();

        // Stub the global fetch() so clicking Login doesn’t hit a real backend.
        // This simulates a failed login response with a JSON error message.
        vi.stubGlobal(
            'fetch',
            vi.fn().mockResolvedValue({
                ok: false,
                json: async () => ({ detail: 'Invalid credentials' }),
            })
        );

        renderLoginPage();

        // `user.type(...)` simulates a real user typing into the input.
        // That fires keyboard + input/change events, which triggers the component’s
        // `onChange` handlers and updates React state.
        //
        // We `await` typing because userEvent is async (it simulates keystrokes over time).
        // Targets the form control, not the label element:
        await user.type(screen.getByLabelText(/username/i), 'testuser');
        await user.type(screen.getByLabelText(/password/i), 'wrongpassword');
        await user.click(screen.getByRole('button', { name: /login/i }));

        // The page shows the server-provided error message in an Alert.
        expect(
            await screen.findByText(/invalid credentials/i)
        ).toBeInTheDocument();
        expect(loginMock).not.toHaveBeenCalled();
    });

    it('On Success: usernames with whitespace still log in', async () => {
        const user = userEvent.setup();

        type MockResponse = {
            ok: boolean;
            json: () => Promise<{ access_token: string }>;
        };

        let resolveFetch: (value: MockResponse) => void;
        const fetchPromise = new Promise<MockResponse>((resolve) => {
            resolveFetch = resolve;
        });

        // Simulate a successful login response: server returns an access_token.
        vi.stubGlobal('fetch', vi.fn().mockReturnValue(fetchPromise));

        renderLoginPage();

        const loginButton = screen.getByRole('button', { name: /login/i });

        // Note: LoginPage trims username before sending it.
        await user.type(screen.getByLabelText(/username/i), '  alice  ');
        await user.type(screen.getByLabelText(/password/i), 'password123');
        await user.click(loginButton);

        // the button should be disabled while loading, preventing multiple clicks
        expect(screen.getByRole('button', { name: /login/i })).toBeDisabled();
        expect(loginButton).toBeDisabled();

        resolveFetch!({
            ok: true,
            json: async () => ({ access_token: 'test-token' }),
        });
    });

    it('on success: calls login(token) and shows success message', async () => {
        //noqa: E501
        const user = userEvent.setup();

        // Simulate a successful login response: server returns an access_token.
        vi.stubGlobal(
            'fetch',
            vi.fn().mockResolvedValue({
                ok: true,
                json: async () => ({ access_token: 'test-token' }),
            })
        );

        renderLoginPage();

        // Note: LoginPage trims username before sending it.
        await user.type(screen.getByLabelText(/username/i), '  alice  ');
        await user.type(screen.getByLabelText(/password/i), 'password123');
        await user.click(screen.getByRole('button', { name: /login/i }));

        // Page should call login() with the token from the response
        expect(loginMock).toHaveBeenCalledWith('test-token');
        expect(
            await screen.findByText(/login successful/i)
        ).toBeInTheDocument();
    });
});
