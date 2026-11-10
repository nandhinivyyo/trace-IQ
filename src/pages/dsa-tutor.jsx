import { motion } from "framer-motion";
import DsaTutorContainer from "@/components/ui/dsa-tutor/dsa-tutor-container";

export function DsaTutorPage() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 5 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className="flex h-[calc(100vh-3.5rem)] w-full flex-col bg-[var(--color-canvas)] text-[var(--color-text-primary)] overflow-hidden"
    >
      <DsaTutorContainer />
    </motion.div>
  );
}
