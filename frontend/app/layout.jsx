import "./globals.css"
import NavSidebar from "@/components/NavSidebar"
import { ThemeProvider } from "next-themes"
import { AuthProvider } from '@/context/AuthProvider'
import { GoogleOAuthProvider } from '@react-oauth/google'
import { Toaster } from "react-hot-toast";
import ClientLayout from '@/components/ClientLayout'
import { SocketProvider } from "@/context/SocketContext"

const CLIENT_ID = "313874713382-8r9f2svhb64doe19c9vqelegun8dnpao.apps.googleusercontent.com"

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
        >
          <GoogleOAuthProvider clientId={CLIENT_ID}>
            <AuthProvider>
              <SocketProvider>
                <Toaster toastOptions={{ style: { zIndex: 9999 } }} />
                <ClientLayout>{children}</ClientLayout>
              </SocketProvider>
            </AuthProvider>
          </GoogleOAuthProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
