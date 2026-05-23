import Link from "next/link";
import { Bot, ShieldCheck } from "lucide-react";

export function PublicHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/90 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
        <Link href="/" className="flex items-center gap-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Bot className="h-4 w-4" />
          </span>
          <span className="font-semibold tracking-tight">AI ERP OS</span>
        </Link>
        <nav className="hidden items-center gap-6 text-sm text-muted-foreground md:flex">
          <Link href="/#features" className="hover:text-foreground">
            Features
          </Link>
          <Link href="/#industries" className="hover:text-foreground">
            Industries
          </Link>
          <Link href="/pricing" className="hover:text-foreground">
            Pricing
          </Link>
          <Link href="/book-demo" className="hover:text-foreground">
            Book demo
          </Link>
        </nav>
        <div className="flex items-center gap-2">
          <Link
            href="/login"
            className="hidden rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground sm:inline-flex"
          >
            Sign in
          </Link>
          <Link
            href="/book-demo"
            className="inline-flex h-9 items-center rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground shadow-sm hover:opacity-90"
          >
            Book Demo
          </Link>
        </div>
      </div>
    </header>
  );
}

export function PublicFooter() {
  return (
    <footer className="border-t border-border bg-card">
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-10 sm:px-6 md:grid-cols-[1.4fr_1fr_1fr]">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Bot className="h-4 w-4" />
            </span>
            <span className="font-semibold tracking-tight">AI ERP OS</span>
          </div>
          <p className="mt-3 max-w-md text-sm text-muted-foreground">
            AI-powered workflow and finance operating system for growing Indian businesses.
          </p>
          <div className="mt-4 inline-flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-xs text-muted-foreground">
            <ShieldCheck className="h-4 w-4 text-success" />
            Built for RBAC, auditability, tenant isolation, and finance controls.
          </div>
        </div>
        <div className="grid gap-2 text-sm">
          <p className="font-medium">Product</p>
          <Link href="/#features" className="text-muted-foreground hover:text-foreground">
            Features
          </Link>
          <Link href="/pricing" className="text-muted-foreground hover:text-foreground">
            Pricing
          </Link>
          <Link href="/book-demo" className="text-muted-foreground hover:text-foreground">
            Book Demo
          </Link>
        </div>
        <div className="grid gap-2 text-sm">
          <p className="font-medium">Use cases</p>
          <span className="text-muted-foreground">Workflow approvals</span>
          <span className="text-muted-foreground">Finance intelligence</span>
          <span className="text-muted-foreground">Audit and compliance</span>
        </div>
      </div>
      <div className="border-t border-border px-4 py-4 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} AI ERP OS. Enterprise SaaS for workflow, finance, and compliance operations.
      </div>
    </footer>
  );
}

export function PublicPageShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <PublicHeader />
      {children}
      <PublicFooter />
    </div>
  );
}
