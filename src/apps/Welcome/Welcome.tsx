/**
 * Welcome Screen - Premium Futuristic App Store
 * Advanced application launcher with neon effects and optimized performance
 */

import React from "react";
import { motion } from "framer-motion";
import Ticker from "@/components/widgets/Ticker/Ticker.tsx";

/**
 * Premium Welcome Screen Component
 */
function Welcome(): React.ReactElement {
  return (
    <motion.div
      className="relative h-full w-full overflow-y-auto bg-background"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
	    
	    <Ticker />
    </motion.div>
  );
}

export default Welcome;
