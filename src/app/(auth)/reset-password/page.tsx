// src/app/(auth)/reset-password/page.tsx
"use client";
import React, { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Eye, EyeOff, KeyRound, CheckCircle2 } from "lucide-react";
import toast from "react-hot-toast";
import { authApi } from "@/services/api";

const schema = z
  .object({
    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .regex(/(?=.*[A-Z])/, "Must contain at least one uppercase letter")
      .regex(/(?=.*[0-9])/, "Must contain at least one number"),
    confirmPassword: z.string(),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

type FormData = z.infer<typeof schema>;

export default function ResetPasswordPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [showPass, setShowPass] = useState(false);
  const [done, setDone] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--bg-base)] px-4">
        <div className="text-center">
          <p className="text-[var(--accent-rose)] mb-4">
            Invalid or missing reset link.
          </p>
          <Link
            href="/forgot-password"
            className="text-sm text-[var(--accent-blue)] hover:underline"
          >
            Request a new link
          </Link>
        </div>
      </div>
    );
  }

  const onSubmit = async (data: FormData) => {
    try {
      await authApi.resetPassword(token, data.password);
      setDone(true);
    } catch (err: any) {
      const msg =
        err?.response?.data?.error?.message ??
        "This link is invalid or has expired.";
      toast.error(msg);
    }
  };

  if (done) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--bg-base)] px-4">
        <div className="w-full max-w-md text-center">
          <div className="w-16 h-16 rounded-full bg-emerald-500/10 flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 className="w-8 h-8 text-emerald-400" />
          </div>
          <h1 className="text-2xl font-semibold text-[var(--text-primary)] mb-3">
            Password reset!
          </h1>
          <p className="text-[var(--text-muted)] mb-8">
            Your password has been changed successfully. You can now log in with
            your new password.
          </p>
          <button
            onClick={() => router.push("/login")}
            className="px-6 py-2.5 bg-[var(--accent-blue)] hover:bg-blue-500 text-white rounded-[var(--radius-md)] font-medium text-sm transition-colors"
          >
            Go to login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--bg-base)] px-4">
      <div className="w-full max-w-md">
        <div className="bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-[var(--radius-xl)] p-8">
          <div className="w-12 h-12 rounded-xl bg-[var(--accent-violet-dim)] flex items-center justify-center mb-6">
            <KeyRound className="w-6 h-6 text-[var(--accent-violet)]" />
          </div>

          <h1 className="text-2xl font-semibold text-[var(--text-primary)] mb-2">
            Set new password
          </h1>
          <p className="text-[var(--text-muted)] text-sm mb-8">
            Choose a strong password with at least 8 characters, one uppercase
            letter, and one number.
          </p>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            {/* New password */}
            <div>
              <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1.5">
                New password
              </label>
              <div className="relative">
                <input
                  type={showPass ? "text" : "password"}
                  autoComplete="new-password"
                  placeholder="••••••••"
                  {...register("password")}
                  className="w-full px-4 py-2.5 pr-10 rounded-[var(--radius-md)] bg-[var(--bg-elevated)] border border-[var(--border-default)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--accent-blue)] transition-colors text-sm"
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text-secondary)]"
                >
                  {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.password && (
                <p className="mt-1.5 text-xs text-[var(--accent-rose)]">
                  {errors.password.message}
                </p>
              )}
            </div>

            {/* Confirm password */}
            <div>
              <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1.5">
                Confirm password
              </label>
              <input
                type="password"
                autoComplete="new-password"
                placeholder="••••••••"
                {...register("confirmPassword")}
                className="w-full px-4 py-2.5 rounded-[var(--radius-md)] bg-[var(--bg-elevated)] border border-[var(--border-default)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--accent-blue)] transition-colors text-sm"
              />
              {errors.confirmPassword && (
                <p className="mt-1.5 text-xs text-[var(--accent-rose)]">
                  {errors.confirmPassword.message}
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-2.5 px-4 bg-[var(--accent-blue)] hover:bg-blue-500 text-white rounded-[var(--radius-md)] font-medium text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? "Resetting…" : "Reset password"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
