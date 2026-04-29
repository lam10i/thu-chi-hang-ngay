# CLAUDE.md — Sổ Chi Tiêu Hằng Ngày

> Tài liệu này dành cho Claude (và lập trình viên) các phiên sau hiểu nhanh dự án.
> Cập nhật song song với quá trình phát triển.

---

## 1. Mục đích dự án

Web app cá nhân giúp **ghi chép chi tiêu hằng ngày** và **xem biểu đồ trực quan** theo ngày / tuần / tháng. Phiên bản hiện tại chạy hoàn toàn ở client (không backend, không đăng nhập), dữ liệu lưu trong `localStorage`.

> ⚠️ App **CHỈ** ghi chi tiêu (tiền tiêu). KHÔNG có khái niệm thu nhập / số dư. Đừng tự tiện thêm "Thu" trở lại — quyết định cố ý từ người dùng để app gọn nhẹ, đúng nhiệm vụ.

**Đối tượng:** cá nhân, dùng trên 1 thiết bị.

---

## 2. Tech stack

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
| State | React Context + custom hooks |
| Storage | **Supabase** (Postgres) — bảng `transactions` + `categories`, RLS theo `auth.uid()` |
| Auth | **Supabase Auth** — Google OAuth (provider `google`) qua `@supabase/ssr` |
| ID transactions | `gen_random_uuid()` (Postgres) |
| ID categories | slug từ tên (`slugify()` trong `lib/categories.ts`) |
| Format tiền | `Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' })` |

---

## 3. Cách chạy dự án

```bash
npm install        # Cài dependencies
npm run dev        # Chạy dev server (http://localhost:3000)
npm run build      # Build production
npm run start      # Chạy production build
npm run lint       # Lint code
```

> **Lưu ý:** Thư mục dự án có dấu tiếng Việt và khoảng trắng (`Thu Chi Hằng Ngày`). Khi chạy lệnh shell có path tuyệt đối, luôn quote bằng `"..."`. NPM không cho phép tên project có dấu/viết hoa nên `package.json` dùng `name: "thu-chi-hang-ngay"`.

---

## 4. Cấu trúc thư mục

```
src/
├── app/
│   ├── layout.tsx              # ThemeProvider → CategoriesProvider → TransactionsProvider → Header + Toaster
│   ├── page.tsx                # Dashboard "/" (SummaryCards + SpendingChart + RecentTransactions)
│   ├── transactions/page.tsx   # Danh sách chi tiêu "/transactions" (filter theo category)
│   ├── categories/page.tsx     # Quản lý danh mục "/categories"
│   └── globals.css
├── components/
│   ├── ui/                     # shadcn (auto-generated, đừng sửa tay)
│   ├── theme-provider.tsx
│   ├── category-icon.tsx       # Map tên icon (string) → component lucide
│   ├── layout/Header.tsx       # Nav 3 mục + theme toggle
│   ├── dashboard/
│   │   ├── SummaryCards.tsx    # 3 thẻ: Hôm nay / Tuần này / Tháng này (gate bằng isLoaded để tránh hydration mismatch)
│   │   ├── SpendingChart.tsx   # BarChart recharts, tabs Ngày/Tuần/Tháng
│   │   ├── CategoryPieChart.tsx # Donut chart phân bổ theo category, tabs Tuần/Tháng/Tất cả
│   │   └── RecentTransactions.tsx
│   ├── transactions/
│   │   ├── TransactionForm.tsx # Dialog ghi/sửa chi tiêu (có nút "+ Thêm danh mục" inline)
│   │   ├── TransactionFilters.tsx # Search + preset (Hôm nay/7d/30d/Tuần/Tháng/Tháng trước/Tự chọn) + date range
│   │   ├── TransactionList.tsx # Bảng danh sách (nhận ListFilters, tự sort + tổng kết hàng + tổng tiền)
│   │   └── DeleteConfirm.tsx
│   └── categories/
│       └── CategoryForm.tsx    # Dialog thêm/sửa category (palette icon + màu)
├── lib/
│   ├── storage.ts              # readJSON/writeJSON, load/save transactions + categories
│   ├── format.ts               # formatVND, formatNumber, formatDate, todayISO
│   ├── categories.ts           # DEFAULT_CATEGORIES, CATEGORY_ICONS, CATEGORY_COLORS, stripDiacritics(), slugify()
│   └── utils.ts                # cn() helper
├── hooks/
│   ├── useTransactions.tsx     # CRUD transactions
│   └── useCategories.tsx       # CRUD categories
└── types/
    └── transaction.ts          # Transaction + Category
```

