import { apiClient } from './client';

export interface PendingCompany {
  id: string;
  name: string;
  email: string;
  company_type: 'landlord' | 'housing_platform' | 'university';
  verification_status?: 'pending' | 'verified' | 'rejected';
  tax_id?: string;
  website?: string;
  verification_document_url?: string;
  created_at: string;
}

export interface CompanyDetails extends PendingCompany {
  verification_status: 'pending' | 'verified' | 'rejected';
  updated_at: string;
  representatives: Array<{
    id: string;
    user_email: string;
    role: string;
    is_primary: boolean;
    verified: boolean;
    created_at: string;
  }>;
  verificationHistory: Array<{
    id: string;
    action: 'pending' | 'verified' | 'rejected';
    notes?: string;
    admin_name?: string;
    admin_email?: string;
    created_at: string;
  }>;
}

export interface VerifyCompanyRequest {
  companyId: string;
  status: 'verified' | 'rejected';
  notes?: string;
}

export interface AdminStats {
  companies: Array<{
    verification_status: string;
    count: string;
  }>;
  responses: Array<{
    is_company_response: boolean;
    count: string;
  }>;
  recentActivity: Array<{
    type: string;
    description: string;
    created_at: string;
  }>;
}

export interface Representative {
  id: string;
  company_id: string;
  user_email: string;
  role: string;
  is_primary: boolean;
  verified: boolean;
  verification_token?: string;
  verification_sent_at?: string;
  created_at: string;
  company_name?: string;
  company_email?: string;
}

export interface AddRepresentativeRequest {
  companyId: string;
  userEmail: string;
  role: string;
  isPrimary?: boolean;
}

export interface UpdateRepresentativeRequest {
  representativeId: string;
  role?: string;
  isPrimary?: boolean;
  verified?: boolean;
}

export interface Review {
  id: string;
  user_id: string;
  location: string;
  property: string;
  rating: number;
  review: string;
  helpful: number;
  created_at: string;
  updated_at: string;
  user_name: string;
  user_email: string;
  response_count: number;
}

export interface ReviewResponse {
  id: string;
  review_id: string;
  user_id?: string;
  company_id?: string;
  response_text: string;
  is_company_response: boolean;
  created_at: string;
  updated_at: string;
  author_name: string;
  author_email: string;
}

export interface ReviewDetails {
  review: Review;
  responses: ReviewResponse[];
}

export const adminApi = {
  // Get pending companies
  getPendingCompanies: async (adminKey: string): Promise<PendingCompany[]> => {
    const response = await apiClient.get<PendingCompany[]>('/admin/companies/pending', {
      headers: { 'x-admin-key': adminKey },
    });
    return response;
  },

  // Get all companies with optional status filter
  getAllCompanies: async (
    adminKey: string,
    status?: 'pending' | 'verified' | 'rejected'
  ): Promise<PendingCompany[]> => {
    const endpoint = status 
      ? `/admin/companies?status=${status}` 
      : '/admin/companies';
    const response = await apiClient.get<PendingCompany[]>(endpoint, {
      headers: { 'x-admin-key': adminKey },
    });
    return response;
  },

  // Get company details
  getCompanyDetails: async (adminKey: string, companyId: string): Promise<CompanyDetails> => {
    const response = await apiClient.get<CompanyDetails>(`/admin/companies/${companyId}`, {
      headers: { 'x-admin-key': adminKey },
    });
    return response;
  },

  // Verify or reject company
  verifyCompany: async (adminKey: string, request: VerifyCompanyRequest): Promise<void> => {
    await apiClient.post<void>('/admin/companies/verify', request, {
      headers: { 'x-admin-key': adminKey },
    });
  },

  // Get admin statistics
  getStats: async (adminKey: string): Promise<AdminStats> => {
    const response = await apiClient.get<AdminStats>('/admin/stats', {
      headers: { 'x-admin-key': adminKey },
    });
    return response;
  },

  // Delete response (moderation)
  deleteResponse: async (adminKey: string, responseId: string): Promise<void> => {
    await apiClient.delete<void>(`/admin/responses/${responseId}`, {
      headers: { 'x-admin-key': adminKey },
    });
  },

  // Representatives management
  getRepresentatives: async (adminKey: string, companyId?: string): Promise<Representative[]> => {
    const endpoint = companyId 
      ? `/admin/representatives?companyId=${companyId}` 
      : '/admin/representatives';
    const response = await apiClient.get<Representative[]>(endpoint, {
      headers: { 'x-admin-key': adminKey },
    });
    return response;
  },

  addRepresentative: async (adminKey: string, request: AddRepresentativeRequest): Promise<Representative> => {
    const response = await apiClient.post<Representative>('/admin/representatives', request, {
      headers: { 'x-admin-key': adminKey },
    });
    return response;
  },

  updateRepresentative: async (adminKey: string, request: UpdateRepresentativeRequest): Promise<Representative> => {
    const { representativeId, ...data } = request;
    const response = await apiClient.patch<Representative>(`/admin/representatives/${representativeId}`, data, {
      headers: { 'x-admin-key': adminKey },
    });
    return response;
  },

  deleteRepresentative: async (adminKey: string, representativeId: string): Promise<void> => {
    await apiClient.delete<void>(`/admin/representatives/${representativeId}`, {
      headers: { 'x-admin-key': adminKey },
    });
  },

  // Reviews management
  getReviews: async (
    adminKey: string,
    params?: {
      page?: number;
      limit?: number;
      location?: string;
      userId?: string;
      minRating?: number;
      maxRating?: number;
    }
  ): Promise<{ reviews: Review[]; total: number; page: number; limit: number; hasMore: boolean }> => {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.location) queryParams.append('location', params.location);
    if (params?.userId) queryParams.append('userId', params.userId);
    if (params?.minRating !== undefined) queryParams.append('minRating', params.minRating.toString());
    if (params?.maxRating !== undefined) queryParams.append('maxRating', params.maxRating.toString());

    const endpoint = `/admin/reviews${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    const response = await apiClient.get<{ reviews: Review[]; total: number; page: number; limit: number; hasMore: boolean }>(endpoint, {
      headers: { 'x-admin-key': adminKey },
    });
    return response;
  },

  getReviewDetails: async (adminKey: string, reviewId: string): Promise<ReviewDetails> => {
    const response = await apiClient.get<ReviewDetails>(`/admin/reviews/${reviewId}`, {
      headers: { 'x-admin-key': adminKey },
    });
    return response;
  },

  deleteReview: async (adminKey: string, reviewId: string): Promise<void> => {
    await apiClient.delete<void>(`/admin/reviews/${reviewId}`, {
      headers: { 'x-admin-key': adminKey },
    });
  },
};
