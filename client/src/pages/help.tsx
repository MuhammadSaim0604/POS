import { Layout } from "@/components/layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { HelpCircle, Book, Shield, MessageSquare, Package, Receipt, TrendingUp } from "lucide-react";

export default function Help() {
  const faqs = [
    {
      category: "Inventory",
      icon: Package,
      questions: [
        {
          q: "How do I add medicine variations?",
          a: "When creating a medicine, toggle the 'Is Variation' switch. You can then specify color and size details. For packet-based inventory, ensure 'Unit Type' is set to 'Packet' and specify 'Items Per Packet'."
        },
        {
          q: "What is the low stock threshold?",
          a: "This is a custom alert level you set for each medicine. When stock falls below this number, the medicine will appear in the 'Low Stock Alerts' section on your dashboard."
        }
      ]
    },
    {
      category: "Billing",
      icon: Receipt,
      questions: [
        {
          q: "Can I manage multiple bills at once?",
          a: "Yes! The 'Create Bill' page uses a tab-based system. You can open multiple tabs for different customers and switch between them without losing progress."
        },
        {
          q: "How do I print an invoice?",
          a: "Once a bill is marked as 'Completed', a print button will appear. You can also configure automatic printing in the Settings page."
        }
      ]
    },
    {
      category: "Analytics",
      icon: TrendingUp,
      questions: [
        {
          q: "Where can I see my top selling products?",
          a: "The Dashboard provides a real-time 'Top Selling Products' list based on completed bills, showing the quantity of packets sold."
        },
        {
          q: "What does the weekly chart show?",
          a: "The chart aggregates total revenue for each day of the current week (Monday to Sunday) to help you track sales trends."
        }
      ]
    }
  ];

  return (
    <Layout>
      <div className="space-y-8 max-w-4xl mx-auto">
        <div>
          <h2 className="text-3xl font-display font-bold text-foreground">Advanced Help & FAQs</h2>
          <p className="text-muted-foreground">Everything you need to know about using Nexus POS effectively.</p>
        </div>

        <div className="grid gap-8">
          {faqs.map((group, idx) => (
            <section key={idx} className="space-y-4">
              <div className="flex items-center gap-2 text-xl font-semibold text-primary">
                <group.icon className="w-6 h-6" />
                <h3>{group.category}</h3>
              </div>
              <Card className="border-0 shadow-md">
                <CardContent className="p-0">
                  <Accordion type="single" collapsible className="w-full">
                    {group.questions.map((faq, qIdx) => (
                      <AccordionItem key={qIdx} value={`item-${idx}-${qIdx}`} className="border-b last:border-0 px-6">
                        <AccordionTrigger className="hover:no-underline py-4 text-left font-medium">
                          {faq.q}
                        </AccordionTrigger>
                        <AccordionContent className="text-muted-foreground pb-4">
                          {faq.a}
                        </AccordionContent>
                      </AccordionItem>
                    ))}
                  </Accordion>
                </CardContent>
              </Card>
            </section>
          ))}

          <Card className="bg-primary/5 border-primary/20">
            <CardHeader>
              <div className="flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-primary" />
                <CardTitle>Still need help?</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                If you have specific technical questions or found a bug, please contact our support team.
              </p>
              <Button variant="outline" className="w-full sm:w-auto">Contact Support</Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
}