---

## 5. Data model

```ts
interface Transaction {
  id: string;          // uuid
  amount: number;      // VND, > 0
  category: string;    // id của Category (có thể không tồn tại nếu user xoá category)
  note?: string;       // ≤ 200 ký tự
  date: string;        // "YYYY-MM-DD"
  createdAt: string;   // ISO datetime
}

interface Category {
  id: string;          // slug, vd "ca-phe"
  name: string;        // "Cà phê"
  icon: string;        // tên icon trong CATEGORY_ICONS (vd "Coffee")
  color?: string;      // hex từ CATEGORY_COLORS (vd "#f97316")
}
```

**Categories được lưu trong localStorage** (key `thuchi.categories.v1`). Lần đầu chạy sẽ seed `DEFAULT_CATEGORIES`. User có thể CRUD ở `/categories`.

**Khi xoá category:** transactions tham chiếu vẫn giữ nguyên `category` id, UI fallback về "Khác" + icon `Tag` + màu xám.

---

## 6. Storage convention

| Key | Schema | Ghi chú |
|---|---|---|
| `thuchi.transactions.v2` | `Transaction[]` | v1 (deprecated) có thêm field `type: "income" \| "expense"`. Khi đổi schema lần sau, **bump version** thành `v3`, viết hàm migration trong `storage.ts`, không sửa schema in-place. |
| `thuchi.categories.v1` | `Category[]` | Seed lần đầu từ `DEFAULT_CATEGORIES`. |

**SSR safety:** mọi hàm đọc `localStorage` đều check `typeof window !== "undefined"`.

---

## 7. Quy ước (conventions)

- **Tiền tệ:** luôn dùng `formatVND()` từ [src/lib/format.ts](src/lib/format.ts).
- **Locale ngày:** `vi` (date-fns). Format ngày mặc định: `dd/MM/yyyy`.
- **Tuần bắt đầu thứ Hai** (`weekStartsOn: 1` trong date-fns).
- **Validation:** zod schema khai báo cùng file với form.
- **Component file:** mỗi file 1 component default/named export rõ ràng.
- **shadcn Button KHÔNG có `asChild`:** muốn link styled như button → dùng `<Link className="...">` trực tiếp.
- **shadcn Select `onValueChange`** signature là `(value: string | null) => void` — luôn wrap khi setState với fallback (`v ?? "all"`), không truyền thẳng `setState`.
- **Icon palette:** chỉ dùng các icon trong `CATEGORY_ICONS` (đảm bảo `CategoryIcon` map được). Khi thêm icon mới, phải update CẢ `CATEGORY_ICONS` lẫn `ICON_MAP` trong [src/components/category-icon.tsx](src/components/category-icon.tsx).
- **Bỏ dấu tiếng Việt:** dùng `stripDiacritics()` từ `lib/categories.ts` (không tự viết regex). Search và slugify đều dựa vào hàm này.
- **Tránh hydration mismatch:** không gọi `new Date()` / `format(new Date(), ...)` trực tiếp trong JSX của client component được prerender. Phải gate qua `isLoaded` hoặc `useEffect` mount. Charts dùng `next/dynamic({ ssr: false })`.
- **`<body>` có `suppressHydrationWarning`** vì Bitdefender extension chèn attribute (`bis_register`, `__processed_*`) vào DOM trước khi React hydrate.

---

## 8. Roadmap (chưa làm)

- [ ] Pie chart phân bổ chi tiêu theo danh mục
- [ ] Budget tháng theo danh mục + cảnh báo vượt mức
- [ ] Tìm kiếm theo keyword note + khoảng tiền
- [ ] Export CSV/Excel
- [ ] Đồng bộ cloud (Supabase) + multi-device
- [ ] PWA / offline cài đặt như app
- [ ] Recurring expenses (chi tiêu định kỳ)

