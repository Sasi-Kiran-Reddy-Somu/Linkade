import AppLayout from "@/components/AppLayout";
import { HelpCircle, Search, ChevronDown, ChevronUp, Mail, MessageCircle, BookOpen, Zap, CreditCard, ArrowLeftRight, AlertTriangle } from "lucide-react";
import { useState } from "react";

interface FAQItem {
  question: string;
  answer: string;
}

interface FAQSection {
  title: string;
  icon: React.ReactNode;
  items: FAQItem[];
}

const faqSections: FAQSection[] = [
  {
    title: "Getting Started",
    icon: <Zap className="h-4 w-4" />,
    items: [
      {
        question: "How do I add my first project?",
        answer: "Click '+ Add Project' on the My Projects page, enter your website URL and project name, then follow the verification steps to confirm ownership of your domain.",
      },
      {
        question: "How do I verify ownership of my website?",
        answer: "After adding your project, you'll be prompted to verify ownership by either adding a meta tag to your website's HTML or adding a DNS TXT record to your domain settings.",
      },
      {
        question: "Can I add multiple websites?",
        answer: "Yes, you can add as many websites as you like. Each project is managed independently with its own backlink exchange settings and metrics.",
      },
    ],
  },
  {
    title: "Credits & Billing",
    icon: <CreditCard className="h-4 w-4" />,
    items: [
      {
        question: "How do credits work?",
        answer: "Credits are the currency of Linkade. You spend credits to request backlinks from other users and earn credits by accepting and publishing backlinks on your own site.",
      },
      {
        question: "How do I earn credits for free?",
        answer: "Enable your website for the backlink exchange and accept incoming backlink requests from other users. Each accepted and published backlink earns you credits.",
      },
      {
        question: "Can I purchase credits?",
        answer: "Yes, you can buy credits directly via the Credits button in the top navigation bar. Click 'Add Credits' to choose a credit package.",
      },
      {
        question: "Do credits expire?",
        answer: "No, purchased and earned credits do not expire. They remain in your account until you use them.",
      },
    ],
  },
  {
    title: "Backlink Exchange",
    icon: <ArrowLeftRight className="h-4 w-4" />,
    items: [
      {
        question: "How does the backlink exchange work?",
        answer: "Browse websites in the Exchange section and send backlink requests to sites you'd like a link from. The site owner reviews your request and accepts or declines. If accepted, they publish the link and you spend credits.",
      },
      {
        question: "What happens when I receive an incoming request?",
        answer: "You'll see incoming requests under Exchange → Incoming Requests. Review the request, and if you accept, publish the backlink on your site within the agreed timeframe.",
      },
      {
        question: "How long does it take to get a backlink approved?",
        answer: "It depends on the website owner. Most requests are reviewed within 24–72 hours. You can track the status of your requests under Exchange → Outgoing Requests.",
      },
      {
        question: "Can I decline a backlink request?",
        answer: "Yes, you can decline any incoming request without penalty. There is no obligation to accept requests you don't find relevant or suitable for your site.",
      },
    ],
  },
];

