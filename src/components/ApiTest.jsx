import { useState, useEffect } from 'react';
import { apiHelpers } from '../config/api';

export default function ApiTest() {
  const [healthStatus, setHealthStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    checkApiHealth();
  }, []);

  const checkApiHealth = async () => {
    try {
      setLoading(true);
      setError(null);
      const health = await apiHelpers.checkHealth();
      setHealthStatus(health);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 bg-white rounded-lg shadow">
      <h3 className="text-lg font-semibold text-gray-800 mb-4">API Connection Status</h3>
      
      {loading && (
        <div className="flex items-center">
          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-brand-purple mr-3"></div>
          <span className="text-gray-600">Checking API connection...</span>
        </div>
      )}
      
      {error && (
        <div className="bg-red-50 border border-red-300 rounded p-4">
          <p className="text-red-800">
            <span className="font-semibold">Connection Error:</span> {error}
          </p>
          <p className="text-sm text-red-600 mt-2">
            API Base URL: {import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1'}
          </p>
        </div>
      )}
      
      {healthStatus && !loading && (
        <div className="space-y-4">
          <div className={`p-4 rounded ${
            healthStatus.status === 'healthy' ? 'bg-green-50 border border-green-300' : 'bg-yellow-50 border border-yellow-300'
          }`}>
            <p className="font-semibold text-gray-800">
              Status: <span className={healthStatus.status === 'healthy' ? 'text-green-600' : 'text-yellow-600'}>
                {healthStatus.status}
              </span>
            </p>
            <p className="text-sm text-gray-600 mt-1">
              Environment: {healthStatus.environment}
            </p>
            <p className="text-sm text-gray-600">
              Version: {healthStatus.version}
            </p>
          </div>
          
          <div className="space-y-2">
            <h4 className="font-semibold text-gray-700">Services:</h4>
            {healthStatus.services?.map((service, index) => (
              <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                <span className="text-sm font-medium text-gray-700">{service.service}</span>
                <div className="flex items-center gap-2">
                  <span className={`text-sm ${
                    service.status === 'healthy' ? 'text-green-600' : 
                    service.status === 'degraded' ? 'text-yellow-600' : 'text-red-600'
                  }`}>
                    {service.status}
                  </span>
                  {service.latency_ms && (
                    <span className="text-xs text-gray-500">
                      ({service.latency_ms.toFixed(1)}ms)
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      
      <button
        onClick={checkApiHealth}
        className="mt-4 px-4 py-2 bg-brand-purple text-white rounded hover:bg-brand-purple-hover transition-colors"
        disabled={loading}
      >
        Refresh Status
      </button>
    </div>
  );
}