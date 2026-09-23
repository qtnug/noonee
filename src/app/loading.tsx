import HypotrochoidLoader from '@/components/HypotrochoidLoader';

export default function Loading() {
  return (
    <HypotrochoidLoader
      fullScreen
      size={140}
      label="Đang tải..."
    />
  );
}
