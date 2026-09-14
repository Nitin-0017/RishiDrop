import React from 'react';
import rishihoodFullLogo from '../../assets/rishihood-logo.svg';
import rishihoodMarkOnly from '../../assets/rishihood-mark.svg';

export interface RishihoodUniversityLogoProps {
  /** If true, renders only the authentic symbol mark (left shield) */
  markOnly?: boolean;
  /** Predefined size variants */
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  /** Custom additional CSS classes */
  className?: string;
  /** Accessible alt text */
  alt?: string;
}

export const RishihoodUniversityLogo: React.FC<RishihoodUniversityLogoProps> = ({
  markOnly = false,
  size = 'md',
  className = '',
  alt = 'Rishihood University',
}) => {
  // Height sizing mapping
  const heightClasses = {
    xs: markOnly ? 'h-6' : 'h-6',
    sm: markOnly ? 'h-8' : 'h-8',
    md: markOnly ? 'h-10' : 'h-10',
    lg: markOnly ? 'h-12' : 'h-12',
    xl: markOnly ? 'h-16' : 'h-16',
  }[size];

  const src = markOnly ? rishihoodMarkOnly : rishihoodFullLogo;

  return (
    <img
      src={src}
      alt={alt}
      className={`inline-block object-contain shrink-0 select-none ${heightClasses} ${className}`}
      draggable={false}
    />
  );
};

export default RishihoodUniversityLogo;
