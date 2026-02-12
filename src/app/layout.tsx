import '@/styles/globals.css'
import { cn, constructMetadata } from '@/lib/utils'
import Providers from './_provider/Providers';
import { Toaster } from "@/components/ui/sonner";

export const metadata = constructMetadata();

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang='en' suppressHydrationWarning>
      <body className={cn('min-h-screen bg-background antialiased font-dm-sans tracking-wide')}>
        <Providers>
          {children}
          <Toaster />
        </Providers>
      </body>
    </html>
  );
}
