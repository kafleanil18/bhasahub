import './BrandLogo.css';

export default function BrandLogo({ tone = 'auto', decorative = false, className = '' }) {
  return <span className={`brand-art ${className}`} data-tone={tone} role={decorative ? undefined : 'img'} aria-label={decorative ? undefined : 'Xiao Ao · Chinese Made Simple'} aria-hidden={decorative ? true : undefined}>
    <img className="brand-art-light" src="/brand/xiao-ao-horizontal.svg" alt="" aria-hidden="true" width="1115" height="400" decoding="async" />
    <img className="brand-art-dark" src="/brand/xiao-ao-horizontal-dark.svg" alt="" aria-hidden="true" width="1115" height="400" decoding="async" />
  </span>;
}
