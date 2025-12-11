'use client';

import React, { ReactNode } from 'react';
import { motion } from 'framer-motion';

interface AnimatedCardProps {
  children: ReactNode;
  delay?: number;
  className?: string;
  onClick?: () => void;
}

export default function AnimatedCard({
  children,
  delay = 0,
  className = '',
  onClick,
}: AnimatedCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      whileInView={{ opacity: 1, y: 0, scale: 1 }}
      viewport={{ once: true, margin: '-50px' }}
      transition={{
        duration: 0.5,
        delay,
        ease: [0.22, 1, 0.36, 1],
      }}
      whileHover={{
        y: -8,
        transition: { duration: 0.2 },
      }}
      onClick={onClick}
      className={className}
    >
      {children}
    </motion.div>
  );
}


