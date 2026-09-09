import React from 'react';

interface BrandLogoProps {
  collapsed?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const BrandLogo: React.FC<BrandLogoProps> = ({
  collapsed = false,
  size = 'md',
  className = ''
}) => {
  if (collapsed) {
    const iconDimensions =
      size === 'sm' ? 'w-8 h-8' : size === 'lg' ? 'w-12 h-12' : 'w-10 h-10';
    return (
      <div className={`flex items-center justify-center select-none ${className}`}>
        <img
          src="/logo-icon.png"
          alt="SKYRONET TECHNOLOGY"
          className={`${iconDimensions} object-contain transition-transform duration-200 hover:scale-105`}
        />
      </div>
    );
  }

  const fullHeight =
    size === 'sm' ? 'h-8' : size === 'lg' ? 'h-14' : 'h-10';

  return (
    <div className={`flex items-center select-none overflow-hidden ${className}`}>
      <img
        src="/logo.png"
        alt="SKYRONET TECHNOLOGY"
        className={`${fullHeight} w-auto object-contain transition-transform duration-200 hover:scale-102`}
      />
    </div>
  );
};




