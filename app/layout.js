import "./globals.css";

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://kerjakasar.vercel.app";

export const metadata = {
  metadataBase: new URL(BASE_URL),
  title: {
    default: "KerjaKasar — Platform Kerja Nonformal",
    template: "%s | KerjaKasar",
  },
  description:
    "Temukan fotografer, MC, programmer lepas, dekorator, dan talent nonformal lainnya. Gratis, cepat, langsung terhubung.",
  keywords: [
    "kerja nonformal",
    "freelance Indonesia",
    "cari fotografer",
    "cari MC",
    "platform freelance",
    "kerja lepas Surabaya",
  ],
  authors: [{ name: "KerjaKasar" }],
  creator: "KerjaKasar",
  openGraph: {
    type: "website",
    locale: "id_ID",
    url: BASE_URL,
    siteName: "KerjaKasar",
    title: "KerjaKasar — Platform Kerja Nonformal",
    description:
      "Hubungkan dirimu dengan klien yang butuh fotografer, MC, programmer, dekorator, dan lebih banyak lagi — semuanya gratis.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "KerjaKasar — Platform Kerja Nonformal",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "KerjaKasar — Platform Kerja Nonformal",
    description:
      "Temukan talent nonformal terbaik di sekitarmu. Fotografer, MC, programmer, dan banyak lagi.",
    images: ["/og-image.png"],
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="id">
      <body>{children}</body>
    </html>
  );
}