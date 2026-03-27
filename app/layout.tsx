import type { Metadata } from "next";
import type { ReactNode } from "react";

import "./globals.css";

export const metadata: Metadata = {
  title: "TeachMeGTM",
  description: "Internal dashboard for TeachMeGTM mock X intent analysis and audience recipe generation."
};

export default function RootLayout({
  children
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="font-sans antialiased">
        <div className="mx-auto min-h-screen max-w-[1500px] px-4 py-8 sm:px-6 lg:px-8">{children}</div>
      </body>
    </html>
  );
}
