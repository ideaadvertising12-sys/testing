
"use client";

import { cn } from "@/lib/utils";
import Image from "next/image";

interface AppLogoProps {
  size?: "sm" | "md" | "lg" | "iconOnly";
  className?: string; // Allow custom classes to be passed
}

export function AppLogo({ size = "md", className }: AppLogoProps) {
  const sizeMap = {
    sm: { class: "h-6 w-6", textClass: "text-xl", width: 24, height: 24 },
    md: { class: "h-8 w-8", textClass: "text-2xl", width: 32, height: 32 },
    lg: { class: "h-10 w-10", textClass: "text-3xl", width: 40, height: 40 },
    iconOnly: { class: "h-7 w-7", textClass: "hidden", width: 28, height: 28 },
  };

  const { 
    class: sizeClass, 
    textClass, 
    width, 
    height 
  } = sizeMap[size];

  const logoImage = (
    <Image
      src="/logo.png"
      alt="N Group Products Logo"
      width={width}
      height={height}
      className="object-contain"
      priority // Ensures the logo loads quickly, especially on the login page
    />
  );

  return (
    <div className={cn("flex items-center space-x-2", className)}>
      <div className={cn(sizeClass)}>
        {logoImage}
      </div>
      {size !== 'iconOnly' && (
        <span 
          className={cn(
              `font-headline font-bold text-primary app-logo-text`,
              textClass
          )}
        >
          N Group Products
        </span>
      )}
    </div>
  );
}