---

## 9. Đã KHÔNG làm (cố tình)

- ❌ **Thu nhập / số dư** — app chỉ ghi chi tiêu, người dùng đã yêu cầu rõ
- ❌ Backend / API routes
- ❌ Database (chỉ localStorage)
- ❌ Auth / multi-user
- ❌ Test suite (sẽ thêm khi có backend)
- ❌ i18n (chỉ tiếng Việt)
- ❌ Multi-currency

---

## 10. Lịch sử cập nhật

- v0.1 — Khởi tạo plan + tech stack.
- v0.2 — Hoàn thành v1: Dashboard (Thu+Chi+Số dư), trang Giao dịch CRUD, TransactionForm với radio Thu/Chi.
- **v0.3 — Refactor lớn theo yêu cầu user:**
  - Loại bỏ hoàn toàn khái niệm "Thu" (TransactionType, radio chọn loại, tabs filter)
  - Bump storage key `thuchi.transactions.v1` → `v2` (schema không còn `type`)
  - SummaryCards đổi sang **Hôm nay / Tuần này / Tháng này**
  - Thêm **SpendingChart** (recharts BarChart) với tabs Ngày (14 ngày) / Tuần (8 tuần) / Tháng (6 tháng)
  - **Categories trở thành dữ liệu user-CRUD** (storage `thuchi.categories.v1`), thêm hook `useCategories` + trang `/categories` + dialog chọn icon/màu
  - TransactionForm có nút "+ Thêm danh mục" inline (mở CategoryForm, auto-select category mới)
  - Header thêm icon cho từng nav item, brand đổi thành "Sổ Chi Tiêu"
  - Mở rộng palette icon (30 icons) và 12 màu cho category
- **v0.4 — Pie chart + filter nâng cao + cleanup:**
  - Thêm **CategoryPieChart** (donut, tabs Tuần/Tháng/Tất cả, legend dạng progress bar có icon + %)
  - Thêm **TransactionFilters**: search (bỏ dấu tiếng Việt), preset thời gian (Hôm nay/7d/30d/Tuần/Tháng/Tháng trước/Tự chọn), date range tuỳ chỉnh, nút xoá filter
  - `TransactionList` đổi prop từ `filterCategory` sang `filters: ListFilters`, thêm dòng tổng kết "Tìm thấy N · Tổng X"
  - Fix bug hydration mismatch SummaryCards (gate bằng `isLoaded`)
  - Thêm `suppressHydrationWarning` cho `<body>` (chống extension warning)
  - Refactor `stripDiacritics()` dùng chung cho slugify + search normalize
  - Xoá hàm `isSameMonth` không dùng
- **v0.5 — Cloud sync (Supabase):**
  - Thay localStorage bằng **Supabase Postgres** + Auth (Google OAuth)
  - Schema: `transactions` (uuid, user_id, amount, category_id, note, date) + `categories` (text id, user_id, name, icon, color). RLS theo `auth.uid()`. Trigger `on_auth_user_created` seed danh mục mặc định khi user mới đăng ký
  - Files mới: `src/lib/supabase/{client,server}.ts`, `src/middleware.ts` (redirect chưa login → `/login`), `src/hooks/useAuth.tsx`, `src/app/login/page.tsx`, `src/app/auth/callback/route.ts`, `src/components/layout/AppShell.tsx` (ẩn Header trên `/login`), `supabase/schema.sql` (paste vào Supabase SQL Editor)
  - `useTransactions` + `useCategories` refactor sang async (Promise return), query Supabase, optimistic update local state
  - Header có avatar Google + dropdown Đăng xuất
  - ENV: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` (cả local `.env.local` lẫn Vercel project settings)
  - Routes giờ dynamic (server-rendered) vì middleware đọc cookies
  - Dữ liệu localStorage cũ KHÔNG migrate tự động (skip để giảm scope, app mới nhập vài giao dịch test)
