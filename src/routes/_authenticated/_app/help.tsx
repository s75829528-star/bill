import { createFileRoute } from "@tanstack/react-router";
import { HelpCircle, BookOpen, MessageCircle, Video, FileText, ChevronRight } from "lucide-react";

export const Route = createFileRoute("/_authenticated/_app/help")({
  component: HelpPage,
});

const faqs = [
  { q: "How do I create a GST invoice?",        a: "Go to Billing → Create Invoice. Fill in customer, items, and tax details." },
  { q: "How do I add products to inventory?",   a: "Go to Inventory → Add Product. You can also bulk import via CSV." },
  { q: "Can I generate GSTR-1 reports?",        a: "Yes, Reports → GST Returns will generate GSTR-1, GSTR-3B and more." },
  { q: "How does the AI Assistant work?",        a: "Ask any business question in plain language. Nexora AI reads your data and responds with insights." },
];

function HelpPage() {
  return (
    <div className="min-h-full px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-2xl">
        <div className="mb-6 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100">
            <HelpCircle className="h-8 w-8 text-slate-600" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">Help & Support</h1>
          <p className="mt-2 text-sm text-muted-foreground">Find answers, learn features, and get in touch</p>
        </div>

        {/* Support channels */}
        <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            { icon: BookOpen,        label: "Documentation", color: "text-blue-600",   bg: "bg-blue-50"   },
            { icon: Video,           label: "Video Guides",  color: "text-red-600",    bg: "bg-red-50"    },
            { icon: MessageCircle,   label: "Live Chat",     color: "text-green-600",  bg: "bg-green-50"  },
            { icon: FileText,        label: "Raise Ticket",  color: "text-purple-600", bg: "bg-purple-50" },
          ].map(({ icon: Icon, label, color, bg }) => (
            <button key={label} className={`flex flex-col items-center gap-2 rounded-2xl border border-slate-200 bg-white p-4 hover:shadow-md transition-all`}>
              <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${bg}`}>
                <Icon className={`h-5 w-5 ${color}`} />
              </div>
              <span className="text-xs font-semibold text-foreground">{label}</span>
            </button>
          ))}
        </div>

        {/* FAQs */}
        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-100 px-5 py-4">
            <h2 className="text-sm font-semibold text-foreground">Frequently Asked Questions</h2>
          </div>
          <div className="divide-y divide-slate-100">
            {faqs.map((faq, i) => (
              <div key={i} className="px-5 py-4">
                <p className="text-sm font-semibold text-foreground">{faq.q}</p>
                <p className="mt-1 text-sm text-muted-foreground">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>

        <p className="mt-6 text-center text-xs text-muted-foreground">Nexora Support · support@nexora.app</p>
      </div>
    </div>
  );
}
