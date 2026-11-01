const API_BASE = (import.meta.env.VITE_API_BASE_URL || '') + '/api';

function getAuthHeader() {
  const token = localStorage.getItem('bookleaf_token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function request(endpoint, options = {}) {
  const config = {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeader(),
      ...(options.headers || {})
    }
  };

  const response = await fetch(`${API_BASE}${endpoint}`, config);
  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const errorMsg = data.message || data.error || `HTTP error ${response.status}`;
    throw new Error(errorMsg);
  }

  return data;
}

export const api = {
  // Authentication
  auth: {
    login: (email, password) =>
      request('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password })
      }),
    getMe: () => request('/auth/me'),
    getDemoAccounts: () => request('/auth/demo-accounts')
  },

  // Author endpoints
  author: {
    getBooks: () => request('/author/books'),
    getDashboard: () => request('/author/dashboard')
  },

  // Ticket endpoints
  tickets: {
    getMyTickets: () => request('/tickets/my-tickets'),
    getTicket: (id) => request(`/tickets/${id}`),
    createTicket: (payload) =>
      request('/tickets', {
        method: 'POST',
        body: JSON.stringify(payload)
      }),
    postMessage: (id, content, isAiDraftUsed = false) =>
      request(`/tickets/${id}/messages`, {
        method: 'POST',
        body: JSON.stringify({ content, isAiDraftUsed })
      })
  },

  // Admin endpoints
  admin: {
    getTickets: (filters = {}) => {
      const params = new URLSearchParams();
      if (filters.status && filters.status !== 'All') params.append('status', filters.status);
      if (filters.category && filters.category !== 'All') params.append('category', filters.category);
      if (filters.priority && filters.priority !== 'All') params.append('priority', filters.priority);
      if (filters.search) params.append('search', filters.search);
      if (filters.sortBy) params.append('sortBy', filters.sortBy);

      const qs = params.toString();
      return request(`/admin/tickets${qs ? `?${qs}` : ''}`);
    },
    updateTicket: (id, updates) =>
      request(`/admin/tickets/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(updates)
      }),
    addNote: (id, note) =>
      request(`/admin/tickets/${id}/notes`, {
        method: 'POST',
        body: JSON.stringify({ note })
      }),
    regenerateDraft: (id, customPrompt) =>
      request(`/admin/tickets/${id}/regenerate-draft`, {
        method: 'POST',
        body: JSON.stringify({ customPrompt })
      })
  }
};
