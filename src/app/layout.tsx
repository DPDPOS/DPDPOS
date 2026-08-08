import type { Metadata } from "next";
import { Providers } from "@/lib/api/providers";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "DPDPOS",
    template: "%s · DPDPOS",
  },
  description:
    "DPDPOS — Digital Personal Data Protection Operating System. Build, validate, and operate a DPDP Act 2023 compliance programme.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
