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
    "font-semibold rounded-xl transition-all duration-200 flex items-center justify-center gap-2 focus:outline-none focus:ring-2 focus:ring-offset-2 leading-none";

  const variantClasses = {
    primary:
      "bg-admin-600 hover:bg-admin-700 text-white focus:ring-admin-500 shadow-panel",
    secondary:
      "bg-admin-100 hover:bg-admin-200 text-admin-800 focus:ring-admin-400 border border-admin-200",
    success:
      "bg-mint-600 hover:bg-mint-700 text-white focus:ring-mint-500 shadow-panel",
    danger:
      "bg-red-600 hover:bg-red-700 text-white focus:ring-red-500 shadow-panel",
    warning:
      "bg-amber-500 hover:bg-amber-600 text-white focus:ring-amber-500 shadow-panel",
    ghost:
      "bg-transparent hover:bg-admin-50 text-admin-700 border border-admin-200 focus:ring-admin-400",
    outline:
      "bg-transparent hover:bg-admin-50 text-admin-700 border border-admin-300 focus:ring-admin-500",
  };

  const sizeClasses = {
    sm: "px-3 py-2 text-xs",
    md: "px-4 py-2.5 text-sm",
    lg: "px-5 py-3 text-base",
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
      whileHover={!disabled && !loading ? { scale: 1.01, y: -1 } : {}}
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
