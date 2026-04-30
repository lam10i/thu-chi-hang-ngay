# CLAUDE.md — Sổ Chi Tiêu Hằng Ngày

> Tài liệu này dành cho Claude (và lập trình viên) các phiên sau hiểu nhanh dự án.
> Cập nhật song song với quá trình phát triển.

---

## 1. Mục đích dự án

Web app cá nhân giúp **ghi chép chi tiêu hằng ngày** và **xem biểu đồ trực quan** theo ngày / tuần / tháng. Dữ liệu lưu **cloud** (Supabase Postgres), đăng nhập bằng email Magic Link, đồng bộ trên mọi thiết bị.

> ⚠️ App **CHỈ** ghi chi tiêu (tiền tiêu). KHÔNG có khái niệm thu nhập / số dư. Đừng tự tiện thêm "Thu" trở lại — quyết định cố ý từ người dùng để app gọn nhẹ, đúng nhiệm vụ.

**Đối tượng:** cá nhân (single-user, không share dữ liệu với người khác).

---

## 2. Trạng thái triển khai (deployment)

**Production live:**
- App URL: https://thu-chi-hang-ngay.vercel.app
- GitHub repo (public): https://github.com/lam10i/thu-chi-hang-ngay
- Hosting: **Vercel** (free Hobby), branch `main` = production, auto-deploy on push
- Backend: **Supabase** project `thu-chi-hang-ngay` — URL `https://cqeqhminrhfonckfxpsy.supabase.co` (region Asia-Pacific Singapore, free tier)

**ENV vars cần có (cả local lẫn Vercel):**
- `NEXT_PUBLIC_SUPABASE_URL` — URL project Supabase
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` — **legacy anon key** dạng JWT (`eyJ...`), KHÔNG phải `sb_publishable_*` mới (xem mục 9 để hiểu lý do)

**Workflow deploy lần sau:** chỉ cần `git push origin main` → Vercel tự build + deploy ~1 phút.

---

## 3. Tech stack

| Layer | Lựa chọn |
|---|---|
| Framework | Next.js 16 (App Router, Turbopack) |
| Ngôn ngữ | TypeScript (strict) |
| Styling | Tailwind CSS v4 |
| UI components | shadcn/ui (style "New York", base color "Slate") — phiên bản dùng `@base-ui/react` (KHÔNG hỗ trợ prop `asChild` trên Button hay DropdownMenuTrigger) |
| Form | react-hook-form + zod |
| Date | date-fns (locale `vi`) |
| Icon | lucide-react |
| Theme | next-themes (light/dark) |
| Charts | recharts |
| State | React Context + custom hooks (`useTransactions`, `useCategories`, `useAuth`) |
| Database | **Supabase Postgres** — bảng `transactions` + `categories`, RLS theo `auth.uid()` |
| Auth | **Supabase Auth** — Magic Link qua email (`signInWithOtp`), session lưu trong cookie qua `@supabase/ssr` |
| ID transactions | `gen_random_uuid()` (Postgres) |
| ID categories | slug từ tên (`slugify()` trong `lib/categories.ts`) |
| Format tiền | `Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' })` |

---

## 4. Cách chạy dự án

```bash
npm install        # Cài dependencies
cp .env.local.example .env.local
# Điền 2 biến NEXT_PUBLIC_SUPABASE_URL + NEXT_PUBLIC_SUPABASE_ANON_KEY
npm run dev        # Chạy dev server (http://localhost:3000)
npm run build      # Build production
npm run lint       # Lint code
```

> **Lưu ý:** Thư mục dự án có dấu tiếng Việt và khoảng trắng (`Thu Chi Hằng Ngày`). Khi chạy lệnh shell có path tuyệt đối, luôn quote bằng `"..."`. NPM không cho phép tên project có dấu/viết hoa nên `package.json` dùng `name: "thu-chi-hang-ngay"`.

---

## 5. Cấu trúc thư mục

