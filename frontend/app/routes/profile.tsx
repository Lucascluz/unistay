import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Card } from "~/components/ui/card";
import { TrustScoreBadge, TrustScoreDetail } from "~/components/TrustScoreBadge";
import { ProfileCompletion } from "~/components/ProfileCompletion";
import { EmailVerificationBanner } from "~/components/EmailVerificationBanner";
import { userApi, type User, type UpdateUserProfileRequest, type UserProfileResponse, type TrustScoreResponse } from "~/lib/api";
import { useAuth } from "~/lib/auth";
import { Loader2, Save, User as UserIcon } from "lucide-react";

export function meta() {
  return [
    { title: "My Profile - UniStay" },
    { name: "description", content: "Manage your UniStay profile" },
  ];
}

export default function Profile() {
  const { user: authUser, isLoggedIn } = useAuth();
  const navigate = useNavigate();
  
  const [profileData, setProfileData] = useState<UserProfileResponse | null>(null);
  const [trustScoreData, setTrustScoreData] = useState<TrustScoreResponse | null>(null);
  const [formData, setFormData] = useState<UpdateUserProfileRequest>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    if (!isLoggedIn) {
      navigate("/login?redirect=/profile");
      return;
    }

    loadProfile();
  }, [isLoggedIn, navigate]);

  const loadProfile = async () => {
    try {
      setIsLoading(true);
      const [profile, trustScore] = await Promise.all([
        userApi.getProfile(),
        userApi.getTrustScore(),
      ]);
      
      setProfileData(profile);
      setTrustScoreData(trustScore);
      
      // Initialize form with current data
      setFormData({
        name: profile.user.name,
        nationality: profile.user.nationality,
        gender: profile.user.gender,
        currentCountry: profile.user.currentCountry,
        currentCity: profile.user.currentCity,
        homeUniversity: profile.user.homeUniversity,
        destinationUniversity: profile.user.destinationUniversity,
        studyField: profile.user.studyField,
        studyLevel: profile.user.studyLevel,
        studyStartDate: profile.user.studyStartDate,
        studyEndDate: profile.user.studyEndDate,
        currentHousingType: profile.user.currentHousingType,
        monthlyRent: profile.user.monthlyRent,
        isCurrentlyRenting: profile.user.isCurrentlyRenting,
        hasLivedAbroadBefore: profile.user.hasLivedAbroadBefore,
      });
    } catch (err) {
      setError("Failed to load profile");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setIsSaving(true);

    try {
      await userApi.updateProfile(formData);
      setSuccess("Profile updated successfully! Your trust score has been recalculated.");
      await loadProfile(); // Reload to get updated scores
    } catch (err) {
      setError("Failed to update profile");
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!profileData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Failed to load profile</p>
          <Button onClick={loadProfile} className="mt-4">Retry</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Email Verification Banner */}
      {!profileData.user.emailVerified && (
        <EmailVerificationBanner email={profileData.user.email} />
      )}

      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-6xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
                <UserIcon className="w-8 h-8 text-blue-600" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                  {profileData.user.name}
                  {profileData.user.emailVerified && (
                    <svg className="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                  )}
                </h1>
                <p className="text-gray-600">{profileData.user.email}</p>
              </div>
            </div>
            <TrustScoreBadge score={profileData.user.trustScore} size="lg" />
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left column - Stats */}
          <div className="space-y-6">
            {trustScoreData && (
              <TrustScoreDetail
                score={trustScoreData.trust_score}
                breakdown={trustScoreData.breakdown}
                level={trustScoreData.level}
              />
            )}

            <ProfileCompletion
              user={profileData.user}
              tasks={profileData.profile_tasks}
              showTasks={true}
            />
          </div>

          {/* Right column - Form */}
          <div className="lg:col-span-2">
            <Card className="p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">Edit Profile</h2>

              {error && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm text-red-600">{error}</p>
                </div>
              )}

              {success && (
                <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                  <p className="text-sm text-green-600">{success}</p>
                </div>
              )}

              <form onSubmit={handleSave} className="space-y-6">
                {/* Basic Info */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900">Basic Information</h3>

                  <div className="space-y-2">
                    <Label htmlFor="name">Full Name</Label>
                    <Input
                      id="name"
                      value={formData.name || ''}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      disabled={isSaving}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="nationality">Nationality</Label>
                      <Input
                        id="nationality"
                        placeholder="e.g., Germany"
                        value={formData.nationality || ''}
                        onChange={(e) => setFormData({ ...formData, nationality: e.target.value })}
                        disabled={isSaving}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="gender">Gender</Label>
                      <select
                        id="gender"
                        value={formData.gender || ''}
                        onChange={(e) => setFormData({ ...formData, gender: e.target.value as any })}
                        disabled={isSaving}
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                      >
                        <option value="">Prefer not to say</option>
                        <option value="male">Male</option>
                        <option value="female">Female</option>
                        <option value="non_binary">Non-binary</option>
                        <option value="prefer_not_to_say">Prefer not to say</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="currentCountry">Current Country</Label>
                      <Input
                        id="currentCountry"
                        placeholder="e.g., Portugal"
                        value={formData.currentCountry || ''}
                        onChange={(e) => setFormData({ ...formData, currentCountry: e.target.value })}
                        disabled={isSaving}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="currentCity">Current City</Label>
                      <Input
                        id="currentCity"
                        placeholder="e.g., Lisbon"
                        value={formData.currentCity || ''}
                        onChange={(e) => setFormData({ ...formData, currentCity: e.target.value })}
                        disabled={isSaving}
                      />
                    </div>
                  </div>
                </div>

                {/* Academic Info */}
                <div className="space-y-4 pt-4 border-t">
                  <h3 className="text-lg font-semibold text-gray-900">Academic Information</h3>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="homeUniversity">Home University</Label>
                      <Input
                        id="homeUniversity"
                        placeholder="e.g., TU Munich"
                        value={formData.homeUniversity || ''}
                        onChange={(e) => setFormData({ ...formData, homeUniversity: e.target.value })}
                        disabled={isSaving}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="destinationUniversity">Destination University</Label>
                      <Input
                        id="destinationUniversity"
                        placeholder="e.g., University of Lisbon"
                        value={formData.destinationUniversity || ''}
                        onChange={(e) => setFormData({ ...formData, destinationUniversity: e.target.value })}
                        disabled={isSaving}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="studyField">Field of Study</Label>
                      <Input
                        id="studyField"
                        placeholder="e.g., Computer Science"
                        value={formData.studyField || ''}
                        onChange={(e) => setFormData({ ...formData, studyField: e.target.value })}
                        disabled={isSaving}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="studyLevel">Study Level</Label>
                      <select
                        id="studyLevel"
                        value={formData.studyLevel || ''}
                        onChange={(e) => setFormData({ ...formData, studyLevel: e.target.value as any })}
                        disabled={isSaving}
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                      >
                        <option value="">Select level</option>
                        <option value="bachelor">Bachelor</option>
                        <option value="master">Master</option>
                        <option value="phd">PhD</option>
                        <option value="exchange">Exchange</option>
                        <option value="other">Other</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="studyStartDate">Study Start Date</Label>
                      <Input
                        id="studyStartDate"
                        type="date"
                        value={formData.studyStartDate || ''}
                        onChange={(e) => setFormData({ ...formData, studyStartDate: e.target.value })}
                        disabled={isSaving}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="studyEndDate">Study End Date</Label>
                      <Input
                        id="studyEndDate"
                        type="date"
                        value={formData.studyEndDate || ''}
                        onChange={(e) => setFormData({ ...formData, studyEndDate: e.target.value })}
                        disabled={isSaving}
                      />
                    </div>
                  </div>
                </div>

                {/* Housing Info */}
                <div className="space-y-4 pt-4 border-t">
                  <h3 className="text-lg font-semibold text-gray-900">Housing Information</h3>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="currentHousingType">Current Housing Type</Label>
                      <select
                        id="currentHousingType"
                        value={formData.currentHousingType || ''}
                        onChange={(e) => setFormData({ ...formData, currentHousingType: e.target.value as any })}
                        disabled={isSaving}
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                      >
                        <option value="">Select type</option>
                        <option value="student_home">Student Home</option>
                        <option value="shared_apartment">Shared Apartment</option>
                        <option value="private_apartment">Private Apartment</option>
                        <option value="family">Family</option>
                        <option value="other">Other</option>
                      </select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="monthlyRent">Monthly Rent (€)</Label>
                      <Input
                        id="monthlyRent"
                        type="number"
                        placeholder="e.g., 500"
                        value={formData.monthlyRent || ''}
                        onChange={(e) => setFormData({ ...formData, monthlyRent: parseFloat(e.target.value) || undefined })}
                        disabled={isSaving}
                      />
                    </div>
                  </div>

                  <div className="flex gap-6">
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={formData.isCurrentlyRenting || false}
                        onChange={(e) => setFormData({ ...formData, isCurrentlyRenting: e.target.checked })}
                        disabled={isSaving}
                        className="h-4 w-4 rounded border-gray-300"
                      />
                      <span className="text-sm text-gray-700">Currently Renting</span>
                    </label>

                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={formData.hasLivedAbroadBefore || false}
                        onChange={(e) => setFormData({ ...formData, hasLivedAbroadBefore: e.target.checked })}
                        disabled={isSaving}
                        className="h-4 w-4 rounded border-gray-300"
                      />
                      <span className="text-sm text-gray-700">Lived Abroad Before</span>
                    </label>
                  </div>
                </div>

                <div className="flex gap-4 pt-4">
                  <Button
                    type="submit"
                    disabled={isSaving}
                    className="flex-1"
                  >
                    {isSaving ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4 mr-2" />
                        Save Changes
                      </>
                    )}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => navigate("/")}
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
