import React from "react";
import { motion } from "framer-motion";

/**
 * Animated Card Component
 * @param {node} children - Card content
 * @param {string} title - Card title
 * @param {string} subtitle - Card subtitle
 * @param {node} icon - Icon component
 * @param {boolean} hoverable - Enable hover effect
 * @param {function} onClick - Click handler
 * @param {node} actions - Action buttons/elements
 */
const Card = ({
  children,
  title,
  subtitle,
  icon,
  hoverable = false,
  onClick,
  actions,
  className = "",
  gradient = false,
}) => {
  const baseClasses =
    "bg-[#162033] rounded-xl border border-[#1e3048] overflow-hidden";
  const hoverClasses = hoverable
    ? "cursor-pointer hover:border-cyan-500/30 hover:shadow-[0_0_24px_rgba(6,182,212,0.08)] transform hover:-translate-y-1 transition-all duration-300"
    : "";
  const gradientClasses = gradient
    ? "bg-gradient-to-br from-[#162033] to-[#111c2d]"
    : "";

  const cardContent = (
    <>
      {/* Header */}
      {(title || subtitle || icon || actions) && (
        <div
          className={`px-6 py-4 ${gradient ? "bg-gradient-to-r from-[#1a2a40] to-[#162033] border-b border-[#1e3048]" : "border-b border-[#1e3048]"}`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {icon && (
                <div className="p-2 bg-cyan-500/10 border border-cyan-500/20 rounded-lg">
                  {icon}
                </div>
              )}
              <div>
                {title && (
                  <h3 className="text-base font-semibold text-slate-100">
                    {title}
                  </h3>
                )}
                {subtitle && (
                  <p className="text-sm text-slate-500 mt-0.5">{subtitle}</p>
                )}
              </div>
            </div>
            {actions && <div className="flex gap-2">{actions}</div>}
          </div>
        </div>
      )}

      {/* Content */}
      <div className="px-6 py-4">{children}</div>
    </>
  );

  if (hoverable || onClick) {
    return (
      <motion.div
        whileHover={{ scale: 1.01, y: -2 }}
        transition={{ duration: 0.2 }}
        className={`${baseClasses} ${hoverClasses} ${gradientClasses} ${className}`}
        onClick={onClick}
      >
        {cardContent}
      </motion.div>
    );
  }

  return (
    <div className={`${baseClasses} ${gradientClasses} ${className}`}>
      {cardContent}
    </div>
  );
};

export default Card;
