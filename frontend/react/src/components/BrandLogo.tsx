type BrandLogoProps = {
  variant?: 'dark' | 'light' | 'auto' | 'inverse';
  className?: string;
  alt?: string;
};

export default function BrandLogo({ variant = 'auto', className = '', alt = 'PlatOne' }: BrandLogoProps) {
  if (variant === 'auto') {
    return (
      <span className="inline-flex items-center justify-center">
        <img
          src="/Logo - Preto.svg"
          alt={alt}
          className={`${className} show-in-light`}
          decoding="async"
          draggable={false}
        />
        <img
          src="/Logo - Branca.svg"
          alt={alt}
          className={`${className} show-in-dark`}
          decoding="async"
          draggable={false}
        />
      </span>
    );
  }

  if (variant === 'inverse') {
    return (
      <span className="inline-flex items-center justify-center">
        <img
          src="/Logo - Branca.svg"
          alt={alt}
          className={`${className} show-in-light`}
          decoding="async"
          draggable={false}
        />
        <img
          src="/Logo - Preto.svg"
          alt={alt}
          className={`${className} show-in-dark`}
          decoding="async"
          draggable={false}
        />
      </span>
    );
  }

  return (
    <img
      src={variant === 'light' ? '/Logo - Branca.svg' : '/Logo - Preto.svg'}
      alt={alt}
      className={className}
      decoding="async"
      draggable={false}
    />
  );
}