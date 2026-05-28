import React from "react";
import { motion } from "framer-motion";

/**
 * Badge Component
 * @param {string} variant - Badge style: success, danger, warning, info, default
 * @param {string} size - Badge size: sm, md, lg
 * @param {node} children - Badge content
 * @param {node} icon - Icon component
 * @param {boolean} dot - Show dot indicator
 * @param {boolean} pulse - Pulse animation
 */
const Badge = ({
  variant = "default",
  size = "md",
  children,
  icon,
  dot = false,
  pulse = false,
  className = "",
}) => {
  const variantClasses = {
    success: "bg-emerald-500/10 text-emerald-400 border-emerald-500/25",
    danger: "bg-red-500/10 text-red-400 border-red-500/25",
    warning: "bg-amber-500/10 text-amber-400 border-amber-500/25",
    info: "bg-cyan-500/10 text-cyan-400 border-cyan-500/25",
    default: "bg-slate-700/50 text-slate-300 border-slate-600/40",
    purple: "bg-violet-500/10 text-violet-400 border-violet-500/25",
    pink: "bg-pink-500/10 text-pink-400 border-pink-500/25",
    indigo: "bg-indigo-500/10 text-indigo-400 border-indigo-500/25",
  };

  const sizeClasses = {
    sm: "text-xs px-2 py-0.5",
    md: "text-sm px-3 py-1",
    lg: "text-base px-4 py-1.5",
  };

  const badgeContent = (
    <span
      className={`inline-flex items-center gap-1.5 font-semibold rounded-full border ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
    >
      {dot && (
        <span
          className={`w-2 h-2 rounded-full ${pulse ? "animate-pulse" : ""} ${variant === "success" ? "bg-green-500" : variant === "danger" ? "bg-red-500" : variant === "warning" ? "bg-yellow-500" : "bg-blue-500"}`}
        />
      )}
      {icon && icon}
      {children}
    </span>
  );

  if (pulse && !dot) {
    return (
      <motion.div
        animate={{ scale: [1, 1.05, 1] }}
        transition={{
          duration: 1.5,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        className="inline-block"
      >
        {badgeContent}
      </motion.div>
    );
  }

  return badgeContent;
};

export default Badge;
