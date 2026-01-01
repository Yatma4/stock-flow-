import { cn } from '@/lib/utils';
import { LucideIcon } from 'lucide-react';
import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  variant?: 'default' | 'primary' | 'success' | 'warning' | 'danger';
  className?: string;
  index?: number;
  onClick?: () => void;
}

const variantStyles = {
  default: 'bg-card',
  primary: 'bg-primary/5 border-primary/20',
  success: 'bg-success/5 border-success/20',
  warning: 'bg-warning/5 border-warning/20',
  danger: 'bg-destructive/5 border-destructive/20',
};

const iconStyles = {
  default: 'bg-secondary text-foreground',
  primary: 'bg-primary/10 text-primary',
  success: 'bg-success/10 text-success',
  warning: 'bg-warning/10 text-warning',
  danger: 'bg-destructive/10 text-destructive',
};

const pulseColors = {
  default: 'bg-foreground/20',
  primary: 'bg-primary/40',
  success: 'bg-success/40',
  warning: 'bg-warning/40',
  danger: 'bg-destructive/40',
};

function AnimatedNumber({ value }: { value: string | number }) {
  const [displayValue, setDisplayValue] = useState<string | number>(typeof value === 'number' ? 0 : value);
  
  useEffect(() => {
    if (typeof value === 'number') {
      const duration = 1500;
      const steps = 60;
      const stepValue = value / steps;
      let current = 0;
      
      const timer = setInterval(() => {
        current += stepValue;
        if (current >= value) {
          setDisplayValue(value);
          clearInterval(timer);
        } else {
          setDisplayValue(Math.floor(current));
        }
      }, duration / steps);
      
      return () => clearInterval(timer);
    } else {
      setDisplayValue(value);
    }
  }, [value]);
  
  return <>{typeof displayValue === 'number' ? displayValue.toLocaleString() : displayValue}</>;
}

export function StatCard({
  title,
  value,
  icon: Icon,
  trend,
  variant = 'default',
  className,
  index = 0,
  onClick,
}: StatCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ 
        duration: 0.5, 
        delay: index * 0.1,
        ease: [0.25, 0.46, 0.45, 0.94]
      }}
      whileHover={{ 
        scale: 1.02, 
        y: -4,
        transition: { duration: 0.2 }
      }}
      onClick={onClick}
      className={cn(
        'relative overflow-hidden rounded-xl border p-5 shadow-card transition-shadow duration-300 hover:shadow-card-hover cursor-pointer group',
        variantStyles[variant],
        className
      )}
    >
      {/* Live pulse indicator */}
      <motion.div
        className={cn(
          'absolute top-3 right-3 h-2 w-2 rounded-full',
          pulseColors[variant]
        )}
        animate={{
          scale: [1, 1.5, 1],
          opacity: [0.7, 0.3, 0.7],
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />

      {/* Subtle gradient overlay on hover */}
      <div className="absolute inset-0 bg-gradient-to-br from-transparent via-transparent to-primary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

      <div className="relative flex items-start justify-between">
        <div className="space-y-2">
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <p className="text-2xl font-bold text-foreground">
            <AnimatedNumber value={value} />
          </p>
          {trend && (
            <motion.div 
              className="flex items-center gap-1"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 + 0.5 }}
            >
              <motion.span
                className={cn(
                  'text-xs font-medium flex items-center gap-0.5',
                  trend.isPositive ? 'text-success' : 'text-destructive'
                )}
                animate={{ 
                  y: trend.isPositive ? [0, -2, 0] : [0, 2, 0] 
                }}
                transition={{ 
                  duration: 2, 
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
              >
                {trend.isPositive ? '↑' : '↓'}
                {trend.isPositive ? '+' : ''}
                {trend.value}%
              </motion.span>
              <span className="text-xs text-muted-foreground">vs mois dernier</span>
            </motion.div>
          )}
        </div>
        <motion.div
          className={cn(
            'flex h-11 w-11 items-center justify-center rounded-lg',
            iconStyles[variant]
          )}
          whileHover={{ rotate: 5 }}
          transition={{ type: "spring", stiffness: 300 }}
        >
          <Icon className="h-5 w-5" />
        </motion.div>
      </div>
    </motion.div>
  );
}
