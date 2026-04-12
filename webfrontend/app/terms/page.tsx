import { NavbarWhite } from "@/layout/Navbar";
import Link from "next/link";
import { Metadata } from "next";

const SITE_URL = process.env.NEXT_PUBLIC_APP_URL || "https://repairo-garage.vercel.app";

export const metadata: Metadata = {
  title: "Terms & Conditions | Repairo Garage Management Software",
  description:
    "Read Repairo's Terms and Conditions governing use of our workshop management platform, subscription billing, and public garage directory listing.",
  keywords: ["Repairo terms", "garage software terms of service", "workshop app India terms"],
  alternates: { canonical: `${SITE_URL}/terms` },
  robots: { index: true, follow: true },
  openGraph: {
    title: "Repairo Terms & Conditions",
    description: "The terms governing use of Repairo's garage management platform and workshop finder.",
    url: `${SITE_URL}/terms`,
  },
};

const breadcrumbSchema = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: [
    { "@type": "ListItem", position: 1, name: "Home", item: SITE_URL },
    { "@type": "ListItem", position: 2, name: "Terms & Conditions", item: `${SITE_URL}/terms` },
  ],
};

export default function TermsPage() {
  const updated = "12 April 2026";
  return (
    <div className="min-h-screen bg-background">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      <NavbarWhite />
      <div className="max-w-3xl mx-auto px-6 pt-36 pb-24">
        <div className="flex items-center gap-2 mb-6">
          <div className="h-[1px] w-6 bg-primary" />
          <span className="font-mono text-[10px] text-primary uppercase tracking-[0.3em]">Legal</span>
        </div>
        <h1 className="text-4xl font-black text-foreground mb-2">Terms & Conditions</h1>
        <p className="text-sm text-muted-foreground font-mono mb-12">Last updated: {updated}</p>

        <div className="flex flex-col gap-10 text-foreground">

          <section className="flex flex-col gap-3">
            <h2 className="text-lg font-bold border-b border-border pb-2">1. Acceptance of Terms</h2>
            <p className="text-muted-foreground leading-relaxed">
              By accessing or using Repairo ("the Platform"), you agree to be bound by these Terms and Conditions. 
              If you are registering a garage ("Shop Owner"), you represent that you have the authority to bind your 
              business to these terms. If you do not agree, please do not use the Platform.
            </p>
          </section>

          <section className="flex flex-col gap-3">
            <h2 className="text-lg font-bold border-b border-border pb-2">2. Description of Service</h2>
            <p className="text-muted-foreground leading-relaxed">
              Repairo provides a cloud-based vehicle repair management system for garages. Features include:
            </p>
            <ul className="list-disc pl-5 flex flex-col gap-2 text-muted-foreground leading-relaxed">
              <li>Digital job card creation and management</li>
              <li>Customer and vehicle record keeping</li>
              <li>Inventory and service tracking</li>
              <li>PDF invoice generation</li>
              <li>Multi-role staff access (admins, technicians, receptionists)</li>
              <li>Public workshop directory listing</li>
            </ul>
          </section>

          <section className="flex flex-col gap-3">
            <h2 className="text-lg font-bold border-b border-border pb-2">3. Account Registration</h2>
            <p className="text-muted-foreground leading-relaxed">
              You must provide accurate and complete information when registering. You are responsible for 
              maintaining the confidentiality of your account credentials and for all activity that occurs under your account. 
              Notify us immediately at <a href="mailto:alenjames899@gmail.com" className="text-primary hover:underline">alenjames899@gmail.com</a> if 
              you suspect unauthorized access.
            </p>
          </section>

          <section className="flex flex-col gap-3">
            <h2 className="text-lg font-bold border-b border-border pb-2">4. Subscription & Payment</h2>
            <p className="text-muted-foreground leading-relaxed">
              Repairo operates on a subscription model. The current pricing is available on our 
              <Link href="/pricing" className="text-primary hover:underline mx-1">Pricing page</Link>. 
              Payments are processed via UPI/bank transfer with manual verification. Subscriptions renew monthly unless 
              cancelled before the renewal date. We do not offer refunds for partial months unless there is a verified service outage.
            </p>
          </section>

          <section className="flex flex-col gap-3">
            <h2 className="text-lg font-bold border-b border-border pb-2">5. Acceptable Use</h2>
            <p className="text-muted-foreground leading-relaxed">You agree not to:</p>
            <ul className="list-disc pl-5 flex flex-col gap-2 text-muted-foreground leading-relaxed">
              <li>Use the platform for any unlawful purpose or in violation of applicable Indian law</li>
              <li>Attempt to access another garage's data without authorization</li>
              <li>Upload malicious code, viruses, or disruptive content</li>
              <li>Resell or sublicense access to the platform without written consent</li>
              <li>Scrape or harvest data from the public workshop directory in bulk</li>
            </ul>
          </section>

          <section className="flex flex-col gap-3">
            <h2 className="text-lg font-bold border-b border-border pb-2">6. Data Ownership</h2>
            <p className="text-muted-foreground leading-relaxed">
              All data you enter into Repairo (job cards, customer records, invoices) remains your property. 
              We do not claim ownership of your operational data. We act as a data processor on your behalf. 
              You may export or request deletion of your data at any time.
            </p>
          </section>

          <section className="flex flex-col gap-3">
            <h2 className="text-lg font-bold border-b border-border pb-2">7. Public Directory Listing</h2>
            <p className="text-muted-foreground leading-relaxed">
              By registering a shop on Repairo, you consent to your workshop's name, location, services, 
              operating hours, and contact number being displayed publicly in our Workshop Finder. 
              You can update or request removal of this information at any time via the Settings page.
            </p>
          </section>

          <section className="flex flex-col gap-3">
            <h2 className="text-lg font-bold border-b border-border pb-2">8. Intellectual Property</h2>
            <p className="text-muted-foreground leading-relaxed">
              The Repairo platform, brand, logo, and all associated software are the intellectual property of Repairo. 
              You are granted a limited, non-exclusive, non-transferable license to use the platform for your workshop operations.
            </p>
          </section>

          <section className="flex flex-col gap-3">
            <h2 className="text-lg font-bold border-b border-border pb-2">9. Limitation of Liability</h2>
            <p className="text-muted-foreground leading-relaxed">
              Repairo is provided "as is." We are not liable for any indirect, incidental, or consequential damages 
              arising from use of the platform. Our total liability shall not exceed the subscription fees paid in the 
              3 months preceding any claim.
            </p>
          </section>

          <section className="flex flex-col gap-3">
            <h2 className="text-lg font-bold border-b border-border pb-2">10. Termination</h2>
            <p className="text-muted-foreground leading-relaxed">
              We reserve the right to suspend or terminate accounts that violate these terms without notice. 
              You may cancel your subscription at any time. Upon termination, your data will be retained for 30 days 
              before permanent deletion.
            </p>
          </section>

          <section className="flex flex-col gap-3">
            <h2 className="text-lg font-bold border-b border-border pb-2">11. Governing Law</h2>
            <p className="text-muted-foreground leading-relaxed">
              These Terms are governed by the laws of India. Any disputes shall be subject to the exclusive 
              jurisdiction of courts in Kerala, India.
            </p>
          </section>

          <section className="flex flex-col gap-3">
            <h2 className="text-lg font-bold border-b border-border pb-2">12. Contact</h2>
            <div className="flex flex-col gap-1 text-sm font-mono text-muted-foreground">
              <span>📧 <a href="mailto:alenjames899@gmail.com" className="text-primary hover:underline">alenjames899@gmail.com</a></span>
              <span>📞 <a href="tel:+918921837945" className="text-primary hover:underline">+91 8921837945</a></span>
            </div>
          </section>
        </div>

        <div className="mt-16 flex items-center gap-4 text-sm text-muted-foreground">
          <Link href="/privacy" className="hover:text-primary transition-colors">Privacy Policy</Link>
          <span>·</span>
          <Link href="/about" className="hover:text-primary transition-colors">About Us</Link>
          <span>·</span>
          <Link href="/" className="hover:text-primary transition-colors">Home</Link>
        </div>
      </div>
    </div>
  );
}