```
src/
├── app/
│   ├── layout.tsx              # ThemeProvider → AuthProvider → CategoriesProvider → TransactionsProvider → AppShell + Toaster
│   ├── page.tsx                # Dashboard "/" (SummaryCards + SpendingChart + CategoryPieChart + RecentTransactions)
│   ├── transactions/page.tsx   # Danh sách chi tiêu "/transactions" (TransactionFilters + TransactionList)
│   ├── recurring/page.tsx      # Chi phí cố định hằng tháng "/recurring" (CRUD + tổng tháng/năm)
│   ├── categories/page.tsx     # Quản lý danh mục "/categories"
│   ├── login/page.tsx          # Form Magic Link "/login" — public route
│   ├── auth/callback/route.ts  # OAuth/OTP callback handler — đổi code thành session cookie
│   └── globals.css
├── components/
│   ├── ui/                     # shadcn (auto-generated, đừng sửa tay)
│   ├── theme-provider.tsx
│   ├── category-icon.tsx       # Map tên icon (string) → component lucide
│   ├── layout/
│   │   ├── Header.tsx          # Nav 3 mục + theme toggle + avatar dropdown (có nút Đăng xuất)
│   │   └── AppShell.tsx        # Wrap children, ẩn Header trên route /login
│   ├── dashboard/
│   │   ├── SummaryCards.tsx    # 3 thẻ: Hôm nay / Tuần này / Tháng này (gate bằng isLoaded để tránh hydration mismatch)
│   │   ├── SpendingChart.tsx   # BarChart recharts, tabs Ngày/Tuần/Tháng + nav controls (←/→/date picker/Hôm nay) dịch theo nguyên window
│   │   ├── CategoryPieChart.tsx # Donut chart phân bổ theo category, tabs Tuần/Tháng/Tất cả + nav controls (ẩn khi tab "Tất cả")
│   │   └── RecentTransactions.tsx
│   ├── transactions/
│   │   ├── TransactionForm.tsx # Dialog ghi/sửa chi tiêu (có nút "+ Thêm danh mục" inline)
│   │   ├── TransactionFilters.tsx # Search + preset (Hôm nay/7d/30d/Tuần/Tháng/Tháng trước/Tự chọn) + date range
│   │   ├── TransactionList.tsx # Bảng danh sách (nhận ListFilters, tự sort + tổng kết "Tìm thấy N · Tổng X")
│   │   └── DeleteConfirm.tsx
│   ├── categories/
│   │   └── CategoryForm.tsx    # Dialog thêm/sửa category (palette icon + màu)
│   └── recurring/
│       └── FixedCostForm.tsx   # Dialog thêm/sửa chi phí cố định (tên + amount + category optional + note)
├── lib/
│   ├── supabase/
│   │   ├── client.ts           # createBrowserClient cho client components
│   │   └── server.ts           # createServerClient cho server components / route handlers
│   ├── format.ts               # formatVND, formatNumber, formatDate, todayISO, parseAmount (hiểu "50k" / "1.5tr")
│   ├── categories.ts           # DEFAULT_CATEGORIES (chỉ tham chiếu), CATEGORY_ICONS, CATEGORY_COLORS, stripDiacritics(), slugify()
│   └── utils.ts                # cn() helper
├── hooks/
│   ├── useAuth.tsx             # AuthProvider (session từ cookie SSR + onAuthStateChange) + signOut
│   ├── useTransactions.tsx     # CRUD async qua Supabase
│   ├── useCategories.tsx       # CRUD async qua Supabase
│   └── useFixedCosts.tsx       # CRUD chi phí cố định + tổng/tháng
├── types/
│   └── transaction.ts          # Transaction + Category
└── middleware.ts               # Refresh session cookie + redirect chưa login → /login (PUBLIC_PATHS = /login, /auth/callback)

supabase/
├── schema.sql                  # SQL khởi tạo: 2 bảng + RLS policies + trigger seed danh mục mặc định khi user mới
└── migrations/
    └── 002_fixed_costs.sql     # Migration: thêm bảng fixed_costs + RLS

.github/workflows/
└── keep-supabase-alive.yml     # Cron 5 ngày/lần ping REST API → chống Supabase free auto-pause sau 7 ngày
```

> **Lưu ý:** Next.js 16 cảnh báo file `middleware.ts` deprecated, đề xuất đổi thành `proxy.ts`. Hiện tại vẫn chạy bình thường, chưa cần migrate gấp.

---

