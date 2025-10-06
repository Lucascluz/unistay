/**
 * CompanySearch Component
 * Smart search component that uses company aliases for better search results
 */

import { useState, useEffect, useRef } from "react";
import { Search, Building2, Loader2, AlertCircle } from "lucide-react";
import { searchApi, type SearchResult } from "~/lib/api/aliases";
import { Input } from "~/components/ui/input";
import { Button } from "~/components/ui/button";

interface CompanySearchProps {
  onSelect: (company: SearchResult) => void;
  placeholder?: string;
  initialValue?: string;
  showSuggestions?: boolean;
  className?: string;
}

export function CompanySearch({
  onSelect,
  placeholder = "Search for a company (try abbreviations like IPG)...",
  initialValue = "",
  showSuggestions = true,
  className = "",
}: CompanySearchProps) {
  const [query, setQuery] = useState(initialValue);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [error, setError] = useState("");
  const [canSuggest, setCanSuggest] = useState(false);
  const [isSubmittingSuggestion, setIsSubmittingSuggestion] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Close results when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowResults(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Debounced search
  useEffect(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    if (query.length < 2) {
      setResults([]);
      setShowResults(false);
      return;
    }

    timeoutRef.current = setTimeout(() => {
      performSearch(query);
    }, 300);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [query]);

  const performSearch = async (searchQuery: string) => {
    try {
      setIsSearching(true);
      setError("");
      
      const response = await searchApi.searchCompanies(searchQuery);
      
      setResults(response.results);
      setCanSuggest(response.count === 0 && (response.suggestion?.can_suggest || false));
      setShowResults(true);
    } catch (err: any) {
      setError(err.message || "Search failed");
      setResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const handleSelect = (result: SearchResult) => {
    setQuery(result.company_name);
    setShowResults(false);
    onSelect(result);
    
    // Track alias usage
    if (result.matched_alias !== result.company_name) {
      // This was found via an alias, track it
      const alias = results.find(r => r.company_id === result.company_id);
      if (alias) {
        searchApi.trackAliasUsage(alias.company_id).catch(console.error);
      }
    }
  };

  const handleSuggestAlias = async () => {
    if (!query.trim()) return;
    
    try {
      setIsSubmittingSuggestion(true);
      await searchApi.suggestAlias({
        suggested_name: query.trim(),
        context: "User search from review form",
      });
      alert("Thank you! Your suggestion has been submitted for review.");
      setCanSuggest(false);
    } catch (err: any) {
      alert(err.message || "Failed to submit suggestion");
    } finally {
      setIsSubmittingSuggestion(false);
    }
  };

  const getAliasTypeBadge = (type: string) => {
    const badges: Record<string, { label: string; color: string }> = {
      abbreviation: { label: "Abbr.", color: "bg-purple-100 text-purple-700" },
      misspelling: { label: "Alt.", color: "bg-orange-100 text-orange-700" },
      translation: { label: "Trans.", color: "bg-green-100 text-green-700" },
      former_name: { label: "Former", color: "bg-gray-100 text-gray-700" },
      local_name: { label: "Local", color: "bg-yellow-100 text-yellow-700" },
    };
    
    return badges[type] || null;
  };

  return (
    <div ref={searchRef} className={`relative ${className}`}>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
        <Input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => query.length >= 2 && setShowResults(true)}
          placeholder={placeholder}
          className="pl-10 pr-10"
        />
        {isSearching && (
          <Loader2 className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 animate-spin" />
        )}
      </div>

      {error && (
        <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded-md flex items-center gap-2 text-sm text-red-700">
          <AlertCircle className="w-4 h-4" />
          {error}
        </div>
      )}

      {/* Results Dropdown */}
      {showResults && (
        <div className="absolute z-50 w-full mt-2 bg-white border border-gray-200 rounded-lg shadow-lg max-h-96 overflow-y-auto">
          {isSearching ? (
            <div className="p-4 text-center text-gray-500">
              <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" />
              Searching...
            </div>
          ) : results.length > 0 ? (
            <div className="py-2">
              {results.map((result) => {
                const badge = getAliasTypeBadge(result.alias_type);
                const isAlias = result.matched_alias !== result.company_name;
                
                return (
                  <button
                    key={result.company_id}
                    onClick={() => handleSelect(result)}
                    className="w-full px-4 py-3 hover:bg-gray-50 text-left transition-colors"
                  >
                    <div className="flex items-start gap-3">
                      <Building2 className="w-5 h-5 text-gray-400 flex-shrink-0 mt-0.5" />
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-gray-900 truncate">
                          {result.company_name}
                        </div>
                        
                        {isAlias && (
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-sm text-gray-500">
                              Matched: "{result.matched_alias}"
                            </span>
                            {badge && (
                              <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${badge.color}`}>
                                {badge.label}
                              </span>
                            )}
                          </div>
                        )}
                        
                        {result.company && (
                          <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                            {result.company.verification_status === 'verified' && (
                              <span className="flex items-center gap-1">
                                <span className="w-1.5 h-1.5 bg-green-500 rounded-full"></span>
                                Verified
                              </span>
                            )}
                            {result.company.average_rating && (
                              <span>★ {result.company.average_rating.toFixed(1)}</span>
                            )}
                            {result.company.number_of_reviews > 0 && (
                              <span>{result.company.number_of_reviews} reviews</span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          ) : canSuggest ? (
            <div className="p-6 text-center">
              <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-700 font-medium mb-2">No companies found</p>
              <p className="text-sm text-gray-500 mb-4">
                We couldn't find any companies matching "{query}"
              </p>
              {showSuggestions && (
                <Button
                  onClick={handleSuggestAlias}
                  disabled={isSubmittingSuggestion}
                  size="sm"
                  variant="outline"
                >
                  {isSubmittingSuggestion ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    <>Suggest "{query}" to admins</>
                  )}
                </Button>
              )}
            </div>
          ) : (
            <div className="p-4 text-center text-gray-500">
              <p className="text-sm">Type at least 2 characters to search</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
