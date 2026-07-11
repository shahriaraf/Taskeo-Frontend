"use client";
import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Mail, Lock, User, ArrowRight, Eye, EyeOff } from "lucide-react";
import { authApi } from "@/services/api";
import { useAuthStore } from "@/store/auth.store";
import { Input, Label, Select } from "@/components/ui";
import { Button } from "@/components/ui/button";
import toast from "react-hot-toast";

const schema = z.object({
  name: z.string().min(2, "Name is too short"),
  email: z.string().email("Invalid email"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  role: z.enum(["admin", "project_manager", "team_member"]),
});
type FormData = z.infer<typeof schema>;

export default function SignupPage() {
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
    defaultValues: { role: "team_member" },
  });

  const onSubmit = async (data: FormData) => {
    setLoading(true);
    try {
      const res = await authApi.signup(data);
      const { user, accessToken } = res.data.data!;
      setAuth(user, accessToken);
      toast.success(`Welcome, ${user.name}!`);
      router.push("/dashboard");
    } catch {
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="animate-fade-in">
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
            Create your account
          </h1>
          <p className="text-sm text-[var(--text-muted)]">
            Join Taskeo and start managing projects
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <Label htmlFor="name">Full Name</Label>
            <Input
              id="name"
              placeholder="John Smith"
              icon={<User style={{ width: 14, height: 14 }} />}
              {...register("name")}
              error={errors.name?.message}
            />
          </div>
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
                placeholder="Min 8 characters"
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
          <div>
            <Label htmlFor="role">Role</Label>
            <Select id="role" {...register("role")}>
              <option value="team_member">Team Member</option>
              <option value="project_manager">Project Manager</option>
              <option value="admin">Admin</option>
            </Select>
          </div>

          <Button type="submit" loading={loading} className="w-full mt-2">
            Create Account
            <ArrowRight style={{ width: 14, height: 14 }} />
          </Button>
        </form>
      </div>

      <p className="text-center text-xs text-[var(--text-muted)] mt-5">
        Already have an account?{" "}
        <Link
          href="/login"
          className="text-[var(--accent-blue)] hover:underline font-medium"
        >
          Sign in
        </Link>
      </p>
    </div>
  );
}
