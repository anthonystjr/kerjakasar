import "./globals.css";

export const metadata = {
  title: "KerjaKasar",
  description: "Platform pencari kerja nonformal",
};

export default function RootLayout({ children }) {
  return (
    <html lang="id">
      <body>{children}</body>
    </html>
  );
}