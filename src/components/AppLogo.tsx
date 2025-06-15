import { Milk } from "lucide-react"; // Or a more generic icon if Milk is not available

// Using a generic SVG icon as Milk is not in lucide-react
const MilkIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className="h-8 w-8 text-primary"
  >
    <path d="M8 2h8" />
    <path d="M9 2v proteína3c0 1.1.9 2 2 2h2c1.1 0 2-.9 2-2V2" />
    <path d="M12 12L12 22 M12 12L10 10 M12 12L14 10" />
    <path d="M16.5 7.5C17.9 7.9 19 8.4 19 10c0 2.2-3.1 4-7 4s-7-1.8-7-4c0-1.6 1.1-2.1 2.5-2.5" />
     <path d="M5 10h14" />
  </svg>
);


export function AppLogo({ size = "md" }: { size?: "sm" | "md" | "lg" }) {
  const sizeClasses = {
    sm: "h-6 w-6",
    md: "h-8 w-8",
    lg: "h-10 w-10",
  };
  return (
    <div className="flex items-center space-x-2">
       {/* Using Package icon as a placeholder for a milk carton/product icon */}
      <svg 
        xmlns="http://www.w3.org/2000/svg" 
        width="24" 
        height="24" 
        viewBox="0 0 24 24" 
        fill="none" 
        stroke="currentColor" 
        strokeWidth="2" 
        strokeLinecap="round" 
        strokeLinejoin="round" 
        className={`${sizeClasses[size]} text-primary`}
      >
        <path d="M20.56 10.44 15.3 3.29A2.52 2.52 0 0 0 13.14 2H10.9A2.52 2.52 0 0 0 8.7 3.29L3.44 10.44A2.13 2.13 0 0 0 3 11.79V20a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-8.21a2.13 2.13 0 0 0-.44-1.35Z"/><path d="m3.5 10.5 17 0"/><path d="M12 22V10.5"/>
      </svg>
      <span className={`font-headline font-bold ${size === 'sm' ? 'text-xl' : size === 'md' ? 'text-2xl' : 'text-3xl'} text-primary`}>
        MilkPOS
      </span>
    </div>
  );
}
