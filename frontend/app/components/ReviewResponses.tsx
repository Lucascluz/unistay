import { useState } from "react";
import { Building2, User, MessageCircle } from "lucide-react";
import { Button } from "~/components/ui/button";
import { Textarea } from "~/components/ui/textarea";
import { Card } from "~/components/ui/card";
import { Badge } from "~/components/ui/badge";
import { responsesApi, type ReviewResponse } from "~/lib/api";
import { useAuth } from "~/lib/auth";

interface ReviewResponsesProps {
  reviewId: string;
  responses?: ReviewResponse[];
  onResponseAdded?: () => void;
}

export function ReviewResponses({ reviewId, responses = [], onResponseAdded }: ReviewResponsesProps) {
  const { isLoggedIn } = useAuth();
  const [showReplyForm, setShowReplyForm] = useState(false);
  const [responseText, setResponseText] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmitResponse = async () => {
    if (!responseText.trim()) return;

    setIsSubmitting(true);
    setError(null);

    try {
      await responsesApi.createUserResponse({
        reviewId,
        responseText: responseText.trim(),
      });
      
      setResponseText("");
      setShowReplyForm(false);
      onResponseAdded?.();
    } catch (err: any) {
      setError(err.message || "Failed to submit response");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="mt-4 space-y-3">
      {/* Response header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <MessageCircle className="h-4 w-4" />
          <span>{responses.length} {responses.length === 1 ? 'Response' : 'Responses'}</span>
        </div>
        
        {isLoggedIn && !showReplyForm && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowReplyForm(true)}
          >
            Add Response
          </Button>
        )}
      </div>

      {/* Response form */}
      {showReplyForm && (
        <Card className="p-4 border-blue-200 bg-blue-50 dark:bg-blue-900/20 dark:border-blue-800">
          <Textarea
            value={responseText}
            onChange={(e) => setResponseText(e.target.value)}
            placeholder="Share your thoughts or ask a question..."
            className="min-h-[100px] mb-3"
            maxLength={2000}
          />
          
          {error && (
            <p className="text-sm text-red-600 mb-3">{error}</p>
          )}
          
          <div className="flex justify-between items-center">
            <span className="text-xs text-gray-500">
              {responseText.length} / 2000 characters
            </span>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setShowReplyForm(false);
                  setResponseText("");
                  setError(null);
                }}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={handleSubmitResponse}
                disabled={!responseText.trim() || isSubmitting}
              >
                {isSubmitting ? "Posting..." : "Post Response"}
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Responses list */}
      {responses.length > 0 && (
        <div className="space-y-3">
          {responses.map((response) => (
            <ResponseItem key={response.id} response={response} />
          ))}
        </div>
      )}

      {/* No responses message */}
      {responses.length === 0 && !showReplyForm && (
        <p className="text-sm text-gray-500 text-center py-4">
          No responses yet. Be the first to comment!
        </p>
      )}
    </div>
  );
}

function ResponseItem({ response }: { response: ReviewResponse }) {
  const isCompany = response.authorType === 'company';
  
  const getCompanyTypeLabel = (type?: string) => {
    switch (type) {
      case 'landlord': return 'Landlord';
      case 'housing_platform': return 'Housing Platform';
      case 'university': return 'University';
      default: return 'Company';
    }
  };

  return (
    <Card className={`p-4 ${isCompany ? 'border-blue-200 bg-blue-50 dark:bg-blue-900/20 dark:border-blue-800' : 'border-gray-200'}`}>
      <div className="flex items-start gap-3">
        {/* Avatar */}
        <div className={`
          h-10 w-10 rounded-full flex items-center justify-center flex-shrink-0
          ${isCompany ? 'bg-blue-600' : 'bg-gray-600'}
        `}>
          {isCompany ? (
            <Building2 className="h-5 w-5 text-white" />
          ) : (
            <User className="h-5 w-5 text-white" />
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <span className="font-semibold text-sm">
              {response.authorName}
            </span>
            
            {isCompany && (
              <Badge variant="secondary" className="text-xs bg-blue-600 text-white hover:bg-blue-700">
                {getCompanyTypeLabel(response.companyType)}
              </Badge>
            )}
            
            <span className="text-xs text-gray-500">
              {new Date(response.createdAt).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
              })}
            </span>
          </div>

          <p className="text-sm text-gray-700 whitespace-pre-wrap">
            {response.responseText}
          </p>

          {response.updatedAt && response.updatedAt !== response.createdAt && (
            <span className="text-xs text-gray-400 mt-1 inline-block">
              (edited)
            </span>
          )}
        </div>
      </div>
    </Card>
  );
}