## 6. Data model (Postgres schema)

```sql
-- public.transactions
id          uuid primary key default gen_random_uuid()
user_id     uuid references auth.users(id) on delete cascade
amount      bigint check (amount > 0)        -- VND, integer cho an toàn
category_id text                              -- không có FK để xoá category không lỗi
note        text
date        date                              -- ngày phát sinh
created_at  timestamptz default now()

-- public.categories
id          text primary key                  -- slug, vd "ca-phe"
user_id     uuid references auth.users(id) on delete cascade
name        text
icon        text                              -- tên icon trong CATEGORY_ICONS
color       text                              -- hex từ CATEGORY_COLORS
created_at  timestamptz default now()
```

**TypeScript domain (frontend):**
```ts
interface Transaction {
  id: string;          // uuid (đã đổi từ category_id → category trong code)
  amount: number;      // VND
  category: string;    // category id
  note?: string;
  date: string;        // "YYYY-MM-DD"
  createdAt: string;   // ISO datetime
}

interface Category {
  id: string;
  name: string;
  icon: string;
  color?: string;
}
```

**RLS policies:** `auth.uid() = user_id` cho cả SELECT/INSERT/UPDATE/DELETE trên cả 2 bảng.

**Trigger seed:** `on_auth_user_created` chạy sau `INSERT auth.users` → tự tạo 8 danh mục mặc định cho user mới (Ăn uống, Cà phê, Đi lại, Mua sắm, Hóa đơn, Giải trí, Sức khỏe, Khác).

**Khi xoá category:** transactions giữ nguyên `category_id` (không có FK constraint), UI fallback "Khác" + icon `Tag` + màu xám.

---

## 7. Quy ước (conventions)

### Frontend
- **Tiền tệ:** luôn dùng `formatVND()` từ [src/lib/format.ts](src/lib/format.ts).
- **Locale ngày:** `vi` (date-fns). Format ngày mặc định: `dd/MM/yyyy`.
- **Tuần bắt đầu thứ Hai** (`weekStartsOn: 1`).
- **Validation:** zod schema khai báo cùng file với form.
- **Component file:** mỗi file 1 component default/named export rõ ràng.
- **shadcn Button KHÔNG có `asChild`:** muốn link styled như button → dùng `<Link className="...">` trực tiếp.
- **shadcn Select `onValueChange`** signature là `(value: string | null) => void` — luôn wrap khi setState với fallback (`v ?? "all"`).
- **Icon palette:** chỉ dùng các icon trong `CATEGORY_ICONS`. Khi thêm icon mới, update CẢ `CATEGORY_ICONS` lẫn `ICON_MAP` trong [src/components/category-icon.tsx](src/components/category-icon.tsx).
- **Bỏ dấu tiếng Việt:** dùng `stripDiacritics()` từ `lib/categories.ts`.
- **Tránh hydration mismatch:** không gọi `new Date()` / `format(new Date(), ...)` trực tiếp trong JSX của client component được prerender. Phải gate qua `isLoaded` hoặc `useEffect` mount. Charts dùng `next/dynamic({ ssr: false })`.
- **`<body>` có `suppressHydrationWarning`** vì Bitdefender extension chèn attribute (`bis_register`, `__processed_*`) vào DOM trước khi React hydrate.

### Auth & Supabase
- **Server-side session:** `createClient()` từ `lib/supabase/server.ts` đọc cookie qua `next/headers`. Dùng trong `layout.tsx`, route handlers, server components.
- **Client-side session:** `createClient()` từ `lib/supabase/client.ts` cho mọi `"use client"` component. AuthProvider subscribe `onAuthStateChange`.
- **Hooks `useTransactions` / `useCategories`** **bắt buộc async** — return `Promise<void>` hoặc `Promise<Category | null>`. Component caller phải `await` (handler async) để tránh race condition.
- **Optimistic update**: sau khi insert/update Supabase thành công → set local state ngay (không refetch). Nếu lỗi → toast và không update state.
- **RLS** đã làm hết việc lọc `user_id` → query không cần `.eq("user_id", user.id)`. Insert PHẢI truyền `user_id: user.id`.
- **Routes đều dynamic** (server-rendered) vì middleware đọc cookies. Đừng cố static export.

