// src/app/(auth)/forgot-password/page.tsx
"use client";
import React, { useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ArrowLeft, Mail, CheckCircle2 } from "lucide-react";
import toast from "react-hot-toast";
import { authApi } from "@/services/api";

const schema = z.object({
  email: z.string().email("Please enter a valid email address"),
});
type FormData = z.infer<typeof schema>;

export default function ForgotPasswordPage() {
  const [sent, setSent] = useState(false);
  const [submittedEmail, setSubmittedEmail] = useState("");

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  const onSubmit = async (data: FormData) => {
    try {
      await authApi.forgotPassword(data.email);
      setSubmittedEmail(data.email);
      setSent(true);
    } catch {
      toast.error("Something went wrong. Please try again.");
    }
  };

  if (sent) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--bg-base)] px-4">
        <div className="w-full max-w-md text-center">
          <div className="w-16 h-16 rounded-full bg-emerald-500/10 flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 className="w-8 h-8 text-emerald-400" />
          </div>
          <h1 className="text-2xl font-semibold text-[var(--text-primary)] mb-3">
            Check your inbox
          </h1>
          <p className="text-[var(--text-muted)] mb-2">
            We sent a password reset link to
          </p>
          <p className="font-medium text-[var(--text-primary)] mb-6">
            {submittedEmail}
          </p>
          <p className="text-sm text-[var(--text-muted)] mb-8">
            The link expires in 1 hour. Check your spam folder if you do not
            see it.
          </p>
          <Link
            href="/login"
            className="inline-flex items-center gap-2 text-sm text-[var(--accent-blue)] hover:underline"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--bg-base)] px-4">
      <div className="w-full max-w-md">
        {/* Back link */}
        <Link
          href="/login"
          className="inline-flex items-center gap-2 text-sm text-[var(--text-muted)] hover:text-[var(--text-primary)] mb-8 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to login
        </Link>

        {/* Card */}
        <div className="bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-[var(--radius-xl)] p-8">
          <div className="w-12 h-12 rounded-xl bg-[var(--accent-blue-dim)] flex items-center justify-center mb-6">
            <Mail className="w-6 h-6 text-[var(--accent-blue)]" />
          </div>

          <h1 className="text-2xl font-semibold text-[var(--text-primary)] mb-2">
            Forgot your password?
          </h1>
          <p className="text-[var(--text-muted)] text-sm mb-8">
            Enter your email address and we will send you a link to reset your
            password.
          </p>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1.5">
                Email address
              </label>
              <input
                type="email"
                autoComplete="email"
                placeholder="you@example.com"
                {...register("email")}
                className="w-full px-4 py-2.5 rounded-[var(--radius-md)] bg-[var(--bg-elevated)] border border-[var(--border-default)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--accent-blue)] transition-colors text-sm"
              />
              {errors.email && (
                <p className="mt-1.5 text-xs text-[var(--accent-rose)]">
                  {errors.email.message}
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-2.5 px-4 bg-[var(--accent-blue)] hover:bg-blue-500 text-white rounded-[var(--radius-md)] font-medium text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? "Sending…" : "Send reset link"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
