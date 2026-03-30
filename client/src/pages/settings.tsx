import { Layout } from "@/components/layout";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { Store, Receipt, Bell, Shield, Palette, Loader2, Keyboard } from "lucide-react";
import { useSettings } from "@/hooks/use-settings";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertSettingsSchema, type InsertSettings } from "@shared/schema";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

const shortcutFields: { name: keyof InsertSettings; label: string; description: string }[] = [
  { name: "shortcutSearchMedicines", label: "Search & Add Medicines", description: "Open the medicine search modal" },
  { name: "shortcutScanner", label: "Toggle Barcode Scanner", description: "Start or stop the barcode scanner" },
  { name: "shortcutCustomItem", label: "Add Custom Item", description: "Open the custom item modal (works when not in a text field)" },
  { name: "shortcutNewBill", label: "New Bill Tab", description: "Create a new bill tab" },
  { name: "shortcutCreateBill", label: "Create & Print Bill", description: "Finalize and generate the current bill" },
  { name: "shortcutDiscount", label: "Focus Discount Input", description: "Jump to the discount-on-bill input" },
  { name: "shortcutResetBill", label: "Reset Bill", description: "Clear all items from the current bill" },
  { name: "shortcutDraftBill", label: "Save as Draft", description: "Save the current bill as a draft" },
  { name: "shortcutGoToCreateBill", label: "Go to Create Bill (Global)", description: "Navigate to the Create Bill page from any page" },
];

export default function Settings() {
  const { toast } = useToast();

  const { settings, isLoading, updateSettings, isUpdating } = useSettings();
  const form = useForm<InsertSettings>({
    resolver: zodResolver(insertSettingsSchema),
    defaultValues: {
      storeName: "FB Collection",
      storePhone: "0301-7766395",
      storeAddress: "FB Collection, near Kabeer Brothers, Karor Pakka",
      printAutomatically: true,
      invoiceFooter: "Thank you for shopping with us!",
      shortcutSearchMedicines: "Ctrl+Z",
      shortcutScanner: "Ctrl+S",
      shortcutCustomItem: "Ctrl+C",
      shortcutNewBill: "Ctrl+Space",
      shortcutCreateBill: "Ctrl+Enter",
      shortcutDiscount: "Ctrl+D",
      shortcutResetBill: "Ctrl+R",
      shortcutDraftBill: "Ctrl+Shift+S",
      shortcutGoToCreateBill: "Ctrl+B",
    },
  });
  useEffect(() => {
    if (settings) {
      form.reset(settings);
    }
  }, [settings, form]);
  const onSubmit = (data: InsertSettings) => {
    updateSettings(data, {
      onSuccess: () => {
        toast({
          title: "Settings saved",
          description: "Your configuration has been updated successfully.",
        });
      },
      onError: () => {
        toast({
          title: "Error",
          description: "Failed to update settings.",
          variant: "destructive",
        });
      },
    });
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-full">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-8">
        <div>
          <h2 className="text-3xl font-display font-bold text-foreground">
            Settings
          </h2>
          <p className="text-muted-foreground">
            Manage your store profile, application preferences, and keyboard shortcuts.
          </p>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-6">
            <Card className="border-0 shadow-md">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Store className="w-5 h-5 text-primary" />
                  <CardTitle>Store Profile</CardTitle>
                </div>
                <CardDescription>
                  Update your business information for invoices.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="storeName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Store Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Nexus POS Store" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="storePhone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Phone Number</FormLabel>
                        <FormControl>
                          <Input placeholder="+1 234 567 890" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="storeAddress"
                    render={({ field }) => (
                      <FormItem className="md:col-span-2">
                        <FormLabel>Address</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="123 Business St, City"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-md">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Receipt className="w-5 h-5 text-accent" />
                  <CardTitle>Invoice Configuration</CardTitle>
                </div>
                <CardDescription>
                  Configure how your bills are generated and printed.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="printAutomatically"
                  render={({ field }) => (
                    <FormItem className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <FormLabel>Print Automatically</FormLabel>
                        <p className="text-sm text-muted-foreground">
                          Automatically trigger print dialog after completing a
                          bill.
                        </p>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />

                <Separator />
                <FormField
                  control={form.control}
                  name="invoiceFooter"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Invoice Footer Text</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Thank you for your business!"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            <Card className="border-0 shadow-md">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Keyboard className="w-5 h-5 text-violet-500" />
                  <CardTitle>Keyboard Shortcuts</CardTitle>
                </div>
                <CardDescription>
                  Customize keyboard shortcuts for quick actions. Use formats like{" "}
                  <code className="bg-muted px-1 py-0.5 rounded text-xs">Ctrl+Z</code>,{" "}
                  <code className="bg-muted px-1 py-0.5 rounded text-xs">Ctrl+Shift+S</code>, or{" "}
                  <code className="bg-muted px-1 py-0.5 rounded text-xs">Ctrl+Space</code>.
                  Changes take effect after saving.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-2">
                  {shortcutFields.map(({ name, label, description }) => (
                    <FormField
                      key={name}
                      control={form.control}
                      name={name}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm font-semibold">{label}</FormLabel>
                          <p className="text-xs text-muted-foreground -mt-1 mb-1">{description}</p>
                          <FormControl>
                            <Input
                              readOnly
                              placeholder="Click here & press shortcut keys..."
                              className="font-mono text-sm cursor-pointer select-none bg-muted/30 focus:bg-background focus:ring-2 focus:ring-primary"
                              value={field.value as string}
                              onKeyDown={(e) => {
                                const parts: string[] = [];
                                if (e.ctrlKey) parts.push("Ctrl");
                                if (e.altKey) parts.push("Alt");
                                if (e.shiftKey) parts.push("Shift");
                                const key = e.key;
                                if (!["Control", "Alt", "Shift", "Meta"].includes(key)) {
                                  e.preventDefault();
                                  const keyName = key === " " ? "Space" : key.length === 1 ? key.toUpperCase() : key;
                                  parts.push(keyName);
                                  if (parts.length > 0) {
                                    field.onChange(parts.join("+"));
                                  }
                                } else {
                                  e.preventDefault();
                                }
                              }}
                              onChange={() => {}}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  ))}
                </div>
                <p className="text-xs text-muted-foreground mt-4 bg-muted/50 p-3 rounded-lg">
                  <strong>Tip:</strong> Click any shortcut field above, then press the key combination you want (e.g. Ctrl+Z, Ctrl+Shift+S). It will be captured automatically. Save when done.
                </p>
              </CardContent>
            </Card>

            <div className="flex justify-end">
              <Button
                type="submit"
                size="lg"
                className="px-8"
                disabled={isUpdating}
              >
                {isUpdating && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Save Changes
              </Button>
            </div>
          </form>
        </Form>
      </div>
    </Layout>
  );
}
