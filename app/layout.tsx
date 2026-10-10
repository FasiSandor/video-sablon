import type { Metadata } from "next";
import "./globals.css";
export const metadata: Metadata = { title: "VIDEO SABLON | Klipstúdió", description: "Látványos zenés klipek néhány kattintással." };
export default function RootLayout({children}:{children:React.ReactNode}) { return <html lang="hu"><body>{children}</body></html> }
