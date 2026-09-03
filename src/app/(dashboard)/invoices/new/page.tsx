import { getSettings } from "@/actions/settings";
import { NewInvoiceClient } from "./new-invoice-client";

export default async function NewInvoicePage() {
  // Provide a fallback for settings if not yet configured
  let settings;
  try {
    settings = await getSettings();
  } catch (error) {
    settings = { default_gst_rate: 5 };
  }

  return <NewInvoiceClient settings={settings} />;
}
