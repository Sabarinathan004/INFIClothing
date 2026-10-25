# INFI Clothings — Complete System Architecture & Engineering Knowledge Base

> **Document Purpose**: This document serves as the single source of truth for **INFI Clothings** (`gst-billing`). It provides an end-to-end technical, architectural, and business breakdown for developers, coding assistants, and AI models (including Gemini Argon) to understand the codebase completely before implementing features, refactoring, or modifying code.

---

## 1. Executive Summary & Application Purpose

### 1.1 What is INFI Clothings?
**INFI Clothings** is an enterprise-grade, mobile-responsive Progressive Web Application (PWA) designed specifically for an Indian garment manufacturing and wholesale business based in **Tamil Nadu, India**. 

It handles:
- **B2B & Retail GST Billing**: Automated tax computation according to Indian GST law (Intra-state CGST + SGST vs. Inter-state IGST).
- **Fast Customer Onboarding**: Instant GSTIN verification via RapidAPI with legal name and address autofill.
- **Customer Credit & Ledger**: Real-time tracking of receivables, lifetime customer purchases, payment history, and outstanding balances.
- **Garment Logistics & Transport**: Captures transport mode, bundle/box quantities, and shipping addresses.
- **Accelerated Payment Collection**: On-invoice dynamic UPI QR code rendering (`upi://pay`) and one-click itemized WhatsApp dispatching.
- **10 Interchangeable Invoice Templates**: Print-ready, customizable invoice layouts with a 3D swipeable selector.
- **Offline-Resilient PWA**: Full service worker caching, iOS/Android home-screen installation, and offline state handling.

---

## 2. Technology Stack & Dependencies

| Category | Technology | Version | Purpose |
| :--- | :--- | :--- | :--- |
| **Framework** | Next.js (App Router) | `16.2.9` | Hybrid RSC + Client architecture, Server Actions for mutations |
| **Language** | TypeScript | `^5` | Strict type safety across forms, actions, and DB models |
| **UI Library** | React | `19.2.4` | UI rendering |
| **Database** | Supabase (PostgreSQL 15+) | `@supabase/ssr ^0.12.0`, `@supabase/supabase-js ^2.108.2` | Relational database, RPC functions, sequences, GIN indexes, RLS |
| **Styling** | Tailwind CSS | `^4` (with `@tailwindcss/postcss ^4`) | Modern utility-first styling with dark/light mode support |
| **Primitives** | Radix UI | Latest (`dialog`, `dropdown`, `select`, `tabs`, `tooltip`, `popover`, `separator`) | Accessible, unstyled UI primitives |
| **Animations** | Framer Motion | `^13.1.1` | Spring animations, gestures, and drag interactions for template carousels |
| **Icons** | Lucide React | `^1.21.0` | Comprehensive icon set |
| **Form Handling** | React Hook Form & Zod | `react-hook-form ^7.80.0`, `zod ^4.4.3`, `@hookform/resolvers ^5.4.0` | Client-side and server-side schema validation |
| **Toasts** | Sonner | `^2.0.7` | Rich notification toasts |
| **QR Generation** | `qrcode` | `^1.5.4` | Dynamic UPI QR code canvas generation |
| **PWA & Offline** | `next-pwa` + custom SW | `^5.6.0` | Service worker caching, manifest, and offline support |
| **PDF & Printing** | Browser Print Engine + `@react-pdf/renderer ^4.5.1` | Tailored print CSS stylesheets and dynamic title handling |
| **External APIs** | RapidAPI GST Insights API | HTTP REST | Live GSTIN verification and principal address parsing |

---

## 3. Database Architecture (Supabase / PostgreSQL)

The database schema is managed via SQL migrations located in `supabase/migrations/`:
1. `20231025_initial_schema.sql` (Base tables, initial sequence, RLS)
2. `20260624_verification_and_gst_split.sql` (Split CGST/SGST/IGST columns, verification types)
3. `20260624_transport_details.sql` (Transport mode, bundles count, shipping address)
4. `20260624_payment_methods.sql` (Payment modes & bank account fields in company settings)
5. `20260624_product_store_update.sql` (HSN code support in bundles and invoice items)
6. `20260706_performance_indexes.sql` (GIN trigram search indexes & `get_dashboard_stats()` RPC)

### 3.1 Entity Relationship Diagram (ERD)

