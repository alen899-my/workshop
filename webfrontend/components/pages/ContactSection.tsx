"use client";

import React, { useState } from "react";
import Image from "next/image";
import { Send, Loader2, AlertCircle } from "lucide-react";
import { WorkshopButton } from "@/components/ui/WorkshopButton";
import PhoneInput from 'react-phone-input-2';
import 'react-phone-input-2/lib/style.css';
import { z } from "zod";

const contactSchema = z.object({
  name: z.string().min(1, "Name is required"),
  phone: z.string().min(8, "A valid phone number is required"),
  email: z.string().email("Invalid email format").optional().or(z.literal("")),
  subject: z.string().optional(),
  message: z.string().min(1, "Please enter your message"),
});

type FormErrors = {
  [K in keyof z.infer<typeof contactSchema>]?: string;
};

export function ContactSection() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<FormErrors>({});
  const [phone, setPhone] = useState("");

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError("");
    setFieldErrors({});
    
    const formData = new FormData(e.currentTarget);
    const rawData = {
        name: formData.get("name") as string,
        email: formData.get("email") as string,
        phone: phone, // phone state from PhoneInput
        subject: formData.get("subject") as string,
        message: formData.get("message") as string,
    };

    // Zod Validation
    const result = contactSchema.safeParse(rawData);
    
    if (!result.success) {
      const formattedErrors: FormErrors = {};
      result.error.issues.forEach((issue) => {
        formattedErrors[issue.path[0] as keyof FormErrors] = issue.message;
      });
      setFieldErrors(formattedErrors);
      setIsSubmitting(false);
      return;
    }

    try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'}/contact`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                ...result.data,
                phone: `+${phone}`
            }),
        });

        const resData = await response.json();

        if (resData.success) {
            setSubmitted(true);
        } else {
            setError(resData.error || "Unable to send message.");
        }
    } catch (err) {
        setError("Network error. Please try again later.");
    } finally {
        setIsSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <section id="contact" className="bg-background py-16 relative transition-colors duration-500">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <div className="w-20 h-20 rounded-full bg-primary/10 text-primary mx-auto mb-6 flex items-center justify-center">
            <Send size={32} />
          </div>
          <h2 className="text-2xl font-sans font-bold mb-4">Message Sent!</h2>
          <p className="text-muted-foreground mb-8">We've received your inquiry and will get back to you shortly </p>
          <WorkshopButton variant="primary" onClick={() => setSubmitted(false)}>
            Back to Form
          </WorkshopButton>
        </div>
      </section>
    );
  }

  return (
    <section id="contact" className="bg-background py-12 lg:py-20 relative overflow-hidden transition-colors duration-500">
      <div className="max-w-5xl mx-auto px-4">
        
        {/* Compact Unified Card */}
        <div className="overflow-hidden rounded-[24px] border border-border bg-card/40 backdrop-blur-xl shadow-xl">
          <div className="grid grid-cols-1 lg:grid-cols-12 items-stretch">
            
            {/* Left: Square Image (Full Fill) */}
            <div className="lg:col-span-5 relative aspect-square lg:aspect-auto">
              <Image 
                src="/images/landing%20page/contact.jpg" 
                alt="Contact Workshop" 
                fill
                priority
                className="object-cover dark:hidden"
              />
              <Image 
                src="/images/landing%20page/contact-dark.png" 
                alt="Contact Workshop Dark" 
                fill
                priority
                className="object-cover hidden dark:block"
              />
            </div>

            {/* Right: Clean Standard Form */}
            <div className="lg:col-span-7 p-8 md:p-12 flex flex-col justify-center bg-card/20 select-none">
               <h3 className="text-2xl font-sans font-bold text-foreground mb-1">Get in Touch</h3>
               <p className="text-muted-foreground text-sm mb-8 font-medium">Have questions? We are ready to help.</p>

               {error && (
                 <div className="mb-6 p-4 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-xs flex items-center gap-2 animate-shake">
                    <AlertCircle size={16} /> {error}
                 </div>
               )}

               <form onSubmit={handleSubmit} className="space-y-5">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div className="space-y-1.5 text-left">
                       <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">Full Name *</label>
                       <input 
                         name="name"
                         type="text" 
                         placeholder="Alen James" 
                         className={`w-full px-5 py-3.5 rounded-xl bg-background/50 border ${fieldErrors.name ? 'border-destructive' : 'border-border'} focus:border-primary/50 outline-none transition-all text-sm font-sans placeholder:text-muted-foreground/40`}
                       />
                       {fieldErrors.name && <p className="text-[10px] text-destructive font-bold ml-1">{fieldErrors.name}</p>}
                    </div>
                    <div className="space-y-1.5 text-left">
                       <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">Email Address (Optional)</label>
                       <input 
                         name="email"
                         type="email" 
                         placeholder="alen@example.com" 
                         className={`w-full px-5 py-3.5 rounded-xl bg-background/50 border ${fieldErrors.email ? 'border-destructive' : 'border-border'} focus:border-primary/50 outline-none transition-all text-sm font-sans placeholder:text-muted-foreground/40`}
                       />
                       {fieldErrors.email && <p className="text-[10px] text-destructive font-bold ml-1">{fieldErrors.email}</p>}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div className="space-y-1.5 text-left">
                        <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">Phone Number *</label>
                        <PhoneInput
                            country={'in'}
                            value={phone}
                            onChange={(val) => setPhone(val)}
                            containerClass="!w-full"
                            inputClass={`!w-full !h-[48px] !bg-background/50 !border ${fieldErrors.phone ? '!border-destructive' : '!border-border'} !text-foreground !text-sm !rounded-xl !px-4 !py-3.5 !pl-12 focus:!border-primary/50 transition-all duration-200`}
                            buttonClass={`!bg-transparent !border ${fieldErrors.phone ? '!border-destructive' : '!border-border'} !border-r-0 !rounded-l-xl hover:!bg-muted/50`}
                            dropdownClass="!bg-card !border !border-border !text-foreground !shadow-xl !rounded-xl"
                            searchClass="!bg-muted !border !border-border !text-foreground"
                        />
                        {fieldErrors.phone && <p className="text-[10px] text-destructive font-bold ml-1">{fieldErrors.phone}</p>}
                    </div>
                    <div className="space-y-1.5 text-left">
                        <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">Subject</label>
                        <input 
                        name="subject"
                        type="text" 
                        placeholder="Pricing, Demo, etc." 
                        className="w-full px-5 py-3.5 rounded-xl bg-background/50 border border-border focus:border-primary/50 outline-none transition-all text-sm font-sans placeholder:text-muted-foreground/40"
                        />
                    </div>
                  </div>

                  <div className="space-y-1.5 text-left">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">Message *</label>
                    <textarea 
                      name="message"
                      rows={3}
                      placeholder="How can we help you accelerate your workshop's growth?" 
                      className={`w-full px-5 py-4 rounded-xl bg-background/50 border ${fieldErrors.message ? 'border-destructive' : 'border-border'} focus:border-primary/50 outline-none transition-all text-sm font-sans resize-none leading-relaxed placeholder:text-muted-foreground/40`}
                    />
                    {fieldErrors.message && <p className="text-[10px] text-destructive font-bold ml-1">{fieldErrors.message}</p>}
                  </div>

                  <div className="pt-2">
                    <WorkshopButton
                      variant="primary"
                      size="lg"
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full !rounded-xl !py-4 flex items-center justify-center gap-3 font-sans font-bold text-base shadow-lg shadow-primary/20 hover:shadow-primary/30 active:scale-95 transition-all"
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="animate-spin" size={18} /> Submiting...
                        </>
                      ) : (
                        <>
                          Send Message <Send size={18} />
                        </>
                      )}
                    </WorkshopButton>
                  </div>
               </form>
            </div>

          </div>
        </div>

      </div>
    </section>
  );
}