---

## 8. Roadmap

### Đã làm
- [x] CRUD chi tiêu + danh mục
- [x] Dashboard 3 thẻ Hôm nay/Tuần/Tháng
- [x] Bar chart theo ngày/tuần/tháng + navigation lùi/tới khoảng tuỳ ý + date picker
- [x] Pie chart phân bổ theo danh mục + navigation tuần/tháng tuỳ ý
- [x] Filter + search + date range
- [x] Cloud sync (Supabase) + auth Magic Link
- [x] Deploy production Vercel
- [x] **Quick parse "50k" / "1.5tr" trong amount input**
- [x] **GitHub Actions cron ping chống Supabase auto-pause 7 ngày**

### Bước tiếp theo (đề xuất priority)

1. **🔥 Cao — Setup custom SMTP (Resend) để hết bị rate limit email 3-4/giờ**
   - Resend free tier 100 emails/ngày. Vào Supabase → Auth → SMTP Settings paste config
   - Cần thiết nếu hay đăng xuất rồi đăng nhập lại trên nhiều thiết bị

2. **TB — Edit transaction với category đã xoá**
   - Mở edit → Select category trống vì id cũ không còn. Hiện badge cảnh báo + buộc chọn lại

3. **TB — Bảng transactions overflow ngang trên mobile**
   - Bọc `<Table>` trong `<div className="overflow-x-auto">`

4. **Thấp — Export/Import JSON backup** (giờ ít cần vì đã có cloud, nhưng để user tự backup vẫn hữu ích)

5. **Thấp — PWA / Add to Home Screen UX** (manifest + icons)

6. **Thấp — Recurring expenses, Budget per category**

### Đã KHÔNG làm (cố tình)
- ❌ **Thu nhập / số dư** — app chỉ ghi chi tiêu
- ❌ **Multi-user / share data** — single-user, mỗi account có data riêng
- ❌ **Migration data localStorage cũ → cloud** — skip để giảm scope, app vừa launch chưa có data đáng kể
- ❌ Test suite (sẽ thêm khi app stable)
- ❌ i18n (chỉ tiếng Việt)
- ❌ Multi-currency

---

## 9. Quyết định quan trọng (decision log)

### D1. Chọn Supabase thay Firebase / Neon / PlanetScale
**Tại sao:** Free tier rộng (500MB DB, 50k users), Postgres thật (RLS strong, không phải NoSQL), Auth + DB cùng 1 chỗ, SDK TS tốt. Phù hợp cho cá nhân/MVP.

### D2. Magic Link thay vì Google OAuth
**Tại sao:** Setup Magic Link mất ~2 phút (chỉ bật Email provider, mặc định đã bật). Google OAuth phải sang Google Cloud Console tạo OAuth Client + redirect URI + Authorized JavaScript origin → ~10-15 phút và dễ vướng. App cá nhân không cần "1-click sign in" hoành tráng. Trade-off: mỗi lần login phải mở email (nhưng session lưu cookie vài tuần nên ít khi cần).

### D3. Dùng legacy anon key (`eyJ...` JWT) thay vì publishable key mới (`sb_publishable_*`)
**Tại sao:** Supabase mới ra format key `sb_publishable_*` thay anon key cũ. Tuy nhiên khi test thực tế, gọi `supabase.auth.signInWithOtp()` với key mới báo **"Invalid API key"** — Auth API endpoint chưa fully support format mới (tính tới SDK `@supabase/supabase-js@2.105.1`). Quay về dùng legacy anon key (lấy từ tab "Legacy anon, service_role API keys" trong Supabase Settings → API). Khi nào SDK update support thì có thể đổi lại.

### D4. Single-user, không có concept "household/group"
**Tại sao:** User xác nhận chỉ mình dùng (không share vợ/chồng/gia đình). Schema thiết kế `user_id` 1-1, RLS đơn giản. Sau muốn multi-user phải refactor sang model `household_members`.

### D5. Bump storage key v1 → v2 khi đổi schema, không in-place migration
**Tại sao:** Convention ở phase localStorage, giữ nguyên cho phase Supabase: schema thay đổi → bump version, viết migration tách bạch. Hiện tại `transactions.v2` (bỏ field `type` "income/expense") và `categories.v1` (deprecated, dữ liệu localStorage cũ KHÔNG migrate lên Supabase).

