import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { Building2, Users, MessageCircle, LogOut, CheckCircle, Clock, XCircle, UserPlus, Trash2, Star } from "lucide-react";
import { Button } from "~/components/ui/button";
import { Card } from "~/components/ui/card";
import { Badge } from "~/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "~/components/ui/dialog";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/components/ui/tabs";
import { useCompanyAuth } from "~/lib/companyAuth";
import { companiesApi, type CompanyRepresentative } from "~/lib/api";

export default function CompanyDashboard() {
  const navigate = useNavigate();
  const { company, isLoggedIn, isLoading, logout } = useCompanyAuth();
  const [representatives, setRepresentatives] = useState<CompanyRepresentative[]>([]);
  const [reviews, setReviews] = useState<any[]>([]);
  const [reviewsPagination, setReviewsPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  });
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [isLoadingReviews, setIsLoadingReviews] = useState(false);
  const [showAddRepDialog, setShowAddRepDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [repToDelete, setRepToDelete] = useState<CompanyRepresentative | null>(null);
  const [newRepEmail, setNewRepEmail] = useState("");
  const [newRepRole, setNewRepRole] = useState("");
  const [isAddingRep, setIsAddingRep] = useState(false);
  const [addRepError, setAddRepError] = useState<string | null>(null);

  useEffect(() => {
    if (!isLoading && !isLoggedIn) {
      navigate("/company/login");
    }
  }, [isLoading, isLoggedIn, navigate]);

  useEffect(() => {
    const loadData = async () => {
      if (!company) return;
      
      try {
        const response = await companiesApi.getCurrentCompany();
        setRepresentatives(response.representatives);
      } catch (error) {
        console.error("Failed to load company data:", error);
      } finally {
        setIsLoadingData(false);
      }
    };

    loadData();
  }, [company]);

  const loadReviews = async (page: number = 1) => {
    setIsLoadingReviews(true);
    try {
      const response = await companiesApi.getCompanyReviews(page, 10);
      setReviews(response.reviews);
      setReviewsPagination(response.pagination);
    } catch (error) {
      console.error("Failed to load reviews:", error);
    } finally {
      setIsLoadingReviews(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate("/company/login");
  };

  const handleAddRepresentative = async () => {
    if (!newRepEmail || !newRepRole) {
      setAddRepError("Please fill in all fields");
      return;
    }

    setIsAddingRep(true);
    setAddRepError(null);

    try {
      await companiesApi.addRepresentative({
        userEmail: newRepEmail,
        role: newRepRole,
      });

      // Reload representatives
      const response = await companiesApi.getCurrentCompany();
      setRepresentatives(response.representatives);

      // Close dialog and reset form
      setShowAddRepDialog(false);
      setNewRepEmail("");
      setNewRepRole("");
    } catch (error: any) {
      setAddRepError(error.message || "Failed to add representative");
    } finally {
      setIsAddingRep(false);
    }
  };

  const handleDeleteRepresentative = async () => {
    if (!repToDelete) return;

    try {
      await companiesApi.deleteRepresentative(repToDelete.id);
      
      // Reload representatives
      const response = await companiesApi.getCurrentCompany();
      setRepresentatives(response.representatives);
      
      setShowDeleteDialog(false);
      setRepToDelete(null);
    } catch (error: any) {
      console.error("Failed to delete representative:", error);
      alert(error.message || "Failed to delete representative");
    }
  };

  const getVerificationBadge = (status: string) => {
    switch (status) {
      case 'verified':
        return (
          <Badge className="bg-green-100 text-green-800 border-green-200">
            <CheckCircle className="h-3 w-3 mr-1" />
            Verified
          </Badge>
        );
      case 'pending':
        return (
          <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">
            <Clock className="h-3 w-3 mr-1" />
            Pending
          </Badge>
        );
      case 'rejected':
        return (
          <Badge className="bg-red-100 text-red-800 border-red-200">
            <XCircle className="h-3 w-3 mr-1" />
            Rejected
          </Badge>
        );
      default:
        return null;
    }
  };

  const getCompanyTypeLabel = (type: string) => {
    switch (type) {
      case 'landlord': return 'Landlord';
      case 'housing_platform': return 'Housing Platform';
      case 'university': return 'University';
      default: return type;
    }
  };

  if (isLoading || isLoadingData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-600">Loading...</p>
      </div>
    );
  }

  if (!company) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 bg-blue-600 rounded-lg flex items-center justify-center">
                <Building2 className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">{company.name}</h1>
                <p className="text-sm text-gray-600">{getCompanyTypeLabel(company.companyType)}</p>
              </div>
            </div>

            <Button variant="outline" onClick={handleLogout}>
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Company info card */}
        <Card className="p-6 mb-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-2">Company Information</h2>
              <div className="space-y-2 text-sm">
                <div>
                  <span className="text-gray-600">Email:</span>{" "}
                  <span className="text-gray-900">{company.email}</span>
                </div>
                {company.website && (
                  <div>
                    <span className="text-gray-600">Website:</span>{" "}
                    <a 
                      href={company.website} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline"
                    >
                      {company.website}
                    </a>
                  </div>
                )}
                <div>
                  <span className="text-gray-600">Registered:</span>{" "}
                  <span className="text-gray-900">
                    {new Date(company.createdAt).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </span>
                </div>
              </div>
            </div>
            
            <div>
              {getVerificationBadge(company.verificationStatus)}
            </div>
          </div>

          {company.verificationStatus === 'pending' && (
            <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-sm text-yellow-800">
                <strong>Verification Pending:</strong> Your company registration is being reviewed by our team.
                You'll receive an email once your account is approved. Only verified companies can respond to reviews.
              </p>
            </div>
          )}

          {company.verificationStatus === 'rejected' && (
            <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-800">
                <strong>Verification Rejected:</strong> Unfortunately, we were unable to verify your company.
                Please contact support for more information.
              </p>
            </div>
          )}
        </Card>

        {/* Stats cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <Card className="p-6">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <MessageCircle className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Reviews</p>
                <p className="text-2xl font-bold text-gray-900">{reviewsPagination.total}</p>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 bg-green-100 rounded-lg flex items-center justify-center">
                <Users className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Representatives</p>
                <p className="text-2xl font-bold text-gray-900">{representatives.length}</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Representatives section */}
        <Tabs 
          defaultValue="representatives" 
          className="space-y-6"
          onValueChange={(value) => {
            if (value === 'reviews') {
              loadReviews();
            }
          }}
        >
          <TabsList>
            <TabsTrigger value="representatives">
              <Users className="h-4 w-4 mr-2" />
              Representatives
            </TabsTrigger>
            <TabsTrigger value="reviews">
              <MessageCircle className="h-4 w-4 mr-2" />
              Reviews
            </TabsTrigger>
          </TabsList>

          {/* Representatives Tab */}
          <TabsContent value="representatives">
            <Card className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900">Company Representatives</h2>
                <Button 
                  size="sm" 
                  disabled={company.verificationStatus !== 'verified'}
                  onClick={() => setShowAddRepDialog(true)}
                >
                  <UserPlus className="h-4 w-4 mr-2" />
                  Add Representative
                </Button>
              </div>

              {representatives.length === 0 ? (
                <p className="text-sm text-gray-600 text-center py-8">
                  No representatives added yet.
                </p>
              ) : (
                <div className="space-y-3">
                  {representatives.map((rep) => (
                    <div
                      key={rep.id}
                      className="flex items-start justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="font-medium text-gray-900">{rep.user_email}</p>
                          {rep.is_primary && (
                            <Badge variant="secondary" className="text-xs">
                              Primary
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-gray-600 mb-2">{rep.role}</p>
                        <p className="text-xs text-gray-500">
                          Added {new Date(rep.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        {!rep.is_primary && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setRepToDelete(rep);
                              setShowDeleteDialog(true);
                            }}
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Remove
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </TabsContent>

          {/* Reviews Tab */}
          <TabsContent value="reviews">
            <Card className="p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Reviews for Your Locations</h2>
              
              {isLoadingReviews ? (
                <div className="text-center py-12">
                  <p className="text-gray-600">Loading reviews...</p>
                </div>
              ) : reviews.length === 0 ? (
                <div className="text-center py-12">
                  <MessageCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600 mb-2">No reviews found for your locations.</p>
                  <p className="text-sm text-gray-500">
                    Reviews will appear here once you have locations registered and customers leave reviews.
                  </p>
                </div>
              ) : (
                <>
                  <div className="space-y-4">
                    {reviews.map((review) => (
                      <div key={review.id} className="p-4 bg-gray-50 rounded-lg">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex-1">
                            <h3 className="font-semibold text-gray-900">{review.location_name}</h3>
                            <p className="text-sm text-gray-600">{review.address}</p>
                          </div>
                          <div className="flex items-center gap-1">
                            {[...Array(5)].map((_, i) => (
                              <Star
                                key={i}
                                className={`h-4 w-4 ${
                                  i < review.rating
                                    ? 'text-yellow-400 fill-yellow-400'
                                    : 'text-gray-300'
                                }`}
                              />
                            ))}
                          </div>
                        </div>
                        <p className="text-sm text-gray-700 mb-2">{review.review_text}</p>
                        <div className="flex items-center justify-between text-xs text-gray-500">
                          <span>By: {review.reviewer_name || review.reviewer_email}</span>
                          <span>{new Date(review.created_at).toLocaleDateString()}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  {reviewsPagination.totalPages > 1 && (
                    <div className="flex items-center justify-center gap-2 mt-6">
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={reviewsPagination.page === 1}
                        onClick={() => loadReviews(reviewsPagination.page - 1)}
                      >
                        Previous
                      </Button>
                      <span className="text-sm text-gray-600">
                        Page {reviewsPagination.page} of {reviewsPagination.totalPages}
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={reviewsPagination.page === reviewsPagination.totalPages}
                        onClick={() => loadReviews(reviewsPagination.page + 1)}
                      >
                        Next
                      </Button>
                    </div>
                  )}
                </>
              )}
            </Card>
          </TabsContent>
        </Tabs>
      </main>

      {/* Add Representative Dialog */}
      <Dialog open={showAddRepDialog} onOpenChange={setShowAddRepDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Representative</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="rep-email">Email Address</Label>
              <Input
                id="rep-email"
                type="email"
                placeholder="representative@email.com"
                value={newRepEmail}
                onChange={(e) => setNewRepEmail(e.target.value)}
                disabled={isAddingRep}
              />
              <p className="text-xs text-gray-500">
                The person must have an existing user account
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="rep-role">Role/Position</Label>
              <Input
                id="rep-role"
                type="text"
                placeholder="e.g., Manager, Owner, Staff"
                value={newRepRole}
                onChange={(e) => setNewRepRole(e.target.value)}
                disabled={isAddingRep}
              />
            </div>
            {addRepError && (
              <div className="text-sm text-red-600 bg-red-50 p-3 rounded">
                {addRepError}
              </div>
            )}
            <div className="flex gap-2 justify-end">
              <Button
                variant="outline"
                onClick={() => {
                  setShowAddRepDialog(false);
                  setNewRepEmail("");
                  setNewRepRole("");
                  setAddRepError(null);
                }}
                disabled={isAddingRep}
              >
                Cancel
              </Button>
              <Button
                onClick={handleAddRepresentative}
                disabled={isAddingRep || !newRepEmail || !newRepRole}
              >
                {isAddingRep ? "Adding..." : "Add Representative"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Representative Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Remove Representative</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <p className="text-sm text-gray-600">
              Are you sure you want to remove <strong>{repToDelete?.user_email}</strong> as a representative?
              This action cannot be undone.
            </p>
            <div className="flex gap-2 justify-end">
              <Button
                variant="outline"
                onClick={() => {
                  setShowDeleteDialog(false);
                  setRepToDelete(null);
                }}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={handleDeleteRepresentative}
              >
                Remove Representative
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
