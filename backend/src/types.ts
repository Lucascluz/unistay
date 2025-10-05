export interface User {
  id: string;
  name: string;
  email: string;
  password_hash: string;
  created_at: Date;
  updated_at: Date;
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

export interface UserPublic {
  id: string;
  name: string;
  email: string;
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
}
