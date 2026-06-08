import type { Metadata } from "next";
import { Toaster } from "react-hot-toast";
import "./globals.css";
import { Providers } from "./providers";
import { ThemeProvider } from "@/components/providers/theme-provider";

export const metadata: Metadata = {
  title: "Taskeo — Smart Project & Task Management",
  description: "A production-grade project management system for modern teams.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <ThemeProvider>
          <Providers>
            {children}
            <Toaster
              position="top-right"
              toastOptions={{
                style: {
                  background: "var(--bg-elevated)",
                  color: "var(--text-primary)",
                  border: "1px solid var(--border-default)",
                  fontSize: "13px",
                  fontFamily: "'Plus Jakarta Sans', sans-serif",
                },
                success: { iconTheme: { primary: "#34d399", secondary: "#0c0e14" } },
                error: { iconTheme: { primary: "#f87171", secondary: "#0c0e14" } },
              }}
            />
          </Providers>
        </ThemeProvider>

      </body>
    </html>
  );
}
