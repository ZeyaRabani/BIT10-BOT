import '@/styles/globals.css'
import { cn, constructMetadata } from '@/lib/utils'

export const metadata = constructMetadata();

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang='en' suppressHydrationWarning>
      <body className={cn('min-h-screen bg-background antialiased font-dm-sans tracking-wide')}>
        <main>
          {children}
        </main>
      </body>
    </html>
  );
}
