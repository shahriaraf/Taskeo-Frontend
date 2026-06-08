"use client";
import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Mail, Lock, Zap, ArrowRight } from "lucide-react";
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
  const [demoLoading, setDemoLoading] = useState(false);

  const { register, handleSubmit, setValue, formState: { errors } } = useForm<FormData>({
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

  const handleDemo = async () => {
    setDemoLoading(true);
    setValue("email", "admin@demo.com");
    setValue("password", "Demo@1234");
    try {
      const res = await authApi.login({ email: "admin@demo.com", password: "Demo@1234" });
      const { user, accessToken } = res.data.data!;
      setAuth(user, accessToken);
      toast.success(`Welcome, ${user.name}!`);
      router.push("/dashboard");
    } catch {
      toast.error("Demo login failed. Make sure the backend is running.");
    } finally {
      setDemoLoading(false);
    }
  };

  return (
    <div className="animate-fade-in">
      {/* Logo */}
      <div className="flex items-center justify-center gap-2.5 mb-8">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[var(--accent-blue)] to-[var(--accent-violet)] flex items-center justify-center shadow-lg shadow-blue-500/20">
          <Zap className="w-4.5 h-4.5 text-white" style={{ width: 18, height: 18 }} />
        </div>
        <span className="text-xl font-bold text-[var(--text-primary)]">FlowBoard</span>
      </div>

      <div className="bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-[var(--radius-xl)] p-8 shadow-2xl">
        <div className="mb-6">
          <h1 className="text-xl font-bold text-[var(--text-primary)] mb-1">Sign in to your account</h1>
          <p className="text-sm text-[var(--text-muted)]">Enter your credentials to continue</p>
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
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              icon={<Lock style={{ width: 14, height: 14 }} />}
              {...register("password")}
              error={errors.password?.message}
            />
          </div>

          <Button type="submit" loading={loading} className="w-full mt-2">
            Sign In
            <ArrowRight style={{ width: 14, height: 14 }} />
          </Button>
        </form>

        <div className="relative my-5">
          <div className="h-px bg-[var(--border-subtle)]" />
          <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-[var(--bg-surface)] px-3 text-xs text-[var(--text-muted)]">
            or
          </span>
        </div>

        <Button
          variant="secondary"
          className="w-full"
          onClick={handleDemo}
          loading={demoLoading}
        >
          <Zap style={{ width: 14, height: 14 }} />
          Try Demo Account
        </Button>

        {/* Demo credentials hint */}
        <div className="mt-4 p-3 rounded-[var(--radius-md)] bg-[var(--accent-blue-dim)] border border-blue-500/10">
          <p className="text-xs text-[var(--text-muted)] mb-1.5 font-medium">Demo credentials</p>
          <div className="space-y-0.5 text-xs font-mono text-blue-400">
            <p>admin@demo.com / Demo@1234</p>
            <p>pm@demo.com / Demo@1234</p>
            <p>john@demo.com / Demo@1234</p>
          </div>
        </div>
      </div>

      <p className="text-center text-xs text-[var(--text-muted)] mt-5">
        Don&apos;t have an account?{" "}
        <Link href="/signup" className="text-[var(--accent-blue)] hover:underline font-medium">
          Create one
        </Link>
      </p>
    </div>
  );
}
