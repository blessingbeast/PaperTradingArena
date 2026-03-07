import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Home, Users, ShoppingCart, BarChart3, Settings, Server, Shield } from 'lucide-react';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen w-full bg-background dark:bg-black overflow-hidden relative">
      <nav className="fixed inset-y-0 left-0 z-10 w-64 border-r border-border/50 bg-background/80 backdrop-blur-xl hidden md:block">
        <div className="flex h-16 shrink-0 items-center px-6 border-b border-border/50">
           <Shield className="h-6 w-6 text-primary mr-2" />
          <span className="text-lg font-bold bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent">
            Admin Console
          </span>
        </div>
        
        <div className="flex flex-col flex-1 p-4 space-y-2 overflow-y-auto">
            <Link href="/admin">
                <Button variant="ghost" className="w-full justify-start hover:bg-muted/50 rounded-xl">
                    <Home className="mr-3 h-4 w-4 text-muted-foreground" />
                    Dashboard
                </Button>
            </Link>
            
            <Link href="/admin/users">
                <Button variant="ghost" className="w-full justify-start hover:bg-muted/50 rounded-xl">
                    <Users className="mr-3 h-4 w-4 text-muted-foreground" />
                    Users
                </Button>
            </Link>
            
            <Link href="/admin/orders">
                <Button variant="ghost" className="w-full justify-start hover:bg-muted/50 rounded-xl">
                    <ShoppingCart className="mr-3 h-4 w-4 text-muted-foreground" />
                    Global Orders
                </Button>
            </Link>
            
            <Link href="/admin/positions">
                <Button variant="ghost" className="w-full justify-start hover:bg-muted/50 rounded-xl">
                    <BarChart3 className="mr-3 h-4 w-4 text-muted-foreground" />
                    Positions
                </Button>
            </Link>
            
            <Link href="/admin/market">
                <Button variant="ghost" className="w-full justify-start hover:bg-muted/50 rounded-xl">
                    <Settings className="mr-3 h-4 w-4 text-muted-foreground" />
                    Market Control
                </Button>
            </Link>

            <Link href="/admin/system">
                <Button variant="ghost" className="w-full justify-start hover:bg-muted/50 rounded-xl">
                    <Server className="mr-3 h-4 w-4 text-muted-foreground" />
                    System Stats
                </Button>
            </Link>
            
            <Link href="/admin/logs">
                <Button variant="ghost" className="w-full justify-start hover:bg-muted/50 rounded-xl mt-4 border border-border/50">
                    <Shield className="mr-3 h-4 w-4 text-primary" />
                    Audit Logs
                </Button>
            </Link>

            <div className="mt-auto pt-8">
               <Link href="/dashboard">
                <Button variant="outline" className="w-full justify-center rounded-xl bg-secondary/50 hover:bg-secondary">
                    Exit Admin Mode
                </Button>
              </Link>
            </div>
        </div>
      </nav>

      <main className="flex-1 md:pl-64 z-10 relative">
        <div className="h-full p-8 lg:p-12 max-w-7xl mx-auto space-y-8 pb-16">
          {children}
        </div>
      </main>
    </div>
  );
}