function FAQAccordion({ items }: { items: FAQItem[] }) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  return (
    <div className="space-y-2">
      {items.map((item, i) => (
        <div key={i} className="rounded-lg border border-border overflow-hidden">
          <button
            onClick={() => setOpenIndex(openIndex === i ? null : i)}
            className="w-full flex items-center justify-between px-4 py-3 text-left text-sm font-medium text-foreground hover:bg-muted/50 transition-colors"
          >
            {item.question}
            {openIndex === i ? <ChevronUp className="h-4 w-4 shrink-0 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />}
          </button>
          {openIndex === i && (
            <div className="px-4 py-3 text-sm text-muted-foreground border-t border-border bg-muted/20">
              {item.answer}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

const COMPLAINT_TYPES = ["User Misconduct", "Payment / Credits Issue", "Backlink Not Published", "Spam or Fake Request", "Service Quality", "Other"];

function ComplaintForm() {
  const [type, setType] = useState("");
  const [description, setDescription] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  function handleSubmit() {
    if (!type) { setError("Please select a complaint type."); return; }
    if (!description.trim()) { setError("Please describe the issue."); return; }
    setError("");
    setSubmitted(true);
  }

  if (submitted) {
    return (
      <div className="rounded-lg bg-green-50 border border-green-200 px-4 py-4 flex items-start gap-3">
        <div className="h-6 w-6 rounded-full bg-green-100 flex items-center justify-center shrink-0 mt-0.5">
          <ChevronUp className="h-3.5 w-3.5 text-green-600 rotate-180" />
        </div>
        <div>
          <p className="text-sm font-semibold text-green-800">Complaint submitted</p>
          <p className="text-xs text-green-700 mt-0.5">Our team will review your report and respond within 2 business days.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div>
        <label className="block text-xs font-semibold text-gray-600 mb-1.5">Complaint Type <span className="text-red-500">*</span></label>
        <div className="flex flex-wrap gap-2">
          {COMPLAINT_TYPES.map((t) => (
            <button
              key={t}
              onClick={() => { setType(t); setError(""); }}
              className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${type === t ? "bg-red-500 text-white border-red-500" : "border-border text-muted-foreground hover:bg-muted"}`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>
      <div>
        <label className="block text-xs font-semibold text-gray-600 mb-1.5">Description <span className="text-red-500">*</span></label>
        <textarea
          value={description}
          onChange={(e) => { setDescription(e.target.value); setError(""); }}
          placeholder="Describe the issue in detail — include relevant domain names, dates, or transaction IDs if applicable..."
          className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-300 resize-none min-h-[90px]"
        />
      </div>
      {error && <p className="text-xs text-red-500">{error}</p>}
      <div className="flex justify-end">
        <button
          onClick={handleSubmit}
          className="rounded-lg bg-red-500 px-5 py-2 text-sm font-semibold text-white hover:bg-red-600 transition-colors"
        >
          Submit Complaint
        </button>
      </div>
    </div>
  );
}

export default function HelpCenter() {
  const [search, setSearch] = useState("");

  const filtered = faqSections.map((section) => ({
    ...section,
    items: section.items.filter(
      (item) =>
        search === "" ||
        item.question.toLowerCase().includes(search.toLowerCase()) ||
        item.answer.toLowerCase().includes(search.toLowerCase())
    ),
  })).filter((s) => s.items.length > 0);

  return (
    <AppLayout title="Help Center" icon={<HelpCircle className="h-5 w-5" />}>
      <div className="max-w-3xl mx-auto space-y-8">

        {/* Hero search */}
        <div className="rounded-xl border border-border bg-card p-8 text-center space-y-4">
          <h2 className="text-2xl font-bold text-foreground">How can we help you?</h2>
          <p className="text-sm text-muted-foreground">Search our knowledge base or browse topics below</p>
          <div className="relative max-w-md mx-auto">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search for answers..."
              className="w-full rounded-lg border border-border bg-background pl-9 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>
        </div>

        {/* Quick links */}
        {search === "" && (
          <div className="grid grid-cols-3 gap-4">
            <div className="rounded-xl border border-border bg-card p-5 flex flex-col items-center text-center gap-2 hover:bg-muted/30 transition-colors cursor-pointer">
              <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center">
                <BookOpen className="h-4 w-4 text-primary" />
              </div>
              <p className="text-sm font-semibold text-foreground">Documentation</p>
              <p className="text-xs text-muted-foreground">Read guides and tutorials</p>
            </div>
            <div className="rounded-xl border border-border bg-card p-5 flex flex-col items-center text-center gap-2 hover:bg-muted/30 transition-colors cursor-pointer">
              <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center">
                <MessageCircle className="h-4 w-4 text-primary" />
              </div>
              <p className="text-sm font-semibold text-foreground">Live Chat</p>
              <p className="text-xs text-muted-foreground">Chat with our support team</p>
            </div>
            <div className="rounded-xl border border-border bg-card p-5 flex flex-col items-center text-center gap-2 hover:bg-muted/30 transition-colors cursor-pointer">
              <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center">
                <Mail className="h-4 w-4 text-primary" />
              </div>
              <p className="text-sm font-semibold text-foreground">Email Support</p>
              <p className="text-xs text-muted-foreground">Get help via email</p>
            </div>
          </div>
        )}

        {/* FAQ sections */}
        {filtered.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground text-sm">
            No results found for "<span className="font-medium text-foreground">{search}</span>"
          </div>
        ) : (
          filtered.map((section) => (
            <div key={section.title} className="space-y-3">
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground">{section.icon}</span>
                <h3 className="text-base font-semibold text-foreground">{section.title}</h3>
              </div>
              <FAQAccordion items={section.items} />
            </div>
          ))
        )}

        {/* Raise a Complaint */}
        {search === "" && (
          <div className="rounded-xl border border-red-200 bg-red-50/50 p-6 space-y-4">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-full bg-red-100 flex items-center justify-center shrink-0">
                <AlertTriangle className="h-4 w-4 text-red-500" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-foreground">Raise a Complaint</h3>
                <p className="text-xs text-muted-foreground mt-0.5">Report a problem with a user, transaction, or service quality</p>
              </div>
            </div>
            <ComplaintForm />
          </div>
        )}

        {/* Contact footer */}
        <div className="rounded-xl border border-border bg-card p-6 flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-foreground">Still need help?</p>
            <p className="text-xs text-muted-foreground mt-0.5">Our support team is available Mon–Fri, 9am–6pm</p>
          </div>
          <button className="rounded-lg bg-black px-4 py-2 text-sm font-semibold text-white hover:bg-black/80 transition-colors">
            Contact Support
          </button>
        </div>

      </div>
    </AppLayout>
  );
}
