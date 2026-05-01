import { cn } from "@/lib/utils";

type Props = {
  children: React.ReactNode;
  className?: string;
  /** Tailwind max-width on the inner wrapper */
  maxWidthClass?: string;
};

/** Consistent horizontal padding + max width for `/dashboard/*` content using shadcn theme. */
export function DashboardPage({ children, className, maxWidthClass = "max-w-[min(100%,88rem)]" }: Props) {
  return <div className={cn("mx-auto w-full px-3 py-3 sm:px-5 sm:py-4", maxWidthClass, className)}>{children}</div>;
}
