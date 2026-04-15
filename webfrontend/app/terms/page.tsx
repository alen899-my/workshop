import { NavbarWhite } from "@/layout/Navbar";
import { Footer } from "@/layout/Footer";
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
            <h2 className="text-lg font-bold border-b border-border pb-2">Introduction</h2>
            <p className="text-muted-foreground leading-relaxed">
              These Terms & Conditions are administered on behalf of Repairo. References to "we", "us", and "our" are references to Repairo, operating within Kerala, India. Repairo maintains the website and platform (repairo-garage.vercel.app).
            </p>
            <p className="text-muted-foreground leading-relaxed">
              References to "you", "your" and "yours", and after acceptance, the "Shop Owner" or "User", are references to the individual or entity completing the registration form for our garage management software.
            </p>
            <p className="text-muted-foreground leading-relaxed">
              These terms and conditions (these "Terms") govern your use of any website, application, or software owned or operated by Repairo, its subsidiaries, and affiliates (collectively, the "Platform") where these Terms appear or are linked. These Terms are subject to change by Repairo, in its sole discretion, at any time, without prior written notice. Any changes to these Terms will be in effect as of the "Last Updated Date" referenced on the Platform. Therefore, you should review these Terms prior to using the Platform.
            </p>
            <p className="text-muted-foreground leading-relaxed">
              Additional terms and conditions may apply to some products or services offered by Repairo and to the use of the Platform and to specific portions or features on the Platform. You should also carefully review our Privacy Policy before using the Platform as it also governs your use of the Platform and our services.
            </p>
            <p className="text-muted-foreground leading-relaxed">
              Repairo is domiciled in India and stipulates that the governing law is local Indian law, specifically the jurisdiction of Kerala. Any purchase, dispute, or claim arising out of or in connection with this platform shall be governed and construed in accordance with the laws of India. Payments are accepted in INR via UPI, Bank Transfer, or standard payment gateways as applicable.
            </p>
          </section>

          <section className="flex flex-col gap-3">
            <h2 className="text-lg font-bold border-b border-border pb-2">1. USE OF THE PLATFORM</h2>
            <p className="text-muted-foreground leading-relaxed">
              When you use the Platform or our services, you agree to use the Platform and our services only for purposes that are permitted by these Terms and any applicable law, regulation, or generally accepted practices or guidelines in the relevant jurisdictions. In addition, you agree that you are solely responsible for any breach of your obligations under these Terms and for the consequences (including any loss or damage which Repairo may suffer) of any such breach. As a condition of your use of the Platform and our services, you warrant to Repairo that you will not use the Platform or our services for any purpose that is unlawful or prohibited by these Terms. Whether on behalf of yourself or on behalf of any third party, you agree not to:
            </p>
            <ul className="list-disc pl-5 flex flex-col gap-2 text-muted-foreground leading-relaxed">
              <li>Access or attempt to access the Platform other than through the interface that is provided by Repairo, unless you have specifically been permitted to do so in a separate written agreement.</li>
              <li>Access or attempt to access the Platform, or any portion thereof, through any automated means, including but not limited to the use of scripts or web crawlers.</li>
              <li>Engage in any activity that disrupts or otherwise interferes with the Platform (or the servers and networks which are connected to the Platform), or our services.</li>
              <li>"Scrape", duplicate, reproduce, copy, republish, license, sell, trade, or resell the Platform or its data for any purpose.</li>
              <li>Divert or attempt to divert Repairo customers to another website, application, or service.</li>
              <li>Send unsolicited or unauthorized emails on behalf of Repairo, including promotions and/or advertising.</li>
              <li>Modify, adapt, translate, reverse engineer, decompile, or disassemble any portion of the Platform.</li>
              <li>Use a false email address, impersonate any person or entity, or falsely state or otherwise misrepresent your affiliation with any person or entity in connection with the Platform or our services.</li>
            </ul>
            <p className="text-muted-foreground leading-relaxed">
              The user is responsible for maintaining the confidentiality of their account. Repairo reserves the right to refuse service, in its sole discretion, at any time, for any lawful reason, without notice. Repairo reserves the right to withdraw or amend the Platform, and any service or material we provide, in its sole discretion, at any time, for any reason, without notice. WE WILL NOT BE LIABLE IF FOR ANY REASON ALL OR ANY PART OF THE PLATFORM IS UNAVAILABLE AT ANY TIME OR FOR ANY PERIOD.
            </p>
          </section>

          <section className="flex flex-col gap-3">
            <h2 className="text-lg font-bold border-b border-border pb-2">2. RIGHT TO MONITOR CONTENT</h2>
            <p className="text-muted-foreground leading-relaxed">
              Repairo has the right, but not the obligation, in its sole discretion, at any time, for any reason, to monitor, analyze, edit, move, remove, or refuse to make available any content made available through the Platform. Repairo takes no responsibility and assumes no liability for any content you post, upload, or otherwise make available through your use of the Platform, such as job cards, images, or customer data. You are solely responsible for any content you post or upload.
            </p>
          </section>

          <section className="flex flex-col gap-3">
            <h2 className="text-lg font-bold border-b border-border pb-2">3. REGISTERING FOR AN ACCOUNT</h2>
            <p className="text-muted-foreground leading-relaxed">
              To register for a Repairo account, you must provide us with your personal and business information, including your name, email address, phone number, workshop details, and password. It is a condition of your use of the Platform that all the information you provide is accurate, current, and complete. Your credentials are for your authorization only. To ensure that your credentials remain confidential, DO NOT share this information with anyone. You are responsible for maintaining the confidentiality of your account information and for restricting access to your computer or mobile device.
            </p>
          </section>

          <section className="flex flex-col gap-3">
            <h2 className="text-lg font-bold border-b border-border pb-2">4. SUBSCRIPTION & PAYMENT</h2>
            <p className="text-muted-foreground leading-relaxed">
              In order to maintain your workshop's access on Repairo, you must provide valid payment and complete your subscription. You represent and warrant to Repairo that the payment method information you provide is accurate and complete, and you are authorized to use such method for the purchase.
            </p>
            <p className="text-muted-foreground leading-relaxed">
              Terms of payment are within our sole discretion and we must receive payment before our acceptance of a subscription activation. Payment methods may vary but typically include UPI or direct bank transfer. Subscriptions renew automatically or require manual renewal depending on your selected plan. We do not offer refunds for partial months unless there is a verified service outage that severely inhibits standard workshop operations.
            </p>
          </section>

          <section className="flex flex-col gap-3">
            <h2 className="text-lg font-bold border-b border-border pb-2">5. PUBLIC DIRECTORY LISTING</h2>
            <p className="text-muted-foreground leading-relaxed">
              By registering your workshop on Repairo, you consent to having your workshop publicly listed in our public discovery directory. Information such as your workshop's name, services offered, operating hours, and location will be displayed to end-users seeking repairs. You can manage or update this information via the Settings page.
            </p>
          </section>

          <section className="flex flex-col gap-3">
            <h2 className="text-lg font-bold border-b border-border pb-2">6. PLATFORM CAPABILITIES & TESTING</h2>
            <p className="text-muted-foreground leading-relaxed">
              Repairo provides cloud-based software tools as-is. We do not guarantee continuous, uninterrupted, or perfectly error-free operation of the services. All information about the features on the Platform is provided for information purposes only. Software updates, maintenance, and bug fixes may occur without prior notice, occasionally leading to brief downtime. 
            </p>
          </section>

          <section className="flex flex-col gap-3">
            <h2 className="text-lg font-bold border-b border-border pb-2">7. DATA OWNERSHIP</h2>
            <p className="text-muted-foreground leading-relaxed">
              All data you enter into Repairo (such as job cards, customer records, invoices, and vehicle history) remains your exclusive property. We do not claim ownership of your operational data. Repairo acts merely as a data processor on your behalf. You have the right to request export or deletion of your data at any time subject to applicable laws and our data retention policies.
            </p>
          </section>

          <section className="flex flex-col gap-3">
            <h2 className="text-lg font-bold border-b border-border pb-2">8. INTELLECTUAL PROPERTY</h2>
            <p className="text-muted-foreground leading-relaxed">
              All content included on the Platform, such as text, graphics, logos, images, videos, digital downloads, data, software, any other material, and the design selection and arrangement thereof is owned or licensed property of Repairo, its suppliers, licensors, or other providers of such material. Repairo expressly reserves all intellectual property rights in all content.
            </p>
            <p className="text-muted-foreground leading-relaxed">
              These Terms permit you to use the Platform for your internal business operations only. You must not use Repairo's logos, service names, designs, and slogans without the prior written permission of Repairo.
            </p>
          </section>

          <section className="flex flex-col gap-3">
            <h2 className="text-lg font-bold border-b border-border pb-2">9. PRICING AND AVAILABILITY</h2>
            <p className="text-muted-foreground leading-relaxed">
              All prices are displayed in Indian Rupees (INR) unless explicitly stated otherwise. All pricing is subject to change without notice, and Repairo reserves the right to make adjustments due to changing market conditions, feature additions, or other circumstances.
            </p>
            <p className="text-muted-foreground leading-relaxed">
              If we have made a pricing error and a plan's correct price is higher than the price on the Site, we may either contact you before applying the charge or cancel your subscription renewal. We strive for accuracy in all service descriptions and pricing.
            </p>
          </section>

          <section className="flex flex-col gap-3">
            <h2 className="text-lg font-bold border-b border-border pb-2">10. TERMINATION & ACCOUNT DEACTIVATION</h2>
            <p className="text-muted-foreground leading-relaxed">
              We reserve the right to suspend or terminate accounts that violate these terms without notice. You may cancel your subscription at any time. Upon termination, your operational data will be retained for 30 days before permanent deletion from our active databases, unless regulatory compliance requires otherwise.
            </p>
          </section>

          <section className="flex flex-col gap-3">
            <h2 className="text-lg font-bold border-b border-border pb-2">11. LIMITATION OF LIABILITY</h2>
            <p className="text-muted-foreground leading-relaxed">
              To the fullest extent permitted by law, Repairo is provided "as is" and "as available". We shall not be liable for any indirect, incidental, special, consequential, or punitive damages, or any loss of profits or revenues, whether incurred directly or indirectly, or any loss of data, use, goodwill, or other intangible losses, resulting from your access to or use of or inability to access or use the platform. Our total liability shall not exceed the subscription fees paid in the three (3) months preceding any claim.
            </p>
          </section>

          <section className="flex flex-col gap-3">
            <h2 className="text-lg font-bold border-b border-border pb-2">12. CHILDREN</h2>
            <p className="text-muted-foreground leading-relaxed">
              Customers registering a workshop or using the management features who are Minors (under the age of 18) shall not register as a User of the website and shall not transact on or use the website. If you are under the age of majority pursuant to applicable law, you may only use Repairo with the active involvement and consent of a parent or legal guardian.
            </p>
          </section>

          <section className="flex flex-col gap-3">
            <h2 className="text-lg font-bold border-b border-border pb-2">13. CONTACT US</h2>
            <p className="text-muted-foreground leading-relaxed">
              If you have any questions about these Terms, the practices of this platform, or your dealings with Repairo, please contact us at:
            </p>
            <div className="flex flex-col gap-1 text-sm font-mono text-muted-foreground mt-2">
              <span>📧 <a href="mailto:alenjames899@gmail.com" className="text-primary hover:underline">alenjames899@gmail.com</a></span>
              <span>📞 <a href="tel:+918921837945" className="text-primary hover:underline">+91 8921837945</a></span>
            </div>
          </section>
        </div>

      </div>
      <Footer />
    </div>
  );
}
