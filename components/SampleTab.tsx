import { motion } from 'motion/react';

export default function SampleTab() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="flex h-[calc(100vh-4rem)] items-center justify-center"
    >
      <div className="text-center">
        <div className="mb-6 inline-flex h-20 w-20 items-center justify-center rounded-2xl bg-[#38bdf8]/10 text-[#38bdf8]">
          <span className="text-4xl">👋</span>
        </div>
        <h2 className="font-syne text-4xl font-extrabold text-white">Welcome to EduLens</h2>
        <p className="mt-4 font-instrument text-lg text-[#64748b]">
          This is your initial sample tab. Navigate through the sidebar to explore the platform.
        </p>
      </div>
    </motion.div>
  );
}
