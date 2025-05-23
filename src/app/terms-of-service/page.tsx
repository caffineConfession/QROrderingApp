
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

export default function TermsOfServicePage() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-grow container mx-auto px-4 py-8">
        <div className="max-w-3xl mx-auto">
          <Button asChild variant="outline" className="mb-6">
            <Link href="/">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Home
            </Link>
          </Button>
          <Card className="shadow-lg rounded-xl">
            <CardHeader>
              <CardTitle className="text-3xl font-bold text-primary">Terms of Service</CardTitle>
              <CardDescription>Last updated: {new Date().toLocaleDateString()}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 prose prose-sm sm:prose-base max-w-none dark:prose-invert">
              <p>
                Welcome to Caffico Express! These terms and conditions outline the rules and regulations for the use of
                Caffico Express's Website, located at [Your Website URL].
              </p>
              <p>
                By accessing this website we assume you accept these terms and conditions. Do not continue to use Caffico Express
                if you do not agree to take all of the terms and conditions stated on this page.
              </p>

              <h2 className="text-xl font-semibold mt-6 mb-2">Cookies</h2>
              <p>
                We employ the use of cookies. By accessing Caffico Express, you agreed to use cookies in agreement with the
                Caffico Express's Privacy Policy. Most interactive websites use cookies to let us retrieve the user's details
                for each visit.
              </p>

              <h2 className="text-xl font-semibold mt-6 mb-2">License</h2>
              <p>
                Unless otherwise stated, Caffico Express and/or its licensors own the intellectual property rights for
                all material on Caffico Express. All intellectual property rights are reserved. You may access this from
                Caffico Express for your own personal use subjected to restrictions set in these terms and conditions.
              </p>
              <p>You must not:</p>
              <ul className="list-disc list-inside pl-4">
                <li>Republish material from Caffico Express</li>
                <li>Sell, rent or sub-license material from Caffico Express</li>
                <li>Reproduce, duplicate or copy material from Caffico Express</li>
                <li>Redistribute content from Caffico Express</li>
              </ul>

              <h2 className="text-xl font-semibold mt-6 mb-2">Disclaimer</h2>
              <p>
                To the maximum extent permitted by applicable law, we exclude all representations, warranties and conditions
                relating to our website and the use of this website. Nothing in this disclaimer will:
              </p>
              <ul className="list-disc list-inside pl-4">
                <li>limit or exclude our or your liability for death or personal injury;</li>
                <li>limit or exclude our or your liability for fraud or fraudulent misrepresentation;</li>
                <li>limit any of our or your liabilities in any way that is not permitted under applicable law; or</li>
                <li>exclude any of our or your liabilities that may not be excluded under applicable law.</li>
              </ul>
              <p>
                The limitations and prohibitions of liability set in this Section and elsewhere in this disclaimer: (a) are
                subject to the preceding paragraph; and (b) govern all liabilities arising under the disclaimer, including
                liabilities arising in contract, in tort and for breach of statutory duty.
              </p>
              <p>
                As long as the website and the information and services on the website are provided free of charge, we will
                not be liable for any loss or damage of any nature.
              </p>
              <p className="mt-6 text-sm text-muted-foreground">
                This is a placeholder Terms of Service. Please replace this with your actual terms.
              </p>
            </CardContent>
          </Card>
        </div>
      </main>
      <Footer />
    </div>
  );
}
