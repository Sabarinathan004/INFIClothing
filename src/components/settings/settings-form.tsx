"use client"

import { useState } from "react";
import { updateSettings } from "@/actions/settings";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useRouter } from "next/navigation";
import { CreditCard, Banknote, Smartphone, Wallet } from "lucide-react";

const PAYMENT_METHODS = [
  { value: "upi", label: "UPI", icon: Smartphone },
  { value: "bank", label: "Bank Account", icon: CreditCard },
  { value: "cash", label: "Cash", icon: Banknote },
  { value: "none", label: "None (Hide Payment Details)", icon: Wallet },
];

export function SettingsForm({ initialSettings }: { initialSettings: any }) {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const [formData, setFormData] = useState({
    company_name: initialSettings?.company_name || "",
    company_address: initialSettings?.company_address || "",
    gst_number: initialSettings?.gst_number || "",
    phone_number: initialSettings?.phone_number || "",
    email: initialSettings?.email || "",
    // Legacy field - kept for backwards compat
    upi_id: initialSettings?.upi_id || "",
    default_gst_rate: initialSettings?.default_gst_rate || 5,
    // Payment method settings
    payment_method: initialSettings?.payment_method || "upi",
    bank_account_number: initialSettings?.bank_account_number || "",
    bank_ifsc_code: initialSettings?.bank_ifsc_code || "",
    bank_name: initialSettings?.bank_name || "",
    bank_account_holder: initialSettings?.bank_account_holder || "",
    cash_instructions: initialSettings?.cash_instructions || "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData(prev => ({ ...prev, [name]: name === "default_gst_rate" ? Number(value) : value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    // Keep upi_id in sync for legacy support
    const dataToSave = {
      ...formData,
      upi_id: formData.payment_method === "upi" ? formData.upi_id : formData.upi_id,
    };

    try {
      await updateSettings(dataToSave);
      toast.success("Settings updated successfully");
      router.refresh();
    } catch (error: any) {
      toast.error(error.message || "Failed to update settings");
    } finally {
      setIsLoading(false);
    }
  };

  const selectedMethod = PAYMENT_METHODS.find(m => m.value === formData.payment_method);

  return (
    <form onSubmit={handleSubmit} className="space-y-8 max-w-4xl pb-10">
      <Card>
        <CardHeader>
          <CardTitle>Company Profile</CardTitle>
          <CardDescription>
            These details will appear on your generated invoices.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="company_name">Company Name</Label>
              <Input
                id="company_name"
                name="company_name"
                placeholder="Your Business Name"
                value={formData.company_name}
                onChange={handleChange}
                disabled={isLoading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="gst_number">GST Number</Label>
              <Input
                id="gst_number"
                name="gst_number"
                className="uppercase"
                placeholder="29ABCDE1234F2Z5"
                value={formData.gst_number}
                onChange={handleChange}
                disabled={isLoading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone_number">Phone Number</Label>
              <Input
                id="phone_number"
                name="phone_number"
                placeholder="Support phone number"
                value={formData.phone_number}
                onChange={handleChange}
                disabled={isLoading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="Support email address"
                value={formData.email}
                onChange={handleChange}
                disabled={isLoading}
              />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="company_address">Registered Address</Label>
              <textarea
                id="company_address"
                name="company_address"
                className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                placeholder="Full address to display on invoice"
                value={formData.company_address}
                onChange={handleChange}
                disabled={isLoading}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Payment Details Card */}
      <Card>
        <CardHeader>
          <CardTitle>Payment Details</CardTitle>
          <CardDescription>
            These details appear on your invoice so customers know how to pay you.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          {/* Payment Method Selector */}
          <div className="space-y-2">
            <Label>Payment Method</Label>
            <Select
              value={formData.payment_method}
              onValueChange={(val) => handleSelectChange("payment_method", val)}
              disabled={isLoading}
            >
              <SelectTrigger className="max-w-xs">
                <SelectValue placeholder="Select payment method" />
              </SelectTrigger>
              <SelectContent>
                {PAYMENT_METHODS.map((method) => {
                  const Icon = method.icon;
                  return (
                    <SelectItem key={method.value} value={method.value}>
                      <div className="flex items-center gap-2">
                        <Icon className="w-4 h-4" />
                        {method.label}
                      </div>
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>

          {/* UPI Fields */}
          {formData.payment_method === "upi" && (
            <div className="space-y-2 p-4 rounded-lg border bg-muted/30">
              <Label htmlFor="upi_id">UPI ID</Label>
              <Input
                id="upi_id"
                name="upi_id"
                placeholder="yourname@upi or merchant@okhdfc"
                value={formData.upi_id}
                onChange={handleChange}
                disabled={isLoading}
                className="max-w-sm"
              />
              <p className="text-xs text-muted-foreground">This UPI ID will be shown on the invoice for easy payment.</p>
            </div>
          )}

          {/* Bank Account Fields */}
          {formData.payment_method === "bank" && (
            <div className="p-4 rounded-lg border bg-muted/30 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="bank_account_holder">Account Holder Name</Label>
                  <Input
                    id="bank_account_holder"
                    name="bank_account_holder"
                    placeholder="Name on bank account"
                    value={formData.bank_account_holder}
                    onChange={handleChange}
                    disabled={isLoading}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="bank_name">Bank Name</Label>
                  <Input
                    id="bank_name"
                    name="bank_name"
                    placeholder="e.g. HDFC Bank, SBI"
                    value={formData.bank_name}
                    onChange={handleChange}
                    disabled={isLoading}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="bank_account_number">Account Number</Label>
                  <Input
                    id="bank_account_number"
                    name="bank_account_number"
                    placeholder="Your bank account number"
                    value={formData.bank_account_number}
                    onChange={handleChange}
                    disabled={isLoading}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="bank_ifsc_code">IFSC Code</Label>
                  <Input
                    id="bank_ifsc_code"
                    name="bank_ifsc_code"
                    className="uppercase"
                    placeholder="e.g. HDFC0001234"
                    value={formData.bank_ifsc_code}
                    onChange={handleChange}
                    disabled={isLoading}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Cash Fields */}
          {formData.payment_method === "cash" && (
            <div className="space-y-2 p-4 rounded-lg border bg-muted/30">
              <Label htmlFor="cash_instructions">Instructions (Optional)</Label>
              <Input
                id="cash_instructions"
                name="cash_instructions"
                placeholder="e.g. Pay at office, Mon-Sat 9am-6pm"
                value={formData.cash_instructions}
                onChange={handleChange}
                disabled={isLoading}
              />
              <p className="text-xs text-muted-foreground">A "Cash Payment" note will appear on the invoice.</p>
            </div>
          )}

          {/* None */}
          {formData.payment_method === "none" && (
            <div className="p-4 rounded-lg border bg-muted/20 text-sm text-muted-foreground">
              Payment details section will be hidden on the invoice.
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Billing Preferences</CardTitle>
          <CardDescription>
            Default settings for invoice creation.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2 max-w-xs">
            <Label>Default GST Rate (%)</Label>
            <Select
              value={formData.default_gst_rate.toString()}
              onValueChange={(val) => handleSelectChange("default_gst_rate", val)}
              disabled={isLoading}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select rate" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="0">0%</SelectItem>
                <SelectItem value="5">5% (Common for Textiles)</SelectItem>
                <SelectItem value="12">12%</SelectItem>
                <SelectItem value="18">18%</SelectItem>
                <SelectItem value="28">28%</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
        <CardFooter className="pt-6">
          <Button type="submit" disabled={isLoading} className="w-full sm:w-auto">
            {isLoading ? "Saving changes..." : "Save Settings"}
          </Button>
        </CardFooter>
      </Card>
    </form>
  );
}
