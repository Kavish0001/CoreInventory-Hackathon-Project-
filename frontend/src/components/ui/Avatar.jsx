export default function Avatar({ name, size = 'md' }) {
  const initial = name ? name.charAt(0).toUpperCase() : '?';
  const SIZE_MAP = {
    sm: 'w-7 h-7 text-xs',
    md: 'w-9 h-9 text-sm',
    lg: 'w-11 h-11 text-base',
  };

  return (
    <div className={`${SIZE_MAP[size]} rounded-full bg-primary text-white flex items-center justify-center font-bold shrink-0`}>
      {initial}
    </div>
  );
}
