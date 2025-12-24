"use client";

import { useStore } from "@/store/useStore";
import { motion, AnimatePresence } from "framer-motion";

export function LoadingOverlay() {
  const { isLoading, loadingMessage } = useStore();

  return (
    <AnimatePresence>
      {isLoading && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center bg-background/90 backdrop-blur-sm"
        >
          <div className="flex flex-col items-center gap-8">
            {/* Animated blocks */}
            <div className="flex gap-2">
              {[0, 1, 2, 3].map((i) => (
                <motion.div
                  key={i}
                  className="w-4 h-16 bg-accent"
                  animate={{
                    scaleY: [1, 2, 1],
                    opacity: [0.5, 1, 0.5],
                  }}
                  transition={{
                    duration: 0.6,
                    repeat: Infinity,
                    delay: i * 0.15,
                  }}
                />
              ))}
            </div>

            {/* Loading message */}
            <motion.p
              className="text-2xl md:text-4xl font-bold uppercase tracking-widest text-foreground"
              animate={{ opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 1.5, repeat: Infinity }}
            >
              {loadingMessage || "PROCESSING..."}
            </motion.p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

