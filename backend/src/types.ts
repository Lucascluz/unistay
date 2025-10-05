export interface User {
  id: string;
  name: string;
  email: string;
  password_hash: string;
  created_at: Date;
  updated_at: Date;
}

export interface Company {
  id: string;
  name: string;
  email: string;
  password_hash: string;
  company_type: 'landlord' | 'housing_platform' | 'university';
  verification_status: 'pending' | 'verified' | 'rejected';
  verification_token?: string;
  verification_document_url?: string;
  tax_id?: string;
  website?: string;
  created_at: Date;
  updated_at: Date;
}

export interface CompanyRepresentative {
  id: string;
  company_id: string;
  user_email: string;
  role: string;
  is_primary: boolean;
  verified: boolean;
  verification_token?: string;
  verification_sent_at?: Date;
  created_at: Date;
}

export interface Review {
  id: string;
  user_id: string;
  location: string;
  property: string;
  rating: number;
  review: string;
  helpful: number;
  created_at: Date;
  updated_at: Date;
}

export interface ReviewResponse {
  id: string;
  review_id: string;
  user_id?: string;
  company_id?: string;
  response_text: string;
  is_company_response: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface UserPublic {
  id: string;
  name: string;
  email: string;
  createdAt: string;
}

export interface CompanyPublic {
  id: string;
  name: string;
  email: string;
  companyType: string;
  verificationStatus: string;
  website?: string;
  createdAt: string;
}

export interface ReviewPublic {
  id: string;
  userId: string;
  author: string;
  location: string;
  property: string;
  rating: number;
  review: string;
  helpful: number;
  createdAt: string;
  updatedAt?: string;
  responses?: ReviewResponsePublic[];
}

export interface ReviewResponsePublic {
  id: string;
  reviewId: string;
  authorName: string;
  authorType: 'user' | 'company';
  companyName?: string;
  companyType?: string;
  responseText: string;
  createdAt: string;
  updatedAt?: string;
}
