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
    success: "bg-mint-50 text-mint-800 border-mint-200",
    danger: "bg-red-50 text-red-700 border-red-200",
    warning: "bg-amber-50 text-amber-700 border-amber-200",
    info: "bg-admin-50 text-admin-700 border-admin-200",
    default: "bg-slate-100 text-slate-700 border-slate-200",
    purple: "bg-violet-50 text-violet-700 border-violet-200",
    pink: "bg-rose-50 text-rose-700 border-rose-200",
    indigo: "bg-indigo-50 text-indigo-700 border-indigo-200",
  };

  const sizeClasses = {
    sm: "text-[11px] px-2.5 py-1",
    md: "text-xs px-3 py-1.5",
    lg: "text-sm px-4 py-2",
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
