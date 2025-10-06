/**
 * API client for company alias management
 */

import { apiClient } from './client';

export interface CompanyAlias {
  id: string;
  alias_name: string;
  alias_name_normalized: string;
  company_id: string | null;
  alias_type: 'common_name' | 'abbreviation' | 'misspelling' | 'translation' | 'former_name' | 'local_name';
  priority: number;
  is_active: boolean;
  usage_count: number;
  last_used_at: string | null;
  created_at: string;
  updated_at: string;
  company_name?: string;
  created_by_name?: string;
}

export interface AliasSuggestion {
  id: string;
  suggested_name: string;
  suggested_name_normalized: string;
  suggested_by_user_id: string | null;
  context: string | null;
  potential_company_id: string | null;
  confidence_score: number | null;
  status: 'pending' | 'approved' | 'rejected' | 'merged';
  reviewed_by: string | null;
  reviewed_at: string | null;
  admin_notes: string | null;
  created_at: string;
  suggested_by_name?: string;
  potential_company_name?: string;
}

export interface CreateAliasRequest {
  alias_name: string;
  company_id?: string;
  alias_type?: CompanyAlias['alias_type'];
  priority?: number;
}

export interface UpdateAliasRequest {
  alias_name?: string;
  company_id?: string | null;
  alias_type?: CompanyAlias['alias_type'];
  priority?: number;
  is_active?: boolean;
}

export interface SearchResult {
  company_id: string;
  company_name: string;
  matched_alias: string;
  alias_type: string;
  priority: number;
  company?: any;
}

// Admin API (requires admin authentication)
export const adminAliasApi = {
  /**
   * List all aliases with optional filtering
   */
  listAliases: async (
    adminKey: string,
    params?: {
      company_id?: string;
      unlinked?: boolean;
      alias_type?: string;
      search?: string;
      page?: number;
      limit?: number;
    }
  ): Promise<{ aliases: CompanyAlias[]; total: number; page: number; limit: number }> => {
    const query = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          query.append(key, String(value));
        }
      });
    }
    return apiClient.get(`/admin/aliases?${query.toString()}`, {
      headers: { 'x-admin-key': adminKey },
    });
  },

  /**
   * Create a new alias
   */
  createAlias: async (adminKey: string, data: CreateAliasRequest): Promise<{ alias: CompanyAlias; message: string }> => {
    return apiClient.post('/admin/aliases', data, {
      headers: { 'x-admin-key': adminKey },
    });
  },

  /**
   * Update an existing alias
   */
  updateAlias: async (adminKey: string, id: string, data: UpdateAliasRequest): Promise<{ alias: CompanyAlias }> => {
    return apiClient.put(`/admin/aliases/${id}`, data, {
      headers: { 'x-admin-key': adminKey },
    });
  },

  /**
   * Link an unlinked alias to a company
   */
  linkAlias: async (adminKey: string, id: string, companyId: string): Promise<{ alias: CompanyAlias; company: any; message: string }> => {
    return apiClient.post(`/admin/aliases/${id}/link`, { company_id: companyId }, {
      headers: { 'x-admin-key': adminKey },
    });
  },

  /**
   * Delete or deactivate an alias
   */
  deleteAlias: async (adminKey: string, id: string, permanent = false): Promise<{ message: string }> => {
    return apiClient.delete(`/admin/aliases/${id}?permanent=${permanent}`, {
      headers: { 'x-admin-key': adminKey },
    });
  },

  /**
   * List alias suggestions from users
   */
  listSuggestions: async (
    adminKey: string,
    params?: {
      status?: 'pending' | 'approved' | 'rejected';
      page?: number;
      limit?: number;
    }
  ): Promise<{ suggestions: AliasSuggestion[]; total: number; page: number; limit: number }> => {
    const query = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          query.append(key, String(value));
        }
      });
    }
    return apiClient.get(`/admin/alias-suggestions?${query.toString()}`, {
      headers: { 'x-admin-key': adminKey },
    });
  },

  /**
   * Review an alias suggestion
   */
  reviewSuggestion: async (
    adminKey: string,
    id: string,
    data: {
      status: 'approved' | 'rejected';
      admin_notes?: string;
      create_alias?: boolean;
      company_id?: string;
    }
  ): Promise<{ message: string; alias_created: boolean }> => {
    return apiClient.post(`/admin/alias-suggestions/${id}/review`, data, {
      headers: { 'x-admin-key': adminKey },
    });
  },
};

// Public search API
export const searchApi = {
  /**
   * Search companies by name or alias
   */
  searchCompanies: async (query: string, limit = 10): Promise<{
    results: SearchResult[];
    query: string;
    count: number;
    suggestion?: { message: string; can_suggest: boolean };
  }> => {
    return apiClient.get(`/search/companies?q=${encodeURIComponent(query)}&limit=${limit}`);
  },

  /**
   * Get all aliases for a specific company
   */
  getCompanyAliases: async (companyId: string): Promise<{ aliases: CompanyAlias[]; company_id: string }> => {
    return apiClient.get(`/search/companies/${companyId}/aliases`);
  },

  /**
   * Submit an alias suggestion
   */
  suggestAlias: async (data: {
    suggested_name: string;
    context?: string;
    potential_company_id?: string;
  }): Promise<{ suggestion: AliasSuggestion; message: string }> => {
    return apiClient.post('/search/suggest-alias', data);
  },

  /**
   * Track alias usage for analytics
   */
  trackAliasUsage: async (aliasId: string): Promise<{ message: string }> => {
    return apiClient.post('/search/track-alias-usage', { alias_id: aliasId });
  },

  /**
   * Resolve a location name to its canonical form
   * Checks if the location is an alias and returns the canonical company name
   */
  resolveLocation: async (location: string): Promise<{
    is_alias: boolean;
    matched_alias?: string;
    alias_type?: string;
    canonical_name: string;
    company_id?: string;
    should_redirect: boolean;
    not_found?: boolean;
  }> => {
    return apiClient.get(`/search/resolve-location?location=${encodeURIComponent(location)}`);
  },
};
