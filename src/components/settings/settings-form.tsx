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

export function SettingsForm({ initialSettings }: { initialSettings: any }) {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  
  // Use simple controlled state instead of react-hook-form for a simpler form
  const [formData, setFormData] = useState({
    company_name: initialSettings?.company_name || "",
    company_address: initialSettings?.company_address || "",
    gst_number: initialSettings?.gst_number || "",
    phone_number: initialSettings?.phone_number || "",
    email: initialSettings?.email || "",
    upi_id: initialSettings?.upi_id || "",
    default_gst_rate: initialSettings?.default_gst_rate || 5,
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (value: string) => {
    setFormData(prev => ({ ...prev, default_gst_rate: Number(value) }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      await updateSettings(formData);
      toast.success("Settings updated successfully");
      router.refresh();
    } catch (error: any) {
      toast.error(error.message || "Failed to update settings");
    } finally {
      setIsLoading(false);
    }
  };

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
              <Label htmlFor="upi_id">UPI ID (For Payments)</Label>
              <Input
                id="upi_id"
                name="upi_id"
                placeholder="merchant@upi"
                value={formData.upi_id}
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
              onValueChange={handleSelectChange}
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
