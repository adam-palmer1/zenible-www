import React from 'react';

interface LazyImageProps extends Omit<React.ImgHTMLAttributes<HTMLImageElement>, 'src'> {
  src: string;
  /**
   * If `true` (default), also serve a `.webp` alongside the original.
   * The `.webp` must exist at the same path with the `.webp` extension swapped in.
   * Set to `false` for SVG / already-optimized sources.
   */
  webp?: boolean;
  /**
   * Loading hint — defaults to `lazy` since most landing-page images are below the fold.
   * Pass `eager` for above-the-fold hero images.
   */
  loading?: 'lazy' | 'eager';
}

/**
 * Wraps `<img>` in a `<picture>` with a WebP source when available.
 * Browsers pick WebP when supported; older browsers fall back to the original format.
 *
 * Landing-page PNGs are co-located with WebP variants via a build-time conversion;
 * this component makes callers opt in by pointing to the canonical (PNG) path.
 */
const LazyImage: React.FC<LazyImageProps> = ({
  src,
  webp = true,
  loading = 'lazy',
  alt = '',
  ...rest
}) => {
  const webpSrc = webp && /\.(png|jpe?g)$/i.test(src)
    ? src.replace(/\.(png|jpe?g)$/i, '.webp')
    : null;

  const img = <img src={src} alt={alt} loading={loading} decoding="async" {...rest} />;

  if (!webpSrc) return img;

  return (
    <picture>
      <source srcSet={webpSrc} type="image/webp" />
      {img}
    </picture>
  );
};

export default LazyImage;
