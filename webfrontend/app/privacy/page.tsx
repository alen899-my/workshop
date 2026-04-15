import { NavbarWhite } from "@/layout/Navbar";
import { Footer } from "@/layout/Footer";
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
            <h2 className="text-lg font-bold border-b border-border pb-2">Introduction</h2>
            <p className="text-muted-foreground leading-relaxed">
              This Privacy Policy is administered on behalf of Repairo. References to "we", "us", "our", or "Repairo" are references to the vehicle repair management platform operating within Kerala, India. Repairo maintains the website and platform (repairo-garage.vercel.app).
            </p>
            <p className="text-muted-foreground leading-relaxed">
              This policy applies only to activities that Repairo engages in on its platform and does not apply to Repairo activities that are "offline" or unrelated to the platform. Repairo collects certain anonymous data regarding the usage of the platform. This information does not personally identify users, by itself or in combination with other information, and is gathered to improve the performance of our software. The anonymous data collected by the platform can include information such as the type of browser you are using, and the length of the visit to the website.
            </p>
            <p className="text-muted-foreground leading-relaxed">
              You may also be asked to provide personally identifiable information on the Repairo platform, which may include your name, telephone number, e-mail address, and your workshop's details. This information can be gathered when feedback or e-mails are sent to Repairo, when you register for a garage management subscription, or when customers use the public workshop finder. In all such cases, you have the option of providing us with personally identifiable information.
            </p>
          </section>

          <section className="flex flex-col gap-3">
            <h2 className="text-lg font-bold border-b border-border pb-2">Use and Disclosure of Information</h2>
            <p className="text-muted-foreground leading-relaxed">
              Except as otherwise stated below, we do not sell, trade, or rent your personally identifiable information collected on the site to others. The information collected by our site is used to process Repairo subscriptions, to keep you informed about your account status, to maintain your operational data (such as job cards, customer records, and vehicle service histories), to list your workshop on our public finder, and for statistical purposes for improving our platform.
            </p>
            <p className="text-muted-foreground leading-relaxed">
              We will only disclose your membership details to third parties for tracking purposes or process your subscription, as appropriate, to improve the functionality of our site, perform statistical and data analyses, and securely deliver transactional or promotional emails. Your operational database backups are securely routed through our hosting providers purely for standard data management.
            </p>
          </section>

          <section className="flex flex-col gap-3">
            <h2 className="text-lg font-bold border-b border-border pb-2">Payment Information</h2>
            <p className="text-muted-foreground leading-relaxed">
              All UPI, bank transfer details, and other similar personally identifiable financial information will NOT be stored, sold, shared, rented, or leased to any third parties by Repairo. Transactions are processed directly through secure channels or direct-to-bank manual verification.
            </p>
          </section>

          <section className="flex flex-col gap-3">
            <h2 className="text-lg font-bold border-b border-border pb-2">Cookies and Aggregated Data</h2>
            <p className="text-muted-foreground leading-relaxed">
              Cookies are small bits of data cached in a user’s browser. Repairo utilizes cookies to determine whether or not you have visited the platform in the past and for securely authenticating your active staff sessions (using JSON Web Tokens). However, no cross-site advertising tracking information is gathered.
            </p>
            <p className="text-muted-foreground leading-relaxed">
              Repairo may use non-personal "aggregated data" to enhance the operation of our platform. Additionally, if you provide Repairo with content for publishing or feedback, we may publish your workshop's name or other identifying data with your permission.
            </p>
            <p className="text-muted-foreground leading-relaxed">
              Repairo may also disclose personally identifiable information in order to respond to a subpoena, court order, or other such requests. Repairo may also provide such personally identifiable information in response to a law enforcement agency request or as otherwise required by Indian law.
            </p>
            <p className="text-muted-foreground leading-relaxed">
              Your personally identifiable information and garage data may be provided to a party if Repairo files for bankruptcy, or there is a transfer of the assets or ownership of Repairo in connection with proposed or consummated corporate reorganizations, such as mergers or acquisitions.
            </p>
          </section>

          <section className="flex flex-col gap-3">
            <h2 className="text-lg font-bold border-b border-border pb-2">Security</h2>
            <p className="text-muted-foreground leading-relaxed">
              Repairo takes appropriate steps to ensure data privacy and security including through various hardware and software methodologies, such as HTTPS encryption and bcrypt password hashing. However, while we build specifically for robust role-based permissions to protect your shop's internal data from unauthorized staff, no platform can guarantee the absolute security of any information that is disclosed online.
            </p>
          </section>

          <section className="flex flex-col gap-3">
            <h2 className="text-lg font-bold border-b border-border pb-2">Other Websites</h2>
            <p className="text-muted-foreground leading-relaxed">
              Repairo is not responsible for the privacy policies of websites to which it links. If you provide any information to such third parties different rules regarding the collection and use of your personal information may apply. We strongly suggest you review such third party’s privacy policies before providing any data to them. We are not responsible for the policies or practices of third parties.
            </p>
            <p className="text-muted-foreground leading-relaxed">
              Please be aware that our sites may contain links to other sites on the Internet that are owned and operated by third parties. The information practices of those Web sites linked to our site are not covered by this Policy. These other sites may send their own cookies to users, collect data, or solicit personally identifiable information. You should contact these entities directly if you have any questions about their use of the information that they collect.
            </p>
          </section>

          <section className="flex flex-col gap-3">
            <h2 className="text-lg font-bold border-b border-border pb-2">Minors</h2>
            <p className="text-muted-foreground leading-relaxed">
              Repairo does not knowingly collect personal information from minors under the age of 18. Minors are not permitted to use the Repairo workshop management software, and Repairo requests that minors under the age of 18 not submit any personal information to the website. Since information regarding minors under the age of 18 is not actively collected, Repairo does not knowingly distribute personal information regarding minors under the age of 18.
            </p>
          </section>

          <section className="flex flex-col gap-3">
            <h2 className="text-lg font-bold border-b border-border pb-2">Corrections and Updates</h2>
            <p className="text-muted-foreground leading-relaxed">
              If you wish to modify or update any information Repairo has received, please log into your interactive dashboard and navigate to the Settings panel, or contact our support team at <a href="mailto:alenjames899@gmail.com" className="text-primary hover:underline">alenjames899@gmail.com</a> for assistance.
            </p>
          </section>

          <section className="flex flex-col gap-3">
            <h2 className="text-lg font-bold border-b border-border pb-2">Modifications of the Privacy Policy</h2>
            <p className="text-muted-foreground leading-relaxed">
              The Website Policies and Terms & Conditions would be changed or updated occasionally to meet the requirements and standards. Therefore, the Customers and Shop Owners are encouraged to frequently visit these sections in order to be updated about the changes on the website. Modifications will be effective on the day they are posted.
            </p>
          </section>
        </div>

      </div>
      <Footer />
    </div>
  );
}
