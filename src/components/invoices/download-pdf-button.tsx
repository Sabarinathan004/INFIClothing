"use client"

import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";

export function DownloadPdfButton() {
  const handlePrint = () => {
    window.print();
  };

  return (
    <Button variant="outline" className="gap-2" onClick={handlePrint}>
      <Download className="w-4 h-4" />
      <span className="hidden sm:inline">Download PDF</span>
    </Button>
  );
}