### D6. Public GitHub repo
**Tại sao:** User chọn public. Code có thể vào portfolio, không có secret nào commit (`.env.local` đã trong `.gitignore`). Anon key public là an toàn vì RLS bảo vệ.

### D7. Hosting: Vercel free Hobby
**Tại sao:** Chính chủ Next.js, zero-config, auto-deploy từ GitHub. Free tier 100GB bandwidth/tháng quá đủ cho cá nhân. Không cần Pro plan.

### D8. Skip migration localStorage → Supabase
**Tại sao:** App vừa scaffold, user mới nhập 1-2 transaction test. Tốn ~30 phút code migration banner "import data cũ" nhưng giá trị thấp → cắt khỏi scope.

---

## 10. Known issues / gotchas

- **Supabase free tier auto-pause sau 7 ngày không activity** → app sẽ báo lỗi DB, vào dashboard bấm Resume (data còn nguyên)
- **Email rate limit 3-4/giờ** với Supabase built-in SMTP → spam test login sẽ bị cấm tạm thời
- **Recharts width(-1) warning** khi prerender → đã workaround bằng `next/dynamic({ ssr: false })` cho cả 2 chart, nhưng vẫn có thể thấy warning trong console hot reload
- **Next.js 16 deprecation:** `middleware.ts` → `proxy.ts`. Để ý khi upgrade Next 17
- **Cần 2 ENV vars** ở mọi nơi (local + Vercel + nếu user clone về máy khác). Đảm bảo có `.env.local.example` để hint

---

## 11. Lịch sử cập nhật

- v0.1 — Khởi tạo plan + tech stack.
- v0.2 — Hoàn thành v1: Dashboard (Thu+Chi+Số dư), trang Giao dịch CRUD, TransactionForm với radio Thu/Chi.
- **v0.3 — Refactor lớn theo yêu cầu user:**
  - Loại bỏ hoàn toàn khái niệm "Thu" (TransactionType, radio chọn loại, tabs filter)
  - Bump storage key `thuchi.transactions.v1` → `v2`
  - SummaryCards đổi sang **Hôm nay / Tuần này / Tháng này**
  - Thêm **SpendingChart** (recharts BarChart) tabs Ngày/Tuần/Tháng
  - **Categories user-CRUD** (storage `thuchi.categories.v1`), thêm trang `/categories`
  - TransactionForm có nút "+ Thêm danh mục" inline
  - Header nav có icon, brand "Sổ Chi Tiêu"
  - 30 icons + 12 màu
- **v0.4 — Pie chart + filter nâng cao + cleanup:**
  - **CategoryPieChart** (donut, tabs Tuần/Tháng/Tất cả)
  - **TransactionFilters**: search bỏ dấu, preset thời gian, date range
  - `TransactionList` đổi prop sang `filters: ListFilters`, hiện "Tìm thấy N · Tổng X"
  - Fix hydration mismatch SummaryCards
  - `suppressHydrationWarning` cho `<body>`
  - Refactor `stripDiacritics()` chung
  - Xoá `isSameMonth` không dùng
- **v0.5 — Cloud sync (Supabase) + Deploy:**
  - **Backend**: Supabase Postgres + Magic Link auth (chuyển từ Google OAuth ban đầu vì setup nhanh hơn — xem D2)
  - Schema 2 bảng + RLS theo `auth.uid()` + trigger seed danh mục mặc định
  - Files mới: `lib/supabase/{client,server}.ts`, `middleware.ts`, `hooks/useAuth.tsx`, `app/login/page.tsx`, `app/auth/callback/route.ts`, `components/layout/AppShell.tsx`, `supabase/schema.sql`
  - `useTransactions` + `useCategories` refactor sang async, query Supabase
  - Header có avatar + dropdown Đăng xuất
  - **Deploy production** lên https://thu-chi-hang-ngay.vercel.app (auto từ GitHub `main`)
  - Phải dùng **legacy anon key** (`eyJ...`) thay publishable key mới — xem D3
  - Skip migration localStorage cũ — xem D8
