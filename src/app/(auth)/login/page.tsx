"use client";
import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Mail, Lock, ArrowRight, Eye, EyeOff } from "lucide-react";
import { authApi } from "@/services/api";
import { useAuthStore } from "@/store/auth.store";
import { Input, Label } from "@/components/ui";
import { Button } from "@/components/ui/button";
import toast from "react-hot-toast";

const schema = z.object({
  email: z.string().email("Invalid email"),
  password: z.string().min(1, "Password is required"),
});
type FormData = z.infer<typeof schema>;

export default function LoginPage() {
  const router = useRouter();
  const { setAuth } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: FormData) => {
    setLoading(true);
    try {
      const res = await authApi.login(data);
      const { user, accessToken } = res.data.data!;
      setAuth(user, accessToken);
      toast.success(`Welcome back, ${user.name}!`);
      router.push("/dashboard");
    } catch {
      // error handled by interceptor
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="animate-fade-in">
      {/* Logo */}
      <div className="flex items-center justify-center gap-2.5 mb-8">
        <svg
          style={{ width: 40, height: 40 }}
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 100 100"
          fill="currentColor"
        >
          <polygon points="22,22 60,22 44,44 22,44" />
          <rect x="63" y="22" width="22" height="22" />
          <polygon points="44,50 63,44 63,80 44,80" />
        </svg>
        <span className="text-xl font-bold text-[var(--text-primary)]">
          Taskeo
        </span>
      </div>

      <div className="bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-[var(--radius-xl)] p-8 shadow-2xl">
        <div className="mb-6">
          <h1 className="text-xl font-bold text-[var(--text-primary)] mb-1">
            Sign in to your account
          </h1>
          <p className="text-sm text-[var(--text-muted)]">
            Enter your credentials to continue
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="you@example.com"
              icon={<Mail style={{ width: 14, height: 14 }} />}
              {...register("email")}
              error={errors.email?.message}
            />
          </div>
          <div>
            <Label htmlFor="password">Password</Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                icon={<Lock style={{ width: 14, height: 14 }} />}
                {...register("password")}
                error={errors.password?.message}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text-secondary)] transition-colors"
                tabIndex={-1}
              >
                {showPassword ? (
                  <EyeOff style={{ width: 16, height: 16 }} />
                ) : (
                  <Eye style={{ width: 16, height: 16 }} />
                )}
              </button>
            </div>
          </div>

          <Button type="submit" loading={loading} className="w-full mt-2">
            Sign In
            <ArrowRight style={{ width: 14, height: 14 }} />
          </Button>
        </form>
      </div>

      <p className="text-center text-xs text-[var(--text-muted)] mt-5">
        Don&apos;t have an account?{" "}
        <Link
          href="/signup"
          className="text-[var(--accent-blue)] hover:underline font-medium"
        >
          Create one
        </Link>
      </p>
    </div>
  );
}
