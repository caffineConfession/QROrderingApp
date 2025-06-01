
"use client";

import { useState } from 'react';
import type { SubmitHandler } from 'react-hook-form'; // Using simple state, not react-hook-form here
import type { CartItemClient, ProductRatingSubmission, AllRatingsSubmissionData } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardFooter, CardDescription } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import StarRatingInput from './StarRatingInput';
import { Send, RefreshCw, ThumbsUp, MessageSquare } from 'lucide-react';
import { Separator } from './ui/separator';
import { ScrollArea } from './ui/scroll-area';

interface RatingFormProps {
  orderId: string;
  orderedItems: CartItemClient[]; // Items from the order to be rated
  onSubmit: (data: AllRatingsSubmissionData) => Promise<{ success: boolean; error?: string }>;
  onSubmitted?: () => void; // Optional: callback after successful submission
}

interface ProductRatingState {
  productId: string;
  productName: string;
  rating: number;
  comment?: string;
}

export default function RatingForm({ orderId, orderedItems, onSubmit, onSubmitted }: RatingFormProps) {
  const [overallRating, setOverallRating] = useState(0);
  const [overallComment, setOverallComment] = useState('');
  const [productRatings, setProductRatings] = useState<ProductRatingState[]>(
    orderedItems.map(item => ({
      productId: item.id, // Assuming CartItemClient has 'id' as productId
      productName: item.name,
      rating: 0,
      comment: '',
    }))
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleProductRatingChange = (productId: string, newRating: number) => {
    setProductRatings(prev =>
      prev.map(pr => (pr.productId === productId ? { ...pr, rating: newRating } : pr))
    );
  };

  const handleProductCommentChange = (productId: string, newComment: string) => {
    setProductRatings(prev =>
      prev.map(pr => (pr.productId === productId ? { ...pr, comment: newComment } : pr))
    );
  };

  const handleSubmit: React.FormEventHandler<HTMLFormElement> = async (e) => {
    e.preventDefault();
    setError(null);

    if (overallRating === 0) {
      setError("Please provide an overall experience rating.");
      return;
    }
    // Optional: Add validation for product ratings if they are mandatory

    setIsSubmitting(true);
    const submissionData: AllRatingsSubmissionData = {
      orderId,
      overallRating,
      overallComment: overallComment.trim() || undefined,
      productRatings: productRatings.map(pr => ({
        productId: pr.productId,
        productName: pr.productName,
        rating: pr.rating,
        comment: pr.comment?.trim() || undefined,
      })).filter(pr => pr.rating > 0), // Only submit products that were actually rated
    };

    const result = await onSubmit(submissionData);
    setIsSubmitting(false);

    if (result.success) {
      if (onSubmitted) onSubmitted();
    } else {
      setError(result.error || "An unexpected error occurred.");
    }
  };

  return (
    <Card className="shadow-xl rounded-xl w-full max-w-2xl">
      <CardHeader>
        <CardTitle className="text-2xl flex items-center"><ThumbsUp className="mr-3 h-7 w-7 text-primary" /> Rate Your Experience</CardTitle>
        <CardDescription>We value your feedback! Let us know how we did and how you liked your items.</CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-6">
          <div>
            <Label htmlFor="overallRating" className="text-lg font-semibold mb-2 block">Overall Experience</Label>
            <StarRatingInput value={overallRating} onChange={setOverallRating} size={32} />
          </div>
          <div>
            <Label htmlFor="overallComment" className="flex items-center mb-1"><MessageSquare className="mr-1 h-4 w-4 text-muted-foreground"/>Overall Comment (Optional)</Label>
            <Textarea
              id="overallComment"
              value={overallComment}
              onChange={(e) => setOverallComment(e.target.value)}
              placeholder="Tell us about your overall experience..."
              rows={3}
              disabled={isSubmitting}
            />
          </div>

          <Separator />

          <h3 className="text-lg font-semibold">Rate Your Items</h3>
          {orderedItems.length > 0 ? (
            <ScrollArea className="max-h-[300px] space-y-4 pr-3">
              {productRatings.map((pr, index) => (
                <div key={pr.productId} className="p-3 border rounded-md bg-muted/30 space-y-2">
                  <Label htmlFor={`productRating-${pr.productId}`} className="font-medium block">{pr.productName}</Label>
                  <StarRatingInput
                    value={pr.rating}
                    onChange={(newRating) => handleProductRatingChange(pr.productId, newRating)}
                  />
                  <Textarea
                    id={`productComment-${pr.productId}`}
                    value={pr.comment || ''}
                    onChange={(e) => handleProductCommentChange(pr.productId, e.target.value)}
                    placeholder="Comments about this item (optional)..."
                    rows={2}
                    disabled={isSubmitting}
                    className="text-sm"
                  />
                </div>
              ))}
            </ScrollArea>
          ) : (
            <p className="text-muted-foreground">No items in this order to rate individually.</p>
          )}

          {error && <p className="text-sm text-destructive">{error}</p>}
        </CardContent>
        <CardFooter>
          <Button type="submit" className="w-full" size="lg" disabled={isSubmitting || overallRating === 0}>
            {isSubmitting ? <RefreshCw className="mr-2 h-5 w-5 animate-spin" /> : <Send className="mr-2 h-5 w-5" />}
            {isSubmitting ? "Submitting..." : "Submit Ratings"}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