- **v0.6 — SpendingChart navigation tuỳ ý:**
  - User report: chỉ xem được khoảng kết thúc tại hôm nay (14d/8w/6m), không xem được quá khứ xa
  - Thêm `anchor: Date` state vào `SpendingChart`, mặc định `new Date()`
  - 3 control mới ở header: nút `←` lùi nguyên window, nút `→` tới (disabled nếu sẽ vượt hôm nay), date picker `<input type="date">` jump anchor, nút "Hôm nay" reset (chỉ hiện khi anchor ≠ today)
  - Helper mới: `shift(range, anchor, dir)`, `rangeLabel(range, anchor)`. `buildBuckets()` và `rangeBounds()` nhận thêm tham số `anchor`
  - Constant `WINDOW_SIZE = { day: 14, week: 8, month: 6 }` tách ra cho dễ chỉnh
  - Header label đổi từ "14 ngày qua" → "16/04/2026 – 29/04/2026"
- **v0.7 — CategoryPieChart navigation (consistency với SpendingChart):**
  - Áp dụng pattern y v0.6: `anchor` state + nút `←/→` + date picker + nút "Hôm nay"
  - Refactor `inRange(dateISO, range, anchor)`:
    - `week`: 7 ngày kết thúc tại anchor
    - `month`: nguyên tháng chứa anchor (`startOfMonth` → `endOfMonth`)
    - `all`: bỏ qua anchor, ẩn toàn bộ control nav
  - Header label theo range: tuần "02/04 – 08/04", tháng "04/2026", all "Tất cả"
  - Nút `→` disabled khi `anchor + 1 unit > today`
- **v0.8 — Quick parse "50k" / "1.5tr" + GitHub Actions chống Supabase auto-pause:**
  - Hàm `parseAmount()` mới trong [src/lib/format.ts](src/lib/format.ts): hiểu suffix `k` (×1.000), `tr` / `m` (×1.000.000), chấp nhận decimal `1.5` hoặc `1,5`. Không suffix → strip non-digits như cũ.
  - `TransactionForm` input amount: `inputMode="text"` (không còn "numeric"), placeholder hint "Vd: 50k = 50.000, 1.5tr = 1.500.000". Khi gõ shorthand giữ nguyên text + hiện preview "= 50.000 ₫" bên dưới. Format `1.234.567` khi blur hoặc khi gõ pure digits.
  - Workflow `.github/workflows/keep-supabase-alive.yml`: cron `0 0 */5 * *` ping `GET /rest/v1/categories?select=id&limit=1` với header `apikey + Authorization`. Coi 200/401/404 đều là DB awake (không lỗi network/timeout).
  - Secrets `SUPABASE_URL` + `SUPABASE_ANON_KEY` add vào GitHub repo (không commit, mặc dù anon key vốn public — best practice).
  - Có thể trigger manual qua Actions tab → "Run workflow" để test bất kỳ lúc nào.
- **v0.9 — Chi phí cố định hằng tháng (Recurring page):**
  - Trang mới `/recurring` (nav "Cố định") để CRUD các khoản phải trả đều đặn (tiền nhà, internet, gym, Netflix...). KHÔNG tự tạo transaction — chỉ là list tham khảo + thống kê tổng.
  - Bảng mới `public.fixed_costs` (uuid, user_id, name, amount, category_id?, note?, created_at) + RLS theo `auth.uid()` — migration ở [supabase/migrations/002_fixed_costs.sql](supabase/migrations/002_fixed_costs.sql)
  - `category_id` optional, tận dụng category sẵn có (link icon + màu). Nullable vì user có thể không phân loại.
  - 2 thẻ tổng quan đầu trang: **Tổng/tháng** + **Tổng/năm (×12)**
  - Files mới: `src/types/transaction.ts` (interface `FixedCost`), `src/hooks/useFixedCosts.tsx`, `src/components/recurring/FixedCostForm.tsx`, `src/app/recurring/page.tsx`
  - `Header` thêm nav item "Cố định" (icon `Repeat`), `layout.tsx` wrap thêm `FixedCostsProvider`
  - Form tận dụng `parseAmount()` từ v0.8 (gõ "5tr" → 5.000.000)
