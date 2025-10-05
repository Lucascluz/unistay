/**
 * Main API exports - central point for all API calls
 */

export { apiClient, ApiError } from './client';
export { authApi } from './auth';
export { reviewsApi } from './reviews';
export { locationsApi } from './locations';
export { companiesApi } from './companies';
export { responsesApi } from './responses';
export { adminApi } from './admin';
export type { PendingCompany, CompanyDetails, AdminStats, VerifyCompanyRequest, Representative, UpdateRepresentativeRequest, ReviewDetails } from './admin';

// Export all types
export type * from './types';