```text
+---------------------+           +------------------------+
|   company_settings  |           |        bundles         |
+---------------------+           +------------------------+
| id (UUID, PK)       |           | id (UUID, PK)          |
| company_name        |           | name (TEXT)            |
| company_address     |           | hsn_code (VARCHAR)     |
| gst_number          |           | default_price (DECIMAL)|
| phone_number        |           | is_active (BOOLEAN)    |
| email               |           | created_at, updated_at |
| upi_id              |           +------------------------+
| default_gst_rate    |
| payment_method      |
| bank_account_number |
| bank_ifsc_code      |
| bank_name           |
| bank_account_holder |
| cash_instructions   |
+---------------------+

       +---------------------------+
       |         customers         |
       +---------------------------+
       | id (UUID, PK)             |
       | name (TEXT)               |
       | mobile (TEXT)             |
       | email (TEXT)              |
       | verification_type (VARCHAR|  <-- 'GST' | 'Aadhar' | 'PAN'
       | verification_number (VARC)|
       | gst_number (TEXT, legacy) |
       | address (TEXT)            |
       | created_at, updated_at    |
       +-------------+-------------+
                     | 1
                     |
                     | 0..*
       +-------------v-------------+           +-----------------------+
       |          invoices         | 1       * |     invoice_items     |
       +---------------------------+-----------+-----------------------+
       | id (UUID, PK)             |           | id (UUID, PK)         |
       | invoice_number (TEXT, UNQ)|           | invoice_id (UUID, FK) |
       | invoice_date (DATE)       |           | bundle_name (TEXT)    |
       | customer_id (UUID, FK)    |           | hsn_code (VARCHAR)    |
       | customer_name (TEXT) [SNP]|           | quantity (INTEGER)    |
       | customer_mobile [SNP]     |           | rate (DECIMAL)        |
       | customer_email [SNP]      |           | amount (DECIMAL)      |
       | customer_address [SNP]    |           | sort_order (INTEGER)  |
       | verification_type [SNP]   |           | created_at            |
       | verification_number [SNP] |           +-----------------------+
       | customer_location (VARCHAR|
       | subtotal (DECIMAL)        |           +-----------------------+
       | gst_rate (DECIMAL)        | 1       * |        payments       |
       | gst_amount (DECIMAL)      +-----------+-----------------------+
       | cgst_rate, sgst_rate      |           | id (UUID, PK)         |
       | igst_rate (DECIMAL)       |           | invoice_id (UUID, FK) |
       | cgst_amount, sgst_amount  |           | amount (DECIMAL)      |
       | igst_amount (DECIMAL)     |           | payment_date (DATE)   |
       | grand_total (DECIMAL)     |           | payment_method (TEXT) |
       | paid_amount (DECIMAL)     |           | reference_number      |
       | balance_amount (DECIMAL)  |           | created_at            |
       | payment_status (TEXT)     |           +-----------------------+
       | status (TEXT)             |
       | notes (TEXT)              |
       | transport_mode (TEXT)     |
       | shipping_address (TEXT)   |
       | no_of_bundles (INTEGER)   |
       | created_at, updated_at    |
       +---------------------------+
```

### 3.2 Critical Database Stored Procedures & Triggers
1. **Invoice Number Generation**:
   ```sql
   CREATE SEQUENCE IF NOT EXISTS invoice_number_seq START 1;
   
   CREATE OR REPLACE FUNCTION generate_invoice_number(prefix text DEFAULT 'INV')
   RETURNS text AS $$
   DECLARE
       next_val int;
       year text;
   BEGIN
       year := to_char(CURRENT_DATE, 'YY');
       SELECT nextval('invoice_number_seq') INTO next_val;
       RETURN prefix || '-' || year || '-' || lpad(next_val::text, 4, '0');
   END;
   $$ LANGUAGE plpgsql;
   ```
   *Result format*: `INV-26-0001` (atomic, thread-safe).

2. **Dashboard Performance RPC (`get_dashboard_stats()`)**:
   Instead of pulling all invoices across the wire to compute statistics, this procedure aggregates sales, collections, outstanding balances, and total counts inside Postgres with high speed and zero memory overhead.

3. **Fuzzy Trigram Indexes (`pg_trgm`)**:
   - `idx_customers_name_trgm`: GIN index on `customers.name`
   - `idx_customers_mobile_trgm`: GIN index on `customers.mobile`
   - `idx_customers_verification_number_trgm`: GIN index on `customers.verification_number`
   - `idx_bundles_name_trgm`: GIN index on `bundles.name`

---

## 4. Core Business Logic & Domain Rules

### 4.1 Indian GST Calculation Rules
- **Standard Tax Rate**: Defaulted to **5%** (`GST_RATE = 5`) for garments/apparel.
- **Location Rule**:
  - `Inside Tamil Nadu`: Intra-state transaction. Split into **CGST (2.5%)** and **SGST (2.5%)**.
  - `Outside Tamil Nadu`: Inter-state transaction. Billed under **IGST (5.0%)**.
