import "./globals.css";
import { Inter } from "next/font/google";
import Header from "../components/Header"
import { ClerkProvider } from "@clerk/nextjs";
import { Toaster } from "sonner";

const inter = Inter({ subsets: ["latin"] })

export const metadata = {
  title: "Vihiql",
  discription: "Find Your Dream Car"
}

export default function RootLayout({ children }) {
  return (
    <ClerkProvider>
    <html lang="en">
      <body className={`${inter.className}`}>
        <Header></Header>
        <main className="min-h-screen">{children}</main>
        <Toaster rich/>
        <footer className="bg-blue-50 py-12">
          <div className="container mx-auto px-4 text-center text-gray-600">
            <p>This is Footer</p>
          </div>
        </footer>
      </body>
    </html>
    </ClerkProvider>
  );
}
