import React from 'react';
import { RishihoodUniversityLogo } from './RishihoodUniversityLogo';

export interface RishihoodLogoProps {
  variant?: 'full' | 'compact' | 'mark-only' | 'horizontal';
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  subtitle?: string;
  showSubtitle?: boolean;
}

/**
 * Rishihood University Brand + CampusDrop Product Header Component
 *
 * Keeps the official authentic Rishihood University logo untouched,
 * and renders CampusDrop product labeling clearly and cleanly beside or below it.
 */
export const RishihoodLogo: React.FC<RishihoodLogoProps> = ({
  variant = 'full',
  size = 'md',
  className = '',
  subtitle = 'University Parcel Hub',
  showSubtitle = true,
}) => {
  if (variant === 'mark-only') {
    return <RishihoodUniversityLogo markOnly size={size} className={className} />;
  }

  if (variant === 'compact') {
    return (
      <div className={`inline-flex items-center space-x-2.5 ${className}`}>
        <RishihoodUniversityLogo markOnly size={size === 'md' ? 'sm' : size} />
        <div className="flex flex-col">
          <span className="text-[10px] font-black tracking-wider uppercase text-[#A6192E] leading-none">
            RISHIHOOD
          </span>
          <span className="text-xs font-bold text-[#172033] tracking-tight leading-tight mt-0.5">
            RishiDrop
          </span>
        </div>
      </div>
    );
  }

  // Full & Horizontal branding: Authentic Rishihood University Logo + RishiDrop product identifier
  return (
    <div className={`inline-flex flex-col ${className}`}>
      <div className="flex items-center space-x-3">
        <RishihoodUniversityLogo size={size === 'sm' ? 'sm' : 'md'} />
      </div>
      {showSubtitle && subtitle && (
        <div className="text-[11px] font-semibold text-[#A6192E] tracking-tight mt-1 pl-0.5">
          RishiDrop • {subtitle}
        </div>
      )}
    </div>
  );
};

export { RishihoodUniversityLogo };
export default RishihoodLogo;