- **Rounding Math**:
  Calculated using decimal-safe utilities (`safeMultiply`, `safeAdd`, `Math.round(val * 100) / 100`) to eliminate floating-point rounding errors on financial statements.
- **Number-to-Words**:
  Converts numeric totals into traditional Indian financial phrasing (*Crore, Lakh, Thousand, Hundred, Rupees & Paise*), formatted as:
  `Twelve Thousand Four Hundred Fifty Rupees and Fifty Paise Only`.

### 4.2 Immutable Invoicing Snapshot Principle
Invoices in this system follow the **legal snapshot pattern**:
- When an invoice is created, all customer particulars (`name`, `mobile`, `email`, `address`, `verification_type`, `verification_number`) are **copied directly into the `invoices` table**.
- If a customer edits their name or address later in the `/customers` tab, existing issued tax invoices **remain unchanged**, preserving historical legal accuracy.
- Similarly, product line items record the `bundle_name`, `hsn_code`, `rate`, and `quantity` inside `invoice_items` as a frozen snapshot.

### 4.3 Automatic Product Auto-Capture
When a user manually types a product name during invoice creation that does not yet exist in the `bundles` table, [`resolveProducts`](file:///d:/Sabari/Infi_2026_July/INFIClothing-main/INFIClothing-main/src/actions/invoices.ts#L150-L169) automatically inserts it into the `bundles` catalog with the entered unit price and HSN code, making it available for autocomplete in future invoices.

### 4.4 Automated Customer Resolution
When an invoice is submitted:
1. If `customer_id` is present, it links to that customer.
2. If `verification_type === 'GST'`, it checks whether a customer with that GSTIN already exists. If yes, it links to them.
3. If no matching record exists, it automatically creates a new row in `customers` and links the new ID to the invoice.

### 4.5 Payment Progression & Status Life-Cycle
Invoice payment statuses transition automatically upon recording payments:
- **`draft`**: Invoice is in draft stage; not yet finalized.
- **`unpaid`**: Invoice is issued, but `paid_amount === 0`.
- **`partial`**: Payments have been made (`0 < paid_amount < grand_total`).
- **`paid`**: Invoice is fully cleared (`balance_amount <= 0`).
- **`cancelled`**: Invoice has been voided; preserved for accounting audit trails.

---

## 5. Server Actions & Backend Architecture

All mutations and backend data accesses are implemented using Next.js **Server Actions** in `src/actions/`:

| File | Primary Functions | Description |
| :--- | :--- | :--- |
| [`invoices.ts`](file:///d:/Sabari/Infi_2026_July/INFIClothing-main/INFIClothing-main/src/actions/invoices.ts) | `getInvoices()`, `getInvoiceById(id)`, `createInvoice(data)`, `updateInvoice(id, data)`, `deleteInvoice(id)`, `duplicateInvoice(id)`, `cancelInvoice(id)` | Complete invoice orchestration, customer resolution, product auto-saving, GST split computation, and cache revalidation (`revalidatePath`). |
| [`customers.ts`](file:///d:/Sabari/Infi_2026_July/INFIClothing-main/INFIClothing-main/src/actions/customers.ts) | `getCustomers()`, `searchCustomers(query)`, `fetchGSTDetails(gst)`, `getCustomerById(id)`, `createCustomer(data)`, `updateCustomer(id, data)`, `deleteCustomer(id)` | Customer directory, paginated listings, GIN fuzzy search, and RapidAPI GSTIN verification. Prevents deleting customers who have active invoices. |
| [`customer-actions.ts`](file:///d:/Sabari/Infi_2026_July/INFIClothing-main/INFIClothing-main/src/actions/customer-actions.ts) | `fetchAndVerifyGST(gstNumber)` | Validates GST format via regex (`^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$`), checks local DB to save API costs, fetches from RapidAPI if missing, parses trade & legal names, and upserts to DB. |
| [`bundles.ts`](file:///d:/Sabari/Infi_2026_July/INFIClothing-main/INFIClothing-main/src/actions/bundles.ts) | `getBundles()`, `searchBundles(query)`, `createBundle(data)`, `updateBundle(id, data)`, `toggleBundleStatus(id, active)`, `deleteBundle(id)` | Product Store CRUD with active/inactive toggles. |
| [`payments.ts`](file:///d:/Sabari/Infi_2026_July/INFIClothing-main/INFIClothing-main/src/actions/payments.ts) | `addPayment(data)` | Inserts payment record, recalculates `paid_amount` and `balance_amount` on invoice, automatically updates `payment_status`, and revalidates dashboard and customer caches. |
| [`settings.ts`](file:///d:/Sabari/Infi_2026_July/INFIClothing-main/INFIClothing-main/src/actions/settings.ts) | `getSettings()`, `updateSettings(data)` | Fetches and updates singleton row in `company_settings`. Uses an explicit column whitelist (`ALLOWED_SETTINGS_KEYS`) to prevent accidental schema corruption. |
| [`dashboard.ts`](file:///d:/Sabari/Infi_2026_July/INFIClothing-main/INFIClothing-main/src/actions/dashboard.ts) | `getDashboardStats()`, `getOutstandingInvoices()` | Executes `get_dashboard_stats` RPC procedure in Postgres and retrieves all pending invoices for the outstanding dialog. |

---

## 6. Frontend Routing & Component Hierarchy

### 6.1 Route Structure (`src/app`)

```text
src/app/
├── (auth)/
│   └── login/                     # Auth login page
├── (dashboard)/                   # Protected Dashboard layout with Sidebar & MobileNav
│   ├── dashboard/page.tsx         # Dashboard metrics & outstanding balance modal
│   ├── invoices/
│   │   ├── page.tsx               # Invoice listing with date range & search filters
│   │   ├── new/page.tsx           # Create invoice screen
│   │   └── [id]/
│   │       ├── page.tsx           # Invoice viewer, payment actions, PDF & WhatsApp triggers
│   │       └── edit/page.tsx      # Invoice modification form
│   ├── customers/
│   │   ├── page.tsx               # Customer directory table
│   │   └── [id]/page.tsx          # Customer profile & ledger
│   ├── bundles/page.tsx           # Product Store (Bundles) management
│   └── settings/page.tsx          # Business profile, bank info & payment preferences
├── onboarding/templates/page.tsx  # 3D interactive template gallery
├── offline/page.tsx               # Offline fallback page
├── layout.tsx                     # Root layout with ThemeProvider, Toaster, and PwaRegistry
└── page.tsx                       # Root redirect (redirects immediately to /dashboard)
```

### 6.2 Key Components
- **[`InvoiceForm`](file:///d:/Sabari/Infi_2026_July/INFIClothing-main/INFIClothing-main/src/components/invoices/invoice-form.tsx)**: Complex form built with `react-hook-form` and `useFieldArray`. Handles customer selection/verification tabs, transport details, line-item calculations, and scroll-to-error validation.
- **[`InvoiceDetailsView`](file:///d:/Sabari/Infi_2026_July/INFIClothing-main/INFIClothing-main/src/components/invoices/invoice-details-view.tsx)**: Reads the user's selected invoice template ID from `localStorage` (`selected_invoice_template`) and renders the appropriate layout.
- **[`TemplateSelector`](file:///d:/Sabari/Infi_2026_July/INFIClothing-main/INFIClothing-main/src/components/invoices/template-selector.tsx)**: Framer Motion-powered 3D carousel enabling touch/swipe selection among 10 distinct invoice designs.
- **[`PaymentActions`](file:///d:/Sabari/Infi_2026_July/INFIClothing-main/INFIClothing-main/src/components/payments/payment-actions.tsx)**: Modal dialog for recording partial payments or one-click full payment settlement.
- **[`WhatsAppShare`](file:///d:/Sabari/Infi_2026_July/INFIClothing-main/INFIClothing-main/src/components/invoices/whatsapp-share.tsx)**: Formats an itemized bill into a clean WhatsApp text message and opens the WhatsApp link with prefilled message.
- **[`OutstandingBalanceModal`](file:///d:/Sabari/Infi_2026_July/INFIClothing-main/INFIClothing-main/src/components/dashboard/outstanding-balance-modal.tsx)**: Responsive dialog showcasing pending collections, customer phone links, and balances.

---

## 7. The 10 Invoice Templates

All templates reside in [`src/components/invoice-templates/`](file:///d:/Sabari/Infi_2026_July/INFIClothing-main/INFIClothing-main/src/components/invoice-templates/) and adhere to strict print stylesheet specifications:

1. **`classic.tsx`**: Traditional Indian Tax Invoice layout with formal boxed grid, bank info, and declaration.
2. **`evergreen.tsx`**: Clean, modern invoice styling with emerald header accents.
3. **`bill-to-ship-to.tsx`**: Dual-card layout explicitly separating buyer address from transport/shipping destination.
4. **`legend.tsx`**: High-contrast, bold corporate headers with dark accents.
5. **`compact.tsx`**: Space-efficient layout designed for high item-count orders.
6. **`elegant.tsx`**: High-end boutique aesthetic with refined typography and subtle dividers.
7. **`vintage.tsx`**: Warm tones, serif headers, and classic border work.
8. **`mrp-discount.tsx`**: Features dedicated columns for MRP, discounts, and net taxable rates.
9. **`modern.tsx`**: Contemporary clean design with minimal borders and subtle shaded rows.
10. **`service.tsx`**: Simplified billing structure suitable for non-bundle service items.

---

## 8. Progressive Web App (PWA) & Mobile Architecture

1. **Manifest Configuration** ([`public/manifest.json`](file:///d:/Sabari/Infi_2026_July/INFIClothing-main/INFIClothing-main/public/manifest.json)):
   - Display: `standalone`
   - Orientation: `portrait`
   - Background Color: `#0f0a2e`
   - Theme Color: `#1e1b4b`
   - Multi-resolution icons (`72x72` to `512x512`), standard & maskable.
2. **Service Worker** ([`public/sw.js`](file:///d:/Sabari/Infi_2026_July/INFIClothing-main/INFIClothing-main/public/sw.js)):
   - Pre-caches static assets and offline shell.
   - Intercepts fetch requests to serve cached responses when offline.
3. **PWA Registry & Installation Prompts** ([`src/components/pwa-registry.tsx`](file:///d:/Sabari/Infi_2026_July/INFIClothing-main/INFIClothing-main/src/components/pwa-registry.tsx)):
   - Android / Desktop Chrome: Captures the `beforeinstallprompt` event and presents an in-app installation banner.
   - iOS Safari: Detects iOS devices running outside standalone mode and renders a floating instruction card demonstrating how to tap the Share button and select "Add to Home Screen".
   - Dismiss state remembered in `localStorage` for 8 hours to avoid annoying the user.
4. **Offline Resilience**:
   - [`useOnlineStatus`](file:///d:/Sabari/Infi_2026_July/INFIClothing-main/INFIClothing-main/src/hooks/use-online-status.ts) continuously monitors network status.
   - Forms block submissions with friendly error toasts when offline to prevent data loss.
   - [`/offline`](file:///d:/Sabari/Infi_2026_July/INFIClothing-main/INFIClothing-main/src/app/offline/page.tsx) provides a retry interface with reload triggers.

---

## 9. Environment Variables & External Configurations

Create or verify `.env.local` with the following variables:

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL="https://<project-ref>.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="<supabase-anon-key>"

# RapidAPI GST Verification API
RAPIDAPI_KEY="<your-rapidapi-key>"
RAPIDAPI_HOST="gst-insights-api.p.rapidapi.com"
```

---

## 10. Developer Guidelines for Modifying Code

When adding features or making modifications, follow these core principles:

1. **Maintain Snapshot Immutability**:
   Never alter historical customer or item information directly on past invoices when updating customers or bundles.
2. **Preserve Next.js 16 App Router Conventions**:
   Read the Next.js 16 migration guide in `node_modules/next/dist/docs/` if interacting with async server components or route handlers (as noted in [`AGENTS.md`](file:///d:/Sabari/Infi_2026_July/INFIClothing-main/INFIClothing-main/AGENTS.md)). In Next.js 16, dynamic params (e.g. `params: Promise<{ id: string }>`) must be awaited.
3. **Keep Decimal Math Safe**:
   Never perform raw floating-point multiplication on currency (`item.quantity * item.rate`). Always use the helper functions in [`src/lib/utils.ts`](file:///d:/Sabari/Infi_2026_July/INFIClothing-main/INFIClothing-main/src/lib/utils.ts) (`safeMultiply`, `safeAdd`, `calculateGST`).
4. **Revalidate Caches after Server Actions**:
   Any action mutating invoice, customer, or payment data must call `revalidatePath` on `/invoices`, `/dashboard`, and `/customers/[id]` to keep server components synchronized.
5. **Print Stylesheet Integrity**:
   When updating invoice views, test with `@media print` in mind. Use Tailwind's `print:hidden`, `print:text-black`, `print:max-w-none`, and `print:border-0` classes to preserve print and PDF export quality.
6. **Whitelist Settings Columns**:
   When adding company settings fields, always append the new column name to `ALLOWED_SETTINGS_KEYS` in [`src/actions/settings.ts`](file:///d:/Sabari/Infi_2026_July/INFIClothing-main/INFIClothing-main/src/actions/settings.ts) to prevent payload stripping.
