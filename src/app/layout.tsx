import type { Metadata } from 'next'
import './globals.css'
import { Toaster } from 'react-hot-toast'

export const metadata: Metadata = {
  title: 'Instant Video Splitter',
  description: 'Split large video files instantly in your browser — zero upload, zero quality loss.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className="bg-black text-white antialiased min-h-screen">
        {children}
        {/* HIG: Feedback — alerts rare, inline feedback preferred; toasts for confirmations */}
        <Toaster
          position="bottom-center"
          gutter={10}
          toastOptions={{
            duration: 3500,
            style: {
              background: '#2C2C2E',
              color: '#FFFFFF',
              border: '0.5px solid rgba(255,255,255,0.12)',
              borderRadius: '14px',
              fontSize: '15px',
              fontWeight: 500,
              padding: '12px 18px',
              boxShadow: '0 8px 32px rgba(0,0,0,0.6)',
              letterSpacing: '-0.004em',
            },
            success: {
              iconTheme: { primary: '#30D158', secondary: '#2C2C2E' },
            },
            error: {
              iconTheme: { primary: '#FF453A', secondary: '#2C2C2E' },
            },
            loading: {
              iconTheme: { primary: '#0A84FF', secondary: '#2C2C2E' },
            },
          }}
        />
      </body>
    </html>
  )
}
