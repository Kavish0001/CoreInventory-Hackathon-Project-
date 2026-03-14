export default function LoadingSpinner({ size = 'md' }) {
  const SIZE_MAP = { sm: 'h-4 w-4', md: 'h-6 w-6', lg: 'h-10 w-10' };
  return (
    <div className="flex items-center justify-center">
      <div className={`${SIZE_MAP[size]} animate-spin rounded-full border-2 border-border border-t-primary`} />
    </div>
  );
}
