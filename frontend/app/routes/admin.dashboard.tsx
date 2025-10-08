import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { Shield, Building2, Users, MessageCircle, LogOut, CheckCircle, XCircle, Clock, FileText, Tag, Plus, Search, Filter, Link as LinkIcon, Trash2, AlertCircle } from "lucide-react";
import { Button } from "~/components/ui/button";
import { Card } from "~/components/ui/card";
import { Badge } from "~/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "~/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/components/ui/tabs";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Textarea } from "~/components/ui/textarea";
import { PageHeader } from "~/components/PageHeader";
import { adminApi, type PendingCompany, type CompanyDetails, type AdminStats } from "~/lib/api";
import { adminAliasApi, type CompanyAlias, type AliasSuggestion, type CreateAliasRequest } from "~/lib/api/aliases";

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [adminKey, setAdminKey] = useState("");
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [companies, setCompanies] = useState<PendingCompany[]>([]);
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [selectedCompany, setSelectedCompany] = useState<CompanyDetails | null>(null);
  const [showCompanyDialog, setShowCompanyDialog] = useState(false);
  const [verificationNotes, setVerificationNotes] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"pending" | "verified" | "rejected" | "all" | "aliases">("pending");
  
  // Alias management state
  const [aliases, setAliases] = useState<CompanyAlias[]>([]);
  const [suggestions, setSuggestions] = useState<AliasSuggestion[]>([]);
  const [aliasSearchTerm, setAliasSearchTerm] = useState("");
  const [aliasFilterType, setAliasFilterType] = useState<string>("all");
  const [showUnlinked, setShowUnlinked] = useState(false);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [aliasFormData, setAliasFormData] = useState<CreateAliasRequest>({
    alias_name: "",
    alias_type: "common_name",
    priority: 50,
  });

  useEffect(() => {
    // Check if admin key is stored
    const storedKey = localStorage.getItem("admin_key");
    if (storedKey) {
      setAdminKey(storedKey);
      setIsAuthenticated(true);
      setIsLoading(false);
    } else {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated && adminKey) {
      loadData();
    }
  }, [isAuthenticated, adminKey, activeTab]);

  useEffect(() => {
    if (isAuthenticated && adminKey && activeTab === "aliases") {
      loadAliasesData();
    }
  }, [aliasSearchTerm, aliasFilterType, showUnlinked]);

  const loadData = async () => {
    try {
      setError(null);
      
      // Load aliases data if on aliases tab
      if (activeTab === "aliases") {
        await loadAliasesData();
        return;
      }
      
      // Load companies based on active tab
      let companiesData: PendingCompany[] = [];
      if (activeTab === "all") {
        companiesData = await adminApi.getAllCompanies(adminKey);
      } else {
        companiesData = await adminApi.getAllCompanies(adminKey, activeTab);
      }
      setCompanies(companiesData);

      // Load stats
      try {
        const statsData = await adminApi.getStats(adminKey);
        setStats(statsData);
      } catch (err) {
        console.error("Failed to load stats:", err);
      }
    } catch (error: any) {
      console.error("Failed to load data:", error);
      setError(error.message || "Failed to load data");
      
      if (error.message?.includes("Invalid admin credentials")) {
        handleLogout();
      }
    }
  };

  const loadAliasesData = async () => {
    try {
      const params: any = {};
      if (aliasSearchTerm) params.search = aliasSearchTerm;
      if (aliasFilterType !== "all") params.alias_type = aliasFilterType;
      if (showUnlinked) params.unlinked = true;
      
      const [aliasData, suggestionData, companyData] = await Promise.all([
        adminAliasApi.listAliases(adminKey, params),
        adminAliasApi.listSuggestions(adminKey, { status: 'pending' }),
        adminApi.getAllCompanies(adminKey),
      ]);
      
      setAliases(aliasData.aliases);
      setSuggestions(suggestionData.suggestions);
      setCompanies(companyData);
    } catch (err: any) {
      setError(err.message || "Failed to load aliases data");
      console.error(err);
    }
  };

  const handleCreateAlias = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await adminAliasApi.createAlias(adminKey, aliasFormData);
      setSuccess("Alias created successfully!");
      setCreateDialogOpen(false);
      setAliasFormData({ alias_name: "", alias_type: "common_name", priority: 50 });
      loadAliasesData();
    } catch (err: any) {
      setError(err.message || "Failed to create alias");
    }
  };

  const handleUpdateAlias = async (id: string, data: any) => {
    try {
      await adminAliasApi.updateAlias(adminKey, id, data);
      setSuccess("Alias updated successfully!");
      loadAliasesData();
    } catch (err: any) {
      setError(err.message || "Failed to update alias");
    }
  };

  const handleLinkAlias = async (aliasId: string, companyId: string) => {
    try {
      const result = await adminAliasApi.linkAlias(adminKey, aliasId, companyId);
      setSuccess(result.message);
      loadAliasesData();
    } catch (err: any) {
      setError(err.message || "Failed to link alias");
    }
  };

  const handleDeleteAlias = async (id: string, permanent = false) => {
    if (!confirm(`Are you sure you want to ${permanent ? 'permanently delete' : 'deactivate'} this alias?`)) {
      return;
    }
    
    try {
      await adminAliasApi.deleteAlias(adminKey, id, permanent);
      setSuccess("Alias deleted successfully!");
      loadAliasesData();
    } catch (err: any) {
      setError(err.message || "Failed to delete alias");
    }
  };

  const handleReviewSuggestion = async (
    id: string, 
    status: 'approved' | 'rejected',
    createAlias: boolean = false,
    companyId?: string
  ) => {
    try {
      await adminAliasApi.reviewSuggestion(adminKey, id, {
        status,
        create_alias: createAlias,
        company_id: companyId,
      });
      setSuccess(`Suggestion ${status}!`);
      loadAliasesData();
    } catch (err: any) {
      setError(err.message || "Failed to review suggestion");
    }
  };

  const getAliasTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      common_name: "Common Name",
      abbreviation: "Abbreviation",
      misspelling: "Misspelling",
      translation: "Translation",
      former_name: "Former Name",
      local_name: "Local Name",
    };
    return labels[type] || type;
  };

  const getAliasTypeBadgeColor = (type: string) => {
    const colors: Record<string, string> = {
      common_name: "bg-blue-100 text-blue-800",
      abbreviation: "bg-purple-100 text-purple-800",
      misspelling: "bg-orange-100 text-orange-800",
      translation: "bg-green-100 text-green-800",
      former_name: "bg-gray-100 text-gray-800",
      local_name: "bg-yellow-100 text-yellow-800",
    };
    return colors[type] || "bg-gray-100 text-gray-800";
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsProcessing(true);

    try {
      // Test the admin key by fetching pending companies
      await adminApi.getPendingCompanies(adminKey);
      localStorage.setItem("admin_key", adminKey);
      setIsAuthenticated(true);
    } catch (error: any) {
      setError(error.message || "Invalid admin key");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("admin_key");
    setAdminKey("");
    setIsAuthenticated(false);
    setCompanies([]);
    setStats(null);
  };

  const handleViewCompany = async (companyId: string) => {
    try {
      const details = await adminApi.getCompanyDetails(adminKey, companyId);
      setSelectedCompany(details);
      setShowCompanyDialog(true);
    } catch (error: any) {
      console.error("Failed to load company details:", error);
      setError(error.message || "Failed to load company details");
    }
  };

  const handleVerifyCompany = async (companyId: string, status: "verified" | "rejected") => {
    setIsProcessing(true);
    setError(null);

    try {
      await adminApi.verifyCompany(adminKey, {
        companyId,
        status,
        notes: verificationNotes || undefined,
      });

      // Reload data
      await loadData();
      
      // Close dialog and reset
      setShowCompanyDialog(false);
      setSelectedCompany(null);
      setVerificationNotes("");
    } catch (error: any) {
      console.error("Failed to verify company:", error);
      setError(error.message || "Failed to verify company");
    } finally {
      setIsProcessing(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusColors = {
      pending: "bg-yellow-500",
      verified: "bg-green-500",
      rejected: "bg-red-500",
    };

    const statusIcons = {
      pending: Clock,
      verified: CheckCircle,
      rejected: XCircle,
    };

    const Icon = statusIcons[status as keyof typeof statusIcons] || Clock;
    const color = statusColors[status as keyof typeof statusColors] || "bg-gray-500";

    return (
      <Badge className={`${color} text-white`}>
        <Icon className="w-3 h-3 mr-1" />
        {status}
      </Badge>
    );
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Shield className="w-12 h-12 text-blue-500 animate-pulse mx-auto mb-4" />
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md p-6">
          <div className="text-center mb-6">
            <Shield className="w-12 h-12 text-blue-500 mx-auto mb-4" />
            <h1 className="text-2xl font-bold">Admin Dashboard</h1>
            <p className="text-gray-600 mt-2">Enter your admin key to continue</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <Label htmlFor="adminKey">Admin Key</Label>
              <Input
                id="adminKey"
                type="password"
                value={adminKey}
                onChange={(e) => setAdminKey(e.target.value)}
                placeholder="Enter admin key"
                required
              />
            </div>

            {error && (
              <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            <Button type="submit" className="w-full" disabled={isProcessing}>
              {isProcessing ? "Authenticating..." : "Login"}
            </Button>
          </form>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <PageHeader title="Admin Dashboard" showBackButton />
      
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Shield className="w-8 h-8 text-blue-500" />
              <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
            </div>
            <div className="flex items-center gap-3">
              <Button variant="outline" onClick={handleLogout}>
                <LogOut className="w-4 h-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <div className="bg-red-50 text-red-600 p-4 rounded-lg mb-6">
            {error}
          </div>
        )}

        {success && (
          <div className="bg-green-50 text-green-600 p-4 rounded-lg mb-6 flex items-center justify-between">
            <span>{success}</span>
            <button onClick={() => setSuccess(null)} className="text-green-800 hover:text-green-900">
              <XCircle className="w-5 h-5" />
            </button>
          </div>
        )}

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <Card className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Pending Companies</p>
                  <p className="text-3xl font-bold text-yellow-600">
                    {stats.companies.find(c => c.verification_status === 'pending')?.count || '0'}
                  </p>
                </div>
                <Clock className="w-10 h-10 text-yellow-500" />
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Verified Companies</p>
                  <p className="text-3xl font-bold text-green-600">
                    {stats.companies.find(c => c.verification_status === 'verified')?.count || '0'}
                  </p>
                </div>
                <CheckCircle className="w-10 h-10 text-green-500" />
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Company Responses</p>
                  <p className="text-3xl font-bold text-blue-600">
                    {stats.responses.find(r => r.is_company_response)?.count || '0'}
                  </p>
                </div>
                <MessageCircle className="w-10 h-10 text-blue-500" />
              </div>
            </Card>
          </div>
        )}

        {/* Companies Table */}
        <Card className="p-6">
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
            <TabsList className="mb-6">
              <TabsTrigger value="pending">
                <Clock className="w-4 h-4 mr-2" />
                Pending
              </TabsTrigger>
              <TabsTrigger value="verified">
                <CheckCircle className="w-4 h-4 mr-2" />
                Verified
              </TabsTrigger>
              <TabsTrigger value="rejected">
                <XCircle className="w-4 h-4 mr-2" />
                Rejected
              </TabsTrigger>
              <TabsTrigger value="all">
                <Building2 className="w-4 h-4 mr-2" />
                All Companies
              </TabsTrigger>
              <TabsTrigger value="aliases">
                <Tag className="w-4 h-4 mr-2" />
                Aliases
              </TabsTrigger>
            </TabsList>

            <TabsContent value={activeTab}>
              {companies.length === 0 ? (
                <div className="text-center py-12">
                  <Building2 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">No companies found</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-3 px-4 font-semibold text-gray-700">Company Name</th>
                        <th className="text-left py-3 px-4 font-semibold text-gray-700">Email</th>
                        <th className="text-left py-3 px-4 font-semibold text-gray-700">Type</th>
                        <th className="text-left py-3 px-4 font-semibold text-gray-700">Status</th>
                        <th className="text-left py-3 px-4 font-semibold text-gray-700">Created</th>
                        <th className="text-left py-3 px-4 font-semibold text-gray-700">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {companies.map((company) => (
                        <tr key={company.id} className="border-b hover:bg-gray-50">
                          <td className="py-3 px-4 font-medium">{company.name}</td>
                          <td className="py-3 px-4 text-gray-600">{company.email}</td>
                          <td className="py-3 px-4">
                            <span className="capitalize text-sm text-gray-600">
                              {company.company_type?.replace(/_/g, ' ') || 'N/A'}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            {getStatusBadge(company.verification_status || 'pending')}
                          </td>
                          <td className="py-3 px-4 text-gray-600 text-sm">
                            {new Date(company.created_at).toLocaleDateString()}
                          </td>
                          <td className="py-3 px-4">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleViewCompany(company.id)}
                            >
                              <FileText className="w-4 h-4 mr-1" />
                              View Details
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </TabsContent>

            {/* Aliases Tab */}
            <TabsContent value="aliases" className="space-y-4">
              <Tabs defaultValue="aliases-list" className="space-y-6">
                <TabsList>
                  <TabsTrigger value="aliases-list">
                    <Tag className="w-4 h-4 mr-2" />
                    All Aliases ({aliases.length})
                  </TabsTrigger>
                  <TabsTrigger value="suggestions">
                    <AlertCircle className="w-4 h-4 mr-2" />
                    Pending Suggestions ({suggestions.length})
                  </TabsTrigger>
                </TabsList>

                {/* Aliases List Tab */}
                <TabsContent value="aliases-list" className="space-y-4">
                  {/* Toolbar */}
                  <Card className="p-4">
                    <div className="flex flex-col md:flex-row gap-4">
                      <div className="flex-1">
                        <div className="relative">
                          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                          <Input
                            placeholder="Search aliases..."
                            value={aliasSearchTerm}
                            onChange={(e) => setAliasSearchTerm(e.target.value)}
                            className="pl-10"
                          />
                        </div>
                      </div>
                      
                      <div className="flex gap-2">
                        <select
                          value={aliasFilterType}
                          onChange={(e) => setAliasFilterType(e.target.value)}
                          className="px-4 py-2 border rounded-md"
                        >
                          <option value="all">All Types</option>
                          <option value="common_name">Common Name</option>
                          <option value="abbreviation">Abbreviations</option>
                          <option value="misspelling">Misspellings</option>
                          <option value="translation">Translations</option>
                          <option value="former_name">Former Names</option>
                          <option value="local_name">Local Names</option>
                        </select>

                        <Button
                          variant={showUnlinked ? "default" : "outline"}
                          onClick={() => setShowUnlinked(!showUnlinked)}
                        >
                          <Filter className="w-4 h-4 mr-2" />
                          {showUnlinked ? "Show All" : "Unlinked Only"}
                        </Button>

                        <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
                          <DialogTrigger asChild>
                            <Button>
                              <Plus className="w-4 h-4 mr-2" />
                              Create Alias
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Create New Alias</DialogTitle>
                            </DialogHeader>
                            <form onSubmit={handleCreateAlias} className="space-y-4">
                              <div className="space-y-2">
                                <Label htmlFor="alias_name">Alias Name *</Label>
                                <Input
                                  id="alias_name"
                                  value={aliasFormData.alias_name}
                                  onChange={(e) => setAliasFormData({ ...aliasFormData, alias_name: e.target.value })}
                                  placeholder="e.g., IPG"
                                  required
                                />
                              </div>

                              <div className="space-y-2">
                                <Label htmlFor="company_id">Company (Optional)</Label>
                                <select
                                  id="company_id"
                                  value={aliasFormData.company_id || ""}
                                  onChange={(e) => setAliasFormData({ ...aliasFormData, company_id: e.target.value || undefined })}
                                  className="w-full px-3 py-2 border rounded-md"
                                >
                                  <option value="">Unlinked (link later)</option>
                                  {companies.map((company) => (
                                    <option key={company.id} value={company.id}>
                                      {company.name}
                                    </option>
                                  ))}
                                </select>
                                <p className="text-sm text-gray-500">
                                  Leave empty to create an unlinked alias
                                </p>
                              </div>

                              <div className="space-y-2">
                                <Label htmlFor="alias_type">Type</Label>
                                <select
                                  id="alias_type"
                                  value={aliasFormData.alias_type}
                                  onChange={(e) => setAliasFormData({ ...aliasFormData, alias_type: e.target.value as any })}
                                  className="w-full px-3 py-2 border rounded-md"
                                >
                                  <option value="common_name">Common Name</option>
                                  <option value="abbreviation">Abbreviation</option>
                                  <option value="misspelling">Misspelling</option>
                                  <option value="translation">Translation</option>
                                  <option value="former_name">Former Name</option>
                                  <option value="local_name">Local Name</option>
                                </select>
                              </div>

                              <div className="space-y-2">
                                <Label htmlFor="priority">Priority (0-100)</Label>
                                <Input
                                  id="priority"
                                  type="number"
                                  min="0"
                                  max="100"
                                  value={aliasFormData.priority}
                                  onChange={(e) => setAliasFormData({ ...aliasFormData, priority: parseInt(e.target.value) })}
                                />
                                <p className="text-sm text-gray-500">
                                  Higher priority = appears first in search
                                </p>
                              </div>

                              <div className="flex gap-2">
                                <Button type="submit" className="flex-1">Create Alias</Button>
                                <Button type="button" variant="outline" onClick={() => setCreateDialogOpen(false)}>
                                  Cancel
                                </Button>
                              </div>
                            </form>
                          </DialogContent>
                        </Dialog>
                      </div>
                    </div>
                  </Card>

                  {/* Aliases List */}
                  <Card>
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead className="bg-gray-50 border-b">
                          <tr>
                            <th className="text-left py-3 px-4 font-semibold text-gray-700">Alias Name</th>
                            <th className="text-left py-3 px-4 font-semibold text-gray-700">Type</th>
                            <th className="text-left py-3 px-4 font-semibold text-gray-700">Company</th>
                            <th className="text-left py-3 px-4 font-semibold text-gray-700">Priority</th>
                            <th className="text-left py-3 px-4 font-semibold text-gray-700">Usage</th>
                            <th className="text-left py-3 px-4 font-semibold text-gray-700">Status</th>
                            <th className="text-left py-3 px-4 font-semibold text-gray-700">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y">
                          {aliases.length === 0 ? (
                            <tr>
                              <td colSpan={7} className="text-center py-12">
                                <Tag className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                                <p className="text-gray-600">No aliases found</p>
                                <p className="text-sm text-gray-500 mt-1">Create your first alias to get started</p>
                              </td>
                            </tr>
                          ) : (
                            aliases.map((alias) => (
                              <tr key={alias.id} className="hover:bg-gray-50">
                                <td className="py-3 px-4">
                                  <div className="font-medium text-gray-900">{alias.alias_name}</div>
                                  {alias.created_by_name && (
                                    <div className="text-xs text-gray-500">by {alias.created_by_name}</div>
                                  )}
                                </td>
                                <td className="py-3 px-4">
                                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getAliasTypeBadgeColor(alias.alias_type)}`}>
                                    {getAliasTypeLabel(alias.alias_type)}
                                  </span>
                                </td>
                                <td className="py-3 px-4">
                                  {alias.company_name ? (
                                    <div className="flex items-center gap-2">
                                      <Building2 className="w-4 h-4 text-gray-400" />
                                      <span className="text-sm text-gray-900">{alias.company_name}</span>
                                    </div>
                                  ) : (
                                    <span className="text-sm text-orange-600 font-medium">Unlinked</span>
                                  )}
                                </td>
                                <td className="py-3 px-4">
                                  <span className="text-sm text-gray-700">{alias.priority}</span>
                                </td>
                                <td className="py-3 px-4">
                                  <span className="text-sm text-gray-700">{alias.usage_count}</span>
                                </td>
                                <td className="py-3 px-4">
                                  {alias.is_active ? (
                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                      Active
                                    </span>
                                  ) : (
                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                                      Inactive
                                    </span>
                                  )}
                                </td>
                                <td className="py-3 px-4">
                                  <div className="flex gap-2">
                                    {!alias.company_id && (
                                      <Dialog>
                                        <DialogTrigger asChild>
                                          <Button size="sm" variant="outline">
                                            <LinkIcon className="w-4 h-4" />
                                          </Button>
                                        </DialogTrigger>
                                        <DialogContent>
                                          <DialogHeader>
                                            <DialogTitle>Link Alias to Company</DialogTitle>
                                          </DialogHeader>
                                          <div className="space-y-4">
                                            <p className="text-sm text-gray-600">
                                              Link "{alias.alias_name}" to a company
                                            </p>
                                            <select
                                              onChange={(e) => e.target.value && handleLinkAlias(alias.id, e.target.value)}
                                              className="w-full px-3 py-2 border rounded-md"
                                            >
                                              <option value="">Select a company...</option>
                                              {companies.map((company) => (
                                                <option key={company.id} value={company.id}>
                                                  {company.name}
                                                </option>
                                              ))}
                                            </select>
                                          </div>
                                        </DialogContent>
                                      </Dialog>
                                    )}
                                    
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => handleUpdateAlias(alias.id, { is_active: !alias.is_active })}
                                    >
                                      {alias.is_active ? "Deactivate" : "Activate"}
                                    </Button>
                                    
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => handleDeleteAlias(alias.id, false)}
                                    >
                                      <Trash2 className="w-4 h-4 text-red-600" />
                                    </Button>
                                  </div>
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </Card>
                </TabsContent>

                {/* Suggestions Tab */}
                <TabsContent value="suggestions" className="space-y-4">
                  <Card>
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead className="bg-gray-50 border-b">
                          <tr>
                            <th className="text-left py-3 px-4 font-semibold text-gray-700">Suggested Name</th>
                            <th className="text-left py-3 px-4 font-semibold text-gray-700">Context</th>
                            <th className="text-left py-3 px-4 font-semibold text-gray-700">Submitted By</th>
                            <th className="text-left py-3 px-4 font-semibold text-gray-700">Date</th>
                            <th className="text-left py-3 px-4 font-semibold text-gray-700">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y">
                          {suggestions.length === 0 ? (
                            <tr>
                              <td colSpan={5} className="text-center py-12">
                                <CheckCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                                <p className="text-gray-600">No pending suggestions</p>
                                <p className="text-sm text-gray-500 mt-1">All suggestions have been reviewed</p>
                              </td>
                            </tr>
                          ) : (
                            suggestions.map((suggestion) => (
                              <tr key={suggestion.id} className="hover:bg-gray-50">
                                <td className="py-3 px-4">
                                  <div className="font-medium text-gray-900">{suggestion.suggested_name}</div>
                                </td>
                                <td className="py-3 px-4">
                                  <span className="text-sm text-gray-600">{suggestion.context || "—"}</span>
                                </td>
                                <td className="py-3 px-4">
                                  <span className="text-sm text-gray-700">{suggestion.suggested_by_name || "Anonymous"}</span>
                                </td>
                                <td className="py-3 px-4">
                                  <span className="text-sm text-gray-600">
                                    {new Date(suggestion.created_at).toLocaleDateString()}
                                  </span>
                                </td>
                                <td className="py-3 px-4">
                                  <Dialog>
                                    <DialogTrigger asChild>
                                      <Button size="sm" variant="outline">Review</Button>
                                    </DialogTrigger>
                                    <DialogContent>
                                      <DialogHeader>
                                        <DialogTitle>Review Suggestion</DialogTitle>
                                      </DialogHeader>
                                      <div className="space-y-4">
                                        <div>
                                          <Label>Suggested Name</Label>
                                          <p className="text-lg font-medium mt-1">{suggestion.suggested_name}</p>
                                        </div>
                                        
                                        {suggestion.context && (
                                          <div>
                                            <Label>Context</Label>
                                            <p className="text-sm text-gray-600 mt-1">{suggestion.context}</p>
                                          </div>
                                        )}

                                        <div>
                                          <Label>Link to Company (Optional)</Label>
                                          <select
                                            id={`company-${suggestion.id}`}
                                            className="w-full px-3 py-2 border rounded-md mt-1"
                                          >
                                            <option value="">Don't create alias</option>
                                            {companies.map((company) => (
                                              <option key={company.id} value={company.id}>
                                                {company.name}
                                              </option>
                                            ))}
                                          </select>
                                        </div>

                                        <div className="flex gap-2">
                                          <Button
                                            className="flex-1"
                                            onClick={() => {
                                              const select = document.getElementById(`company-${suggestion.id}`) as HTMLSelectElement;
                                              const companyId = select?.value;
                                              handleReviewSuggestion(
                                                suggestion.id, 
                                                'approved', 
                                                !!companyId,
                                                companyId || undefined
                                              );
                                            }}
                                          >
                                            <CheckCircle className="w-4 h-4 mr-2" />
                                            Approve
                                          </Button>
                                          <Button
                                            variant="outline"
                                            className="flex-1"
                                            onClick={() => handleReviewSuggestion(suggestion.id, 'rejected')}
                                          >
                                            <XCircle className="w-4 h-4 mr-2" />
                                            Reject
                                          </Button>
                                        </div>
                                      </div>
                                    </DialogContent>
                                  </Dialog>
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </Card>
                </TabsContent>
              </Tabs>
            </TabsContent>
          </Tabs>
        </Card>
      </main>

      {/* Company Details Dialog */}
      <Dialog open={showCompanyDialog} onOpenChange={setShowCompanyDialog}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Company Details</DialogTitle>
          </DialogHeader>

          {selectedCompany && (
            <div className="space-y-6">
              {/* Company Info */}
              <div>
                <h3 className="font-semibold text-lg mb-3">Company Information</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Name</p>
                    <p className="font-medium">{selectedCompany.name}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Email</p>
                    <p className="font-medium">{selectedCompany.email}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Type</p>
                    <p className="font-medium capitalize">
                      {selectedCompany.company_type?.replace(/_/g, ' ') || 'N/A'}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Status</p>
                    <div className="mt-1">
                      {getStatusBadge(selectedCompany.verification_status)}
                    </div>
                  </div>
                  {selectedCompany.tax_id && (
                    <div>
                      <p className="text-sm text-gray-600">Tax ID</p>
                      <p className="font-medium">{selectedCompany.tax_id}</p>
                    </div>
                  )}
                  {selectedCompany.website && (
                    <div>
                      <p className="text-sm text-gray-600">Website</p>
                      <a
                        href={selectedCompany.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-medium text-blue-600 hover:underline"
                      >
                        {selectedCompany.website}
                      </a>
                    </div>
                  )}
                </div>

                {selectedCompany.verification_document_url && (
                  <div className="mt-4">
                    <p className="text-sm text-gray-600 mb-2">Verification Document</p>
                    <a
                      href={selectedCompany.verification_document_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline"
                    >
                      View Document
                    </a>
                  </div>
                )}
              </div>

              {/* Representatives */}
              <div>
                <h3 className="font-semibold text-lg mb-3">Representatives</h3>
                {selectedCompany.representatives.length === 0 ? (
                  <p className="text-gray-600 text-sm">No representatives</p>
                ) : (
                  <div className="space-y-2">
                    {selectedCompany.representatives.map((rep) => (
                      <div key={rep.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div>
                          <p className="font-medium">{rep.user_email}</p>
                          <p className="text-sm text-gray-600">{rep.role}</p>
                        </div>
                        <div className="flex items-center space-x-2">
                          {rep.is_primary && (
                            <Badge variant="outline">Primary</Badge>
                          )}
                          {rep.verified ? (
                            <Badge className="bg-green-500 text-white">Verified</Badge>
                          ) : (
                            <Badge variant="outline">Pending</Badge>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Verification History */}
              {selectedCompany.verificationHistory.length > 0 && (
                <div>
                  <h3 className="font-semibold text-lg mb-3">Verification History</h3>
                  <div className="space-y-2">
                    {selectedCompany.verificationHistory.map((action) => (
                      <div key={action.id} className="p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center justify-between mb-1">
                          {getStatusBadge(action.action)}
                          <span className="text-sm text-gray-600">
                            {new Date(action.created_at).toLocaleString()}
                          </span>
                        </div>
                        {action.admin_email && (
                          <p className="text-sm text-gray-600">
                            By: {action.admin_name || action.admin_email}
                          </p>
                        )}
                        {action.notes && (
                          <p className="text-sm text-gray-700 mt-2">{action.notes}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Verification Actions */}
              {selectedCompany.verification_status === 'pending' && (
                <div>
                  <h3 className="font-semibold text-lg mb-3">Verification Actions</h3>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="notes">Notes (optional)</Label>
                      <Textarea
                        id="notes"
                        value={verificationNotes}
                        onChange={(e) => setVerificationNotes(e.target.value)}
                        placeholder="Add any notes about this verification decision..."
                        rows={3}
                      />
                    </div>

                    <div className="flex space-x-3">
                      <Button
                        className="flex-1 bg-green-500 hover:bg-green-600"
                        onClick={() => handleVerifyCompany(selectedCompany.id, 'verified')}
                        disabled={isProcessing}
                      >
                        <CheckCircle className="w-4 h-4 mr-2" />
                        {isProcessing ? 'Processing...' : 'Verify Company'}
                      </Button>
                      <Button
                        variant="destructive"
                        className="flex-1"
                        onClick={() => handleVerifyCompany(selectedCompany.id, 'rejected')}
                        disabled={isProcessing}
                      >
                        <XCircle className="w-4 h-4 mr-2" />
                        {isProcessing ? 'Processing...' : 'Reject Company'}
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
