/**
 * Types for Company Alias System
 */

export interface CompanyAlias {
  id: string;
  alias_name: string;
  alias_name_normalized: string;
  company_id: string | null;
  alias_type: AliasType;
  priority: number;
  is_active: boolean;
  created_by: string | null;
  created_at: Date;
  updated_at: Date;
  usage_count: number;
  last_used_at: Date | null;
}

export type AliasType = 
  | 'common_name' 
  | 'abbreviation' 
  | 'misspelling' 
  | 'translation' 
  | 'former_name' 
  | 'local_name';

export interface CompanyAliasSuggestion {
  id: string;
  suggested_name: string;
  suggested_name_normalized: string;
  suggested_by_user_id: string | null;
  context: string | null;
  potential_company_id: string | null;
  confidence_score: number | null;
  status: 'pending' | 'approved' | 'rejected' | 'merged';
  reviewed_by: string | null;
  reviewed_at: Date | null;
  admin_notes: string | null;
  created_at: Date;
}

export interface CreateAliasRequest {
  alias_name: string;
  company_id?: string;
  alias_type?: AliasType;
  priority?: number;
}

export interface UpdateAliasRequest {
  alias_name?: string;
  company_id?: string;
  alias_type?: AliasType;
  priority?: number;
  is_active?: boolean;
}

export interface LinkAliasToCompanyRequest {
  alias_id: string;
  company_id: string;
}

export interface CompanySearchResult {
  company_id: string;
  company_name: string;
  matched_alias: string;
  alias_type: AliasType;
  priority: number;
}

export interface AliasSuggestionResponse {
  suggestions: CompanyAliasSuggestion[];
  total: number;
}
