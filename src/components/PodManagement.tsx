'use client';

import { useState, useEffect } from 'react';

interface Pod {
  name: string;
  namespace: string;
  containers: string[];
  status: string;
}

interface NetworkStatus {
  pods: Pod[];
}

export default function PodManagement() {
  const [binningUsers, setBinningUsers] = useState<Pod[]>([]);
  const [attackingUsers, setAttackingUsers] = useState<Pod[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [selectedMSISDN, setSelectedMSISDN] = useState('0000000001');
  const [isCreating, setIsCreating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isRunningTraffic, setIsRunningTraffic] = useState(false);
  const [isStoppingTraffic, setIsStoppingTraffic] = useState(false);
  const [runningTrafficPod, setRunningTrafficPod] = useState<string | null>(null);

  // Generate MSISDN options
  const msisdnOptions = Array.from({ length: 10 }, (_, i) => 
    String(i + 1).padStart(10, '0')
  );

  useEffect(() => {
    fetchExistingPods();
  }, []);

  const fetchExistingPods = async () => {
    try {
      const [accessResponse] = await Promise.all([
        fetch('http://100.123.47.114:8081/access-network'),
      ]);

      if (!accessResponse.ok) {
        throw new Error('Failed to fetch data');
      }

      const accessData = await accessResponse.json();
      
      // Filter pods into binning and attacking users (only UE pods)
      setBinningUsers(accessData.pods.filter((pod: Pod) => 
        pod.name.includes('binning') && pod.name.includes('-ues-')
      ));
      setAttackingUsers(accessData.pods.filter((pod: Pod) => 
        pod.name.includes('attacking') && pod.name.includes('-ues-')
      ));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const createPod = async (type: 'binning' | 'attacking') => {
    setIsCreating(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const response = await fetch('http://100.123.47.114:8081/install-ueransim', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          deploymentName: `ueransim-gnb-${type}`,
          initialMSISDN: selectedMSISDN,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create pod');
      }

      setSuccessMessage(`${type.charAt(0).toUpperCase() + type.slice(1)} user created successfully`);
      fetchExistingPods(); // Refresh the list
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create pod');
    } finally {
      setIsCreating(false);
    }
  };

  const deletePod = async (podName: string) => {
    setIsDeleting(true);
    setError(null);
    setSuccessMessage(null);

    try {
      // Extract the deployment name from the pod name
      const deploymentName = podName.split('-ues-')[0];
      
      const response = await fetch('http://100.123.47.114:8081/uninstall-ueransim', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          deploymentName: deploymentName,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to delete pod');
      }

      setSuccessMessage('User deleted successfully');
      fetchExistingPods(); // Refresh the list
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete pod');
    } finally {
      setIsDeleting(false);
    }
  };

  const runTrafficTest = async (podName: string) => {
    setIsRunningTraffic(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const response = await fetch('http://100.123.47.114:8081/run-traffic-test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          podName: podName,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to run traffic test');
      }

      setSuccessMessage('Traffic test started successfully');
      setRunningTrafficPod(podName);
      fetchExistingPods(); // Refresh the list
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to run traffic test');
    } finally {
      setIsRunningTraffic(false);
    }
  };

  const stopTrafficTest = async (podName: string) => {
    setIsStoppingTraffic(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const response = await fetch('http://100.123.47.114:8081/stop-traffic-test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          podName: podName,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to stop traffic test');
      }

      setSuccessMessage('Traffic test stopped successfully');
      setRunningTrafficPod(null);
      fetchExistingPods(); // Refresh the list
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to stop traffic test');
    } finally {
      setIsStoppingTraffic(false);
    }
  };

  const PodTable = ({ pods, title, showTrafficButton = false }: { pods: Pod[]; title: string; showTrafficButton?: boolean }) => (
    <div className="bg-white rounded-lg shadow">
      <div className="px-4 py-5 sm:px-6">
        <h3 className="text-lg font-medium leading-6 text-gray-900">{title}</h3>
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
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
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
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 space-x-4">
                    {showTrafficButton && (
                      <>
                        {runningTrafficPod === pod.name ? (
                          <button
                            onClick={() => stopTrafficTest(pod.name)}
                            disabled={isStoppingTraffic}
                            className="text-orange-600 hover:text-orange-900 disabled:opacity-50"
                          >
                            {isStoppingTraffic ? 'Stopping...' : 'Stop Traffic'}
                          </button>
                        ) : (
                          <button
                            onClick={() => runTrafficTest(pod.name)}
                            disabled={isRunningTraffic}
                            className="text-blue-600 hover:text-blue-900 disabled:opacity-50"
                          >
                            {isRunningTraffic ? 'Running...' : 'Run Traffic'}
                          </button>
                        )}
                      </>
                    )}
                    <button
                      onClick={() => deletePod(pod.name)}
                      disabled={isDeleting}
                      className="text-red-600 hover:text-red-900 disabled:opacity-50"
                    >
                      {isDeleting ? 'Deleting...' : 'Delete'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Create New User Form */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-medium text-gray-900 mb-4">Create New User</h2>
        <div className="space-y-4">
          <div>
            <label htmlFor="msisdn" className="block text-sm font-medium text-gray-700">
              MSISDN
            </label>
            <select
              id="msisdn"
              value={selectedMSISDN}
              onChange={(e) => setSelectedMSISDN(e.target.value)}
              className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
            >
              {msisdnOptions.map((msisdn) => (
                <option key={msisdn} value={msisdn}>
                  {msisdn}
                </option>
              ))}
            </select>
          </div>
          <div className="flex space-x-4">
            <button
              onClick={() => createPod('binning')}
              disabled={isCreating}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
            >
              {isCreating ? 'Creating...' : 'Create Binning User'}
            </button>
            <button
              onClick={() => createPod('attacking')}
              disabled={isCreating}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50"
            >
              {isCreating ? 'Creating...' : 'Create Attacking User'}
            </button>
          </div>
        </div>
      </div>

      {/* Status Messages */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
          Error: {error}
        </div>
      )}
      {successMessage && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-green-700">
          {successMessage}
        </div>
      )}

      {/* Existing Users */}
      <PodTable pods={binningUsers} title="Existing Binning Users" showTrafficButton={true} />
      <PodTable pods={attackingUsers} title="Existing Attacking Users" />
    </div>
  );
} 