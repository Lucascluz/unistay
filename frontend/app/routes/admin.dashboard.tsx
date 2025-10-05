import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { Shield, Building2, Users, MessageCircle, LogOut, CheckCircle, XCircle, Clock, FileText } from "lucide-react";
import { Button } from "~/components/ui/button";
import { Card } from "~/components/ui/card";
import { Badge } from "~/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "~/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/components/ui/tabs";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Textarea } from "~/components/ui/textarea";
import { adminApi, type PendingCompany, type CompanyDetails, type AdminStats } from "~/lib/api";

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
  const [activeTab, setActiveTab] = useState<"pending" | "verified" | "rejected" | "all">("pending");

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

  const loadData = async () => {
    try {
      setError(null);
      
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
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Shield className="w-8 h-8 text-blue-500" />
              <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
            </div>
            <Button variant="outline" onClick={handleLogout}>
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </Button>
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
