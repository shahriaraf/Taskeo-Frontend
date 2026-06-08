"use client";
import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Mail, Lock, User, Zap, ArrowRight } from "lucide-react";
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

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
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
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[var(--accent-blue)] to-[var(--accent-violet)] flex items-center justify-center shadow-lg">
          <Zap style={{ width: 18, height: 18 }} className="text-white" />
        </div>
        <span className="text-xl font-bold text-[var(--text-primary)]">FlowBoard</span>
      </div>

      <div className="bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-[var(--radius-xl)] p-8 shadow-2xl">
        <div className="mb-6">
          <h1 className="text-xl font-bold text-[var(--text-primary)] mb-1">Create your account</h1>
          <p className="text-sm text-[var(--text-muted)]">Join FlowBoard and start managing projects</p>
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
            <Input
              id="password"
              type="password"
              placeholder="Min 8 characters"
              icon={<Lock style={{ width: 14, height: 14 }} />}
              {...register("password")}
              error={errors.password?.message}
            />
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
        <Link href="/login" className="text-[var(--accent-blue)] hover:underline font-medium">
          Sign in
        </Link>
      </p>
    </div>
  );
}
