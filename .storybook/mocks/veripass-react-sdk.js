export const useAuth = () => ({
  user: {
    payload: {
      profile: { display_name: 'Test User' },
      organization_id: 'org-123',
    },
    token: 'mock-token',
  },
  login: () => {},
  logout: () => {},
});

export const AuthProvider = ({ children }) => children;
