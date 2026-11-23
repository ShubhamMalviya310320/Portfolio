import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Shubham Malviya — Software Engineer",
  description: "Software engineer focused on text engines, compiler tooling, binary systems, and the foundations beneath complex software.",
  openGraph: {
    title: "Shubham Malviya — I build to understand.",
    description: "Engineering, ideas, and creative work by Shubham Malviya.",
    type: "website",
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
