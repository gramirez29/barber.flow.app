// const BASE_URL = __DEV__ ? 'http://10.0.2.2:5000' : 'https://barberflowapp-develop.up.railway.app/'; // Android emulator uses 10.0.2.2 for localhost
const BASE_URL = 'https://barberflowapp-develop.up.railway.app';

export const authService = {
  login: async (userOrEmail: string, password: string) => {
    const res = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userOrEmail, password }),
    });

    if (!res.ok) {
      const body = await res.json().catch(() => null);
      throw new Error(body?.message ?? 'Login failed');
    }

    const data = await res.json();
    // expected shape { username, token }
    return { username: data.username, token: data.token };
  },
};