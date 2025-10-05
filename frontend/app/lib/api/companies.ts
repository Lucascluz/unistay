/**
 * Companies API endpoints
 */

import { apiClient } from './client';
import type {
  Company,
  CompanyRegisterRequest,
  CompanyLoginRequest,
  CompanyAuthResponse,
  CompanyRepresentative,
  AddRepresentativeRequest,
} from './types';

export const companiesApi = {
  /**
   * Register a new company
   */
  register: async (data: CompanyRegisterRequest): Promise<{ company: Company; message: string }> => {
    return apiClient.post<{ company: Company; message: string }>('/companies/register', data);
  },

  /**
   * Login as a company
   */
  login: async (data: CompanyLoginRequest): Promise<CompanyAuthResponse> => {
    return apiClient.post<CompanyAuthResponse>('/companies/login', data);
  },

  /**
   * Get current company profile
   */
  getCurrentCompany: async (): Promise<{ company: Company; representatives: CompanyRepresentative[] }> => {
    return apiClient.get('/companies/me');
  },

  /**
   * Add a representative to the company
   */
  addRepresentative: async (data: AddRepresentativeRequest): Promise<{ representative: CompanyRepresentative; verificationToken?: string; message: string }> => {
    return apiClient.post('/companies/representatives', data);
  },

  /**
   * Verify a representative
   */
  verifyRepresentative: async (token: string): Promise<{ message: string }> => {
    return apiClient.post('/companies/representatives/verify', { token });
  },

  /**
   * Check if an email is a verified representative
   */
  checkRepresentative: async (email: string): Promise<{ isRepresentative: boolean; companies: any[] }> => {
    return apiClient.get(`/companies/representatives/check/${email}`);
  },

  /**
   * Delete a representative from the company
   */
  deleteRepresentative: async (representativeId: string): Promise<{ message: string }> => {
    return apiClient.delete(`/companies/representatives/${representativeId}`);
  },

  /**
   * Get reviews for company's locations
   */
  getCompanyReviews: async (page?: number, limit?: number): Promise<{
    reviews: any[];
    pagination: { page: number; limit: number; total: number; totalPages: number };
  }> => {
    const params = new URLSearchParams();
    if (page) params.append('page', page.toString());
    if (limit) params.append('limit', limit.toString());
    const query = params.toString() ? `?${params.toString()}` : '';
    return apiClient.get(`/companies/reviews${query}`);
  },
};
