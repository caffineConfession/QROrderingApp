
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

export default function PrivacyPolicyPage() {
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
              <CardTitle className="text-3xl font-bold text-primary">Privacy Policy</CardTitle>
              <CardDescription>Last updated: {new Date().toLocaleDateString()}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 prose prose-sm sm:prose-base max-w-none dark:prose-invert">
              <p>
                Your privacy is important to us. It is Caffico Express's policy to respect your privacy regarding any
                information we may collect from you across our website, [Your Website URL], and other sites we own and operate.
              </p>
              <p>
                We only ask for personal information when we truly need it to provide a service to you. We collect it by fair
                and lawful means, with your knowledge and consent. We also let you know why we’re collecting it and how it
                will be used.
              </p>

              <h2 className="text-xl font-semibold mt-6 mb-2">Information We Collect</h2>
              <p>
                Log data: When you visit our website, our servers may automatically log the standard data provided by your
                web browser. This data is considered "non-identifying information."
              </p>
              <p>
                Personal information: We may ask you for personal information, such as your name, email, phone number, and
                payment information. This data is considered "identifying information."
              </p>

              <h2 className="text-xl font-semibold mt-6 mb-2">Use of Information</h2>
              <p>
                We may use the information we collect for various purposes, including to:
              </p>
              <ul className="list-disc list-inside pl-4">
                <li>Provide, operate, and maintain our website</li>
                <li>Improve, personalize, and expand our website</li>
                <li>Understand and analyze how you use our website</li>
                <li>Develop new products, services, features, and functionality</li>
                <li>Communicate with you, either directly or through one of our partners, including for customer service, to
                provide you with updates and other information relating to the website, and for marketing and promotional purposes</li>
                <li>Process your transactions</li>
                <li>Find and prevent fraud</li>
              </ul>

              <h2 className="text-xl font-semibold mt-6 mb-2">Security</h2>
              <p>
                The security of your personal information is important to us, but remember that no method of transmission
                over the Internet, or method of electronic storage, is 100% secure. While we strive to use commercially
                acceptable means to protect your personal information, we cannot guarantee its absolute security.
              </p>

              <h2 className="text-xl font-semibold mt-6 mb-2">Changes to This Privacy Policy</h2>
              <p>
                We may update our Privacy Policy from time to time. We will notify you of any changes by posting the new
                Privacy Policy on this page. You are advised to review this Privacy Policy periodically for any changes.
                Changes to this Privacy Policy are effective when they are posted on this page.
              </p>
               <p className="mt-6 text-sm text-muted-foreground">
                This is a placeholder Privacy Policy. Please replace this with your actual policy.
              </p>
            </CardContent>
          </Card>
        </div>
      </main>
      <Footer />
    </div>
  );
}
