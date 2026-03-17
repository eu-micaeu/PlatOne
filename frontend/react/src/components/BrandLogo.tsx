type BrandLogoProps = {
  variant?: 'dark' | 'light';
  className?: string;
  alt?: string;
};

const LOGO_SOURCE = {
  dark: '/Logo - Preto.svg',
  light: '/Logo - Branca.svg',
} as const;

export default function BrandLogo({ variant = 'dark', className = '', alt = 'PlatOne' }: BrandLogoProps) {
  return (
    <img
      src={LOGO_SOURCE[variant]}
      alt={alt}
      className={className}
      decoding="async"
      draggable={false}
    />
  );
}