import { motion } from "framer-motion";
import { ReactNode } from "react";
import { cn } from "../../lib/utils";

interface PageWrapperProps {
  children: ReactNode;
  className?: string;
  centered?: boolean;
}

export function PageWrapper({ children, className, centered }: PageWrapperProps) {
  return (
    <motion.main
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 8 }}
      transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
      className={cn(
        "flex flex-1 flex-col p-6 md:p-10",
        centered && "items-center justify-center min-h-[calc(100vh-3.5rem)]",
        className
      )}
    >
      {children}
    </motion.main>
  );
}
