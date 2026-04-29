"use client";

import { useState } from "react";
import { Mail, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sendMagicLink = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setError(null);
    setLoading(true);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });
    setLoading(false);
    if (error) {
      setError(error.message);
    } else {
      setSent(true);
    }
  };

  return (
    <div className="flex min-h-[80vh] items-center justify-center px-4">
      <Card className="w-full max-w-sm">
        <CardHeader className="flex flex-col items-center gap-3 pt-8">
          <div className="flex size-12 items-center justify-center rounded-full bg-violet-100 text-violet-600 dark:bg-violet-950/40">
            <Wallet className="size-6" />
          </div>
          <div className="text-center">
            <h1 className="text-xl font-semibold">Sổ Chi Tiêu</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Đăng nhập để đồng bộ chi tiêu trên mọi thiết bị
            </p>
          </div>
        </CardHeader>
        <CardContent className="space-y-4 pb-8">
          {sent ? (
            <div className="rounded-md border bg-emerald-50 dark:bg-emerald-950/30 p-4 text-center space-y-2">
              <Mail className="size-6 mx-auto text-emerald-600" />
              <div className="text-sm font-medium">Đã gửi link đăng nhập!</div>
              <p className="text-xs text-muted-foreground">
                Mở email <span className="font-medium">{email}</span> và bấm vào link để đăng nhập.
                Có thể nằm trong mục Spam.
              </p>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSent(false);
                  setEmail("");
                }}
                className="mt-2"
              >
                Gửi lại với email khác
              </Button>
            </div>
          ) : (
            <form onSubmit={sendMagicLink} className="space-y-3">
              <div className="space-y-1.5">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="ban@gmail.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoFocus
                />
              </div>
              <Button type="submit" disabled={loading} className="w-full gap-2">
                <Mail className="size-4" />
                {loading ? "Đang gửi..." : "Gửi link đăng nhập"}
              </Button>
              {error && (
                <p className="text-xs text-rose-600 text-center">{error}</p>
              )}
            </form>
          )}
          <p className="text-xs text-muted-foreground text-center pt-2">
            Lần đầu đăng nhập sẽ tự tạo tài khoản. Dữ liệu của bạn được bảo mật riêng.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
