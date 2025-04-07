import NetworkStatus from '@/components/NetworkStatus';

export default function KubernetesPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Network Status</h1>
      <NetworkStatus />
    </div>
  );
} 