import { NavbarWhite } from "@/layout/Navbar";
import Link from "next/link";
import { Metadata } from "next";

const SITE_URL = process.env.NEXT_PUBLIC_APP_URL || "https://repairo-garage.vercel.app";

export const metadata: Metadata = {
  title: "Privacy Policy | Repairo Garage Management Software",
  description:
    "Read Repairo's Privacy Policy to understand how we collect, store, and protect the data of garage owners and their customers. GDPR-aware, India-compliant.",
  keywords: ["Repairo privacy policy", "garage software data policy", "workshop app privacy India"],
  alternates: { canonical: `${SITE_URL}/privacy` },
  robots: { index: true, follow: true },
  openGraph: {
    title: "Repairo Privacy Policy",
    description: "How Repairo collects, uses, and protects your data. Transparent and India-compliant.",
    url: `${SITE_URL}/privacy`,
  },
};

const breadcrumbSchema = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: [
    { "@type": "ListItem", position: 1, name: "Home", item: SITE_URL },
    { "@type": "ListItem", position: 2, name: "Privacy Policy", item: `${SITE_URL}/privacy` },
  ],
};

export default function PrivacyPolicyPage() {
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
        <h1 className="text-4xl font-black text-foreground mb-2">Privacy Policy</h1>
        <p className="text-sm text-muted-foreground font-mono mb-12">Last updated: {updated}</p>

        <div className="prose prose-sm max-w-none flex flex-col gap-10 text-foreground">
          
          <section className="flex flex-col gap-3">
            <h2 className="text-lg font-bold border-b border-border pb-2">1. Introduction</h2>
            <p className="text-muted-foreground leading-relaxed">
              Repairo ("we", "our", or "us") is a vehicle repair management platform operated for garages and their customers. 
              This Privacy Policy explains what information we collect, how we use it, and your rights regarding your data 
              when you use our platform at <span className="text-primary font-mono">repairo-garage.vercel.app</span> or via our associated workshops directory.
            </p>
          </section>

          <section className="flex flex-col gap-3">
            <h2 className="text-lg font-bold border-b border-border pb-2">2. Information We Collect</h2>
            <div className="flex flex-col gap-2 text-muted-foreground leading-relaxed">
              <p><strong className="text-foreground">Account Information:</strong> When a garage signs up, we collect the owner's name, email address, phone number, and workshop details (name, address, state, city, country).</p>
              <p><strong className="text-foreground">Operational Data:</strong> Job cards, repair records, vehicle registration numbers, customer contact information, and invoice data entered by the garage staff.</p>
              <p><strong className="text-foreground">Usage Data:</strong> Browser type, IP address, pages visited, and timestamps — collected automatically via server logs to improve the platform.</p>
              <p><strong className="text-foreground">Media:</strong> Shop images and documents uploaded to our platform are stored securely on Cloudflare R2.</p>
              <p><strong className="text-foreground">Public Search:</strong> When a customer uses the Workshop Finder, no personal data is required or stored. Searches are anonymous.</p>
            </div>
          </section>

          <section className="flex flex-col gap-3">
            <h2 className="text-lg font-bold border-b border-border pb-2">3. How We Use Your Data</h2>
            <ul className="list-disc pl-5 flex flex-col gap-2 text-muted-foreground leading-relaxed">
              <li>To operate the workshop management dashboard and its features (job cards, invoicing, inventory)</li>
              <li>To display your garage on the public Workshop Finder directory</li>
              <li>To send transactional emails (account verification, subscription receipts)</li>
              <li>To improve and debug the platform using anonymized usage statistics</li>
              <li>To process subscription payments and maintain billing records</li>
            </ul>
          </section>

          <section className="flex flex-col gap-3">
            <h2 className="text-lg font-bold border-b border-border pb-2">4. Data Sharing</h2>
            <p className="text-muted-foreground leading-relaxed">
              We do <strong className="text-foreground">not</strong> sell your personal data to third parties. 
              We may share data with:
            </p>
            <ul className="list-disc pl-5 flex flex-col gap-2 text-muted-foreground leading-relaxed">
              <li><strong className="text-foreground">Cloudflare R2</strong> — for secure file and image storage</li>
              <li><strong className="text-foreground">Neon (PostgreSQL)</strong> — our managed database provider</li>
              <li><strong className="text-foreground">Law enforcement</strong> — only when required by applicable Indian law</li>
            </ul>
          </section>

          <section className="flex flex-col gap-3">
            <h2 className="text-lg font-bold border-b border-border pb-2">5. Data Security</h2>
            <p className="text-muted-foreground leading-relaxed">
              We use industry-standard HTTPS encryption for all data in transit. Passwords are stored using bcrypt hashing. 
              Access to the platform is role-gated (super-admin, shop admin, technician, receptionist) to limit exposure. 
              Despite our precautions, no system is 100% secure — please use a strong, unique password.
            </p>
          </section>

          <section className="flex flex-col gap-3">
            <h2 className="text-lg font-bold border-b border-border pb-2">6. Cookies</h2>
            <p className="text-muted-foreground leading-relaxed">
              Repairo uses minimal cookies — primarily for authentication (JWT tokens stored in localStorage) 
              and theme preferences. We do not use advertising or tracking cookies.
            </p>
          </section>

          <section className="flex flex-col gap-3">
            <h2 className="text-lg font-bold border-b border-border pb-2">7. Your Rights</h2>
            <ul className="list-disc pl-5 flex flex-col gap-2 text-muted-foreground leading-relaxed">
              <li>Request access to the personal data we hold about your garage</li>
              <li>Request correction of inaccurate information</li>
              <li>Request deletion of your account and associated data</li>
              <li>Object to processing of your data in certain circumstances</li>
            </ul>
            <p className="text-muted-foreground">To exercise any of these rights, email us at <a href="mailto:alenjames899@gmail.com" className="text-primary hover:underline">alenjames899@gmail.com</a>.</p>
          </section>

          <section className="flex flex-col gap-3">
            <h2 className="text-lg font-bold border-b border-border pb-2">8. Data Retention</h2>
            <p className="text-muted-foreground leading-relaxed">
              We retain your data for as long as your account is active. After account deletion, data is permanently removed 
              within 30 days (except where required by law for financial record-keeping).
            </p>
          </section>

          <section className="flex flex-col gap-3">
            <h2 className="text-lg font-bold border-b border-border pb-2">9. Changes to This Policy</h2>
            <p className="text-muted-foreground leading-relaxed">
              We may update this Privacy Policy periodically. We will notify registered shop owners via email of 
              any material changes. Continued use of the platform after changes constitutes acceptance.
            </p>
          </section>

          <section className="flex flex-col gap-3">
            <h2 className="text-lg font-bold border-b border-border pb-2">10. Contact Us</h2>
            <p className="text-muted-foreground">For any privacy-related queries:</p>
            <div className="flex flex-col gap-1 text-sm font-mono">
              <span>📧 <a href="mailto:alenjames899@gmail.com" className="text-primary hover:underline">alenjames899@gmail.com</a></span>
              <span>📞 <a href="tel:+918921837945" className="text-primary hover:underline">+91 8921837945</a></span>
            </div>
          </section>
        </div>

        <div className="mt-16 flex items-center gap-4 text-sm text-muted-foreground">
          <Link href="/terms" className="hover:text-primary transition-colors">Terms & Conditions</Link>
          <span>·</span>
          <Link href="/about" className="hover:text-primary transition-colors">About Us</Link>
          <span>·</span>
          <Link href="/" className="hover:text-primary transition-colors">Home</Link>
        </div>
      </div>
    </div>
  );
}
