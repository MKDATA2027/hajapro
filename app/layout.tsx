import "@fontsource-variable/manrope";
import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "HAJAPRO | Manage Smarter. Grow Faster.",
  description: "A secure business workspace for tailoring shops, retailers, and their customers.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}