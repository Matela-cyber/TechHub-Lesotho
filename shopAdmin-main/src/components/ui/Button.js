import React from "react";
import { motion } from "framer-motion";

/**
 * Animated Button Component
 * @param {string} variant - Button style: primary, secondary, success, danger, warning, ghost
 * @param {string} size - Button size: sm, md, lg
 * @param {boolean} loading - Loading state
 * @param {boolean} disabled - Disabled state
 * @param {node} children - Button content
 * @param {node} icon - Icon component
 * @param {string} iconPosition - Icon position: left or right
 */
const Button = ({
  variant = "primary",
  size = "md",
  loading = false,
  disabled = false,
  children,
  icon,
  iconPosition = "left",
  fullWidth = false,
  onClick,
  type = "button",
  className = "",
}) => {
  const baseClasses =
    "font-semibold rounded-lg transition-all duration-200 flex items-center justify-center gap-2 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-offset-[#111c2d]";

  const variantClasses = {
    primary:
      "bg-cyan-600 hover:bg-cyan-500 text-white focus:ring-cyan-500 border border-cyan-500/30 shadow-[0_0_12px_rgba(6,182,212,0.15)]",
    secondary:
      "bg-slate-700 hover:bg-slate-600 text-slate-100 focus:ring-slate-500 border border-slate-600",
    success:
      "bg-emerald-700 hover:bg-emerald-600 text-white focus:ring-emerald-500 border border-emerald-600/40",
    danger:
      "bg-red-700 hover:bg-red-600 text-white focus:ring-red-500 border border-red-600/40",
    warning:
      "bg-amber-600 hover:bg-amber-500 text-white focus:ring-amber-500 border border-amber-500/40",
    ghost:
      "bg-transparent hover:bg-slate-700/50 text-slate-300 border border-slate-600/60 focus:ring-slate-500",
    outline:
      "bg-transparent hover:bg-cyan-500/10 text-cyan-400 border border-cyan-500/40 focus:ring-cyan-500",
  };

  const sizeClasses = {
    sm: "px-3 py-1.5 text-sm",
    md: "px-4 py-2 text-base",
    lg: "px-6 py-3 text-lg",
  };

  const disabledClasses = "opacity-50 cursor-not-allowed";
  const loadingClasses = "cursor-wait";

  const buttonClasses = `
    ${baseClasses}
    ${variantClasses[variant]}
    ${sizeClasses[size]}
    ${disabled || loading ? disabledClasses : ""}
    ${loading ? loadingClasses : ""}
    ${fullWidth ? "w-full" : ""}
    ${className}
  `;

  return (
    <motion.button
      whileHover={!disabled && !loading ? { scale: 1.02, y: -1 } : {}}
      whileTap={!disabled && !loading ? { scale: 0.98 } : {}}
      transition={{ duration: 0.1 }}
      type={type}
      className={buttonClasses}
      onClick={onClick}
      disabled={disabled || loading}
    >
      {loading && (
        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
      )}
      {!loading && icon && iconPosition === "left" && icon}
      {children}
      {!loading && icon && iconPosition === "right" && icon}
    </motion.button>
  );
};

export default Button;
