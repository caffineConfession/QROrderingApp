
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

export default function TermsOfServicePage() {
  const lastUpdatedDate = "October 26, 2023"; 
  const companyName = "Caffico Express"; 
  const websiteUrl = "https://www.caffico.com"; 
  const contactEmail = "support@caffico.com"; 

  return (
    // Removed Header and Footer, as they are now in RootLayout
    <div className="container mx-auto px-4 py-8">
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
            <CardDescription>Last updated: {lastUpdatedDate}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6 prose prose-sm sm:prose-base max-w-none dark:prose-invert">
            <p>
                Welcome to {companyName}! These Terms of Service ("Terms") govern your use of our website {websiteUrl} (the "Service") operated by {companyName} ("us", "we", or "our").
                Please read these Terms carefully before using our Service.
            </p>
            <p>
                By accessing or using the Service, you agree to be bound by these Terms. If you disagree with any part of the terms, then you may not access the Service.
            </p>

            <h2 className="text-2xl font-semibold mt-8 mb-3">1. Accounts</h2>
            <p>
                When you create an account with us (if applicable for certain features), you must provide us information that is accurate, complete, and current at all times. Failure to do so constitutes a breach of the Terms, which may result in immediate termination of your account on our Service.
                You are responsible for safeguarding the password that you use to access the Service and for any activities or actions under your password, whether your password is with our Service or a third-party service.
                You agree not to disclose your password to any third party. You must notify us immediately upon becoming aware of any breach of security or unauthorized use of your account.
            </p>

            <h2 className="text-2xl font-semibold mt-8 mb-3">2. Orders and Payments</h2>
            <p>
                If you wish to purchase any product or service made available through the Service ("Purchase"), you may be asked to supply certain information relevant to your Purchase including, without limitation, your name, email, phone number, and payment information.
                All payments are processed through third-party payment processors (e.g., Razorpay). We do not store your full payment card details.
                We reserve the right to refuse or cancel your order at any time for reasons including but not limited to: product or service availability, errors in the description or price of the product or service, error in your order, or other reasons.
                We reserve the right to refuse or cancel your order if fraud or an unauthorized or illegal transaction is suspected.
            </p>
            
            <h2 className="text-2xl font-semibold mt-8 mb-3">3. Product Availability and Pricing</h2>
            <p>
                All products are subject to availability, and we cannot guarantee that items will be in stock. We reserve the right to discontinue any products at any time for any reason. Prices for all products are subject to change.
            </p>

            <h2 className="text-2xl font-semibold mt-8 mb-3">4. Intellectual Property</h2>
            <p>
                The Service and its original content (excluding Content provided by users), features and functionality are and will remain the exclusive property of {companyName} and its licensors. The Service is protected by copyright, trademark, and other laws of both India and foreign countries. Our trademarks and trade dress may not be used in connection with any product or service without the prior written consent of {companyName}.
            </p>

            <h2 className="text-2xl font-semibold mt-8 mb-3">5. User Conduct</h2>
            <p>You agree not to use the Service:</p>
            <ul className="list-disc list-inside space-y-1 pl-4">
                <li>In any way that violates any applicable national or international law or regulation.</li>
                <li>For the purpose of exploiting, harming, or attempting to exploit or harm minors in any way by exposing them to inappropriate content or otherwise.</li>
                <li>To transmit, or procure the sending of, any advertising or promotional material, including any "junk mail", "chain letter," "spam," or any other similar solicitation.</li>
                <li>To impersonate or attempt to impersonate {companyName}, a {companyName} employee, another user, or any other person or entity.</li>
                <li>In any way that infringes upon the rights of others, or in any way is illegal, threatening, fraudulent, or harmful, or in connection with any unlawful, illegal, fraudulent, or harmful purpose or activity.</li>
            </ul>

            <h2 className="text-2xl font-semibold mt-8 mb-3">6. Termination</h2>
            <p>
                We may terminate or suspend your access to our Service immediately, without prior notice or liability, for any reason whatsoever, including without limitation if you breach the Terms.
                Upon termination, your right to use the Service will immediately cease.
            </p>

            <h2 className="text-2xl font-semibold mt-8 mb-3">7. Disclaimer of Warranties</h2>
            <p>
                The Service is provided on an "AS IS" and "AS AVAILABLE" basis. {companyName} makes no representations or warranties of any kind, express or implied, as to the operation of their services, or the information, content or materials included therein. You expressly agree that your use of these services, their content, and any services or items obtained from us is at your sole risk.
            </p>

            <h2 className="text-2xl font-semibold mt-8 mb-3">8. Limitation of Liability</h2>
            <p>
                Except as prohibited by law, you will hold us and our officers, directors, employees, and agents harmless for any indirect, punitive, special, incidental, or consequential damage, however it arises (including attorneys' fees and all related costs and expenses of litigation and arbitration, or at trial or on appeal, if any, whether or not litigation or arbitration is instituted), whether in an action of contract, negligence, or other tortious action, or arising out of or in connection with this agreement, including without limitation any claim for personal injury or property damage, arising from this agreement and any violation by you of any federal, state, or local laws, statutes, rules, or regulations, even if {companyName} has been previously advised of the possibility of such damage.
            </p>

            <h2 className="text-2xl font-semibold mt-8 mb-3">9. Governing Law</h2>
            <p>
                These Terms shall be governed and construed in accordance with the laws of India, without regard to its conflict of law provisions.
            </p>

            <h2 className="text-2xl font-semibold mt-8 mb-3">10. Changes to Terms</h2>
            <p>
                We reserve the right, at our sole discretion, to modify or replace these Terms at any time. If a revision is material we will provide at least 30 days' notice prior to any new terms taking effect. What constitutes a material change will be determined at our sole discretion.
                By continuing to access or use our Service after any revisions become effective, you agree to be bound by the revised terms. If you do not agree to the new terms, you are no longer authorized to use the Service.
            </p>

            <h2 className="text-2xl font-semibold mt-8 mb-3">11. Contact Us</h2>
            <p>If you have any questions about these Terms, please contact us:</p>
            <p>By email: {contactEmail}</p>

            <p className="mt-8 text-sm text-muted-foreground">
                <strong>Disclaimer:</strong> This is a template Terms of Service. You should consult with a legal professional to ensure these terms are adequate for your specific business needs and comply with all applicable laws and regulations.
            </p>
            </CardContent>
        </Card>
        </div>
    </div>
  );
}
