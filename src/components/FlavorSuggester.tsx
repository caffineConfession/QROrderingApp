"use client";

import { useState } from 'react';
import { suggestFlavor, type SuggestFlavorOutput } from '@/ai/flows/suggest-flavor';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Lightbulb, MapPin, ThumbsUp, Zap } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";

export default function FlavorSuggester() {
  const [location, setLocation] = useState('');
  const [suggestion, setSuggestion] = useState<SuggestFlavorOutput | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSuggestFlavor = async () => {
    if (!location.trim()) {
      setError("Please enter a location.");
      return;
    }
    setIsLoading(true);
    setError(null);
    setSuggestion(null);
    try {
      const result = await suggestFlavor({ location });
      setSuggestion(result);
    } catch (err) {
      console.error("Error suggesting flavor:", err);
      setError("Sorry, we couldn't fetch a suggestion at this time. Please try again later.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="shadow-lg rounded-xl overflow-hidden">
      <CardHeader className="bg-muted/50 p-6">
        <CardTitle className="flex items-center text-xl">
          <Lightbulb className="mr-2 h-6 w-6 text-primary" /> Flavor Adventure!
        </CardTitle>
        <CardDescription>Not sure what to try? Let our AI suggest a popular flavor for your location!</CardDescription>
      </CardHeader>
      <CardContent className="p-6 space-y-4">
        <div>
          <Label htmlFor="location" className="flex items-center mb-2">
            <MapPin className="mr-1 h-4 w-4 text-muted-foreground" /> Your City/Area
          </Label>
          <Input
            id="location"
            type="text"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="e.g., Mumbai, Bangalore, etc."
            disabled={isLoading}
          />
        </div>
      </CardContent>
      <CardFooter className="p-6 border-t">
        <Button onClick={handleSuggestFlavor} disabled={isLoading || !location.trim()} className="w-full">
          {isLoading ? (
            <>
              <Zap className="mr-2 h-4 w-4 animate-spin" /> Getting Suggestion...
            </>
          ) : (
            <>
              <Zap className="mr-2 h-4 w-4" /> Suggest a Flavor
            </>
          )}
        </Button>
      </CardFooter>

      {isLoading && (
        <div className="p-6 space-y-3">
          <Skeleton className="h-6 w-1/3" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
        </div>
      )}

      {error && (
        <div className="p-6">
          <Alert variant="destructive">
            <AlertTitle>Oops!</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        </div>
      )}

      {suggestion && !isLoading && (
        <div className="p-6 bg-primary/5">
          <Alert variant="default" className="border-primary bg-background">
             <ThumbsUp className="h-5 w-5 text-primary" />
            <AlertTitle className="text-lg font-semibold text-primary">Try our {suggestion.flavor}!</AlertTitle>
            <AlertDescription className="mt-2 text-foreground">
              {suggestion.reason}
            </AlertDescription>
          </Alert>
        </div>
      )}
    </Card>
  );
}
