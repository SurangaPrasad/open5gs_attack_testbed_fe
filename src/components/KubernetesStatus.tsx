'use client';

import { useState, useEffect } from 'react';

interface Pod {
  name: string;
  namespace: string;
  containers: string[];
  status: string;
}

interface Container {
  name: string;
  pod: string;
  namespace: string;
  image: string;
}

export default function KubernetesStatus() {
  const [pods, setPods] = useState<Pod[]>([]);
  const [containers, setContainers] = useState<Container[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [podsResponse, containersResponse] = await Promise.all([
          fetch('http://100.123.47.114:8081/pods'),
          fetch('http://100.123.47.114:8081/containers')
        ]);

        if (!podsResponse.ok || !containersResponse.ok) {
          throw new Error('Failed to fetch data');
        }

        const podsData = await podsResponse.json();
        const containersData = await containersResponse.json();

        setPods(podsData.pods);
        setContainers(containersData.containers);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    // Refresh data every 30 seconds
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
        Error: {error}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Pods Section */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-4 py-5 sm:px-6">
          <h3 className="text-lg font-medium leading-6 text-gray-900">Kubernetes Pods</h3>
        </div>
        <div className="border-t border-gray-200">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Namespace</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Containers</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {pods.map((pod) => (
                  <tr key={`${pod.namespace}-${pod.name}`}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{pod.name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{pod.namespace}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                        ${pod.status === 'Running' ? 'bg-green-100 text-green-800' : 
                          pod.status === 'Pending' ? 'bg-yellow-100 text-yellow-800' : 
                          pod.status === 'Failed' ? 'bg-red-100 text-red-800' : 
                          'bg-gray-100 text-gray-800'}`}>
                        {pod.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {pod.containers.join(', ')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Containers Section */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-4 py-5 sm:px-6">
          <h3 className="text-lg font-medium leading-6 text-gray-900">Containers</h3>
        </div>
        <div className="border-t border-gray-200">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Pod</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Namespace</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Image</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {containers.map((container) => (
                  <tr key={`${container.namespace}-${container.pod}-${container.name}`}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{container.name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{container.pod}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{container.namespace}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{container.image}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
} 