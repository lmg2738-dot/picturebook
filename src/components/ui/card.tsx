import { type ReactNode } from "react";

interface CardProps {
  children: ReactNode;
  className?: string;
  padding?: "sm" | "md" | "lg";
}

const paddings = {
  sm: "p-5",
  md: "p-8",
  lg: "p-10",
};

export function Card({ children, className = "", padding = "md" }: CardProps) {
  return (
    <div className={`card-premium rounded-2xl ${paddings[padding]} ${className}`}>
      {children}
    </div>
  );
}
