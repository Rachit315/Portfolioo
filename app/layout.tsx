import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Analytics } from "@vercel/analytics/react";
import localFont from "next/font/local";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const nothingFont = localFont({
  src: "../nothing-font.otf",
  variable: "--font-nothing",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://www.northofzero.dev"),
  icons: {
    icon: "/Logo%20(1).png",
    shortcut: "/Logo%20(1).png",
    apple: "/Logo%20(1).png",
  },
  title: {
    default: "Rachit Thakur",
    template: "%s",
  },
  description:
    "Product Designer at North of Zero specializing in Design Engineering, Product building, and Interaction Design. Based in India, studying B.Tech in Data Science.",
  keywords: [
    "Rachit Thakur",
    "Product Designer",
    "Design Engineer",
    "North of Zero",
    "UI UX Designer",
    "Interaction Design",
    "Frontend Engineering",
    "Design Portfolio",
  ],
  authors: [{ name: "Rachit Thakur", url: "https://x.com/RachitThakur146" }],
  creator: "Rachit Thakur",
  publisher: "Rachit Thakur",
  openGraph: {
    title: "Rachit Thakur — Product Designer & Design Engineer",
    description:
      "Product Designer at North of Zero. Crafting interactions, design engineering, and product experiences.",
    url: "https://www.northofzero.dev",
    siteName: "Rachit Thakur Portfolio",
    locale: "en_US",
    type: "website",
    images: [
      {
        url: "/Profile.png",
        width: 1200,
        height: 630,
        alt: "Rachit Thakur - Product Designer",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Rachit Thakur — Product Designer & Design Engineer",
    description:
      "Product Designer at North of Zero. Specializing in Design Engineering and Product building.",
    creator: "@RachitThakur146",
    images: ["/Profile.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  alternates: {
    canonical: "https://www.northofzero.dev",
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "Person",
  name: "Rachit Thakur",
  jobTitle: "Product Designer",
  description:
    "Product Designer at North of Zero specializing in Design Engineering, Product building, and Interaction Design.",
  url: "https://www.northofzero.dev",
  worksFor: {
    "@type": "Organization",
    name: "North of Zero",
    url: "https://www.northofzero.dev/",
  },
  sameAs: [
    "https://github.com/Rachit315",
    "https://www.linkedin.com/in/rachit-thakur007/",
    "https://x.com/RachitThakur146",
  ],
  knowsAbout: [
    "Product Design",
    "Design Engineering",
    "Interaction Design",
    "UI/UX Design",
    "Frontend Development",
    "Data Science",
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} ${nothingFont.variable} h-full antialiased`}
    >
      <head>
        <link rel="icon" href="/Logo%20(1).png" type="image/png" />
        <script
          dangerouslySetInnerHTML={{
            __html: `(() => { let prevTitle = document.title; document.addEventListener("visibilitychange", () => { if (document.hidden) { prevTitle = document.title; document.title = "Bored of me???"; } else { document.title = prevTitle; } }); })();`,
          }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className="min-h-full flex flex-col">
        {children}
        <Analytics />
      </body>
    </html>
  );
}
