import ApiTest from './ApiTest';

export default function MainContainer() {
  return (
    <main className="flex-1 bg-gray-50">
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="px-8 py-4">
          <h2 className="text-2xl font-semibold text-gray-800">Dashboard Overview</h2>
          <p className="text-gray-600 mt-1">Welcome to your dashboard</p>
        </div>
      </header>
      
      <div className="p-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Total Users</p>
                <p className="text-2xl font-bold text-gray-900">1,234</p>
              </div>
              <div className="text-3xl">👥</div>
            </div>
            <p className="text-xs text-green-600 mt-4">+12% from last month</p>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Revenue</p>
                <p className="text-2xl font-bold text-gray-900">$45,678</p>
              </div>
              <div className="text-3xl">💰</div>
            </div>
            <p className="text-xs text-green-600 mt-4">+8% from last month</p>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Orders</p>
                <p className="text-2xl font-bold text-gray-900">89</p>
              </div>
              <div className="text-3xl">📦</div>
            </div>
            <p className="text-xs text-red-600 mt-4">-3% from last month</p>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Conversion Rate</p>
                <p className="text-2xl font-bold text-gray-900">3.2%</p>
              </div>
              <div className="text-3xl">📈</div>
            </div>
            <p className="text-xs text-green-600 mt-4">+1.5% from last month</p>
          </div>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <ApiTest />
          
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Recent Activity</h3>
            <div className="space-y-3">
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded">
                <span className="text-xl">🆕</span>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">New user registered</p>
                  <p className="text-xs text-gray-500">2 minutes ago</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded">
                <span className="text-xl">💳</span>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">Payment received</p>
                  <p className="text-xs text-gray-500">15 minutes ago</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded">
                <span className="text-xl">📦</span>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">Order shipped</p>
                  <p className="text-xs text-gray-500">1 hour ago</p>
                </div>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Quick Actions</h3>
            <div className="grid grid-cols-2 gap-4">
              <button className="p-4 bg-brand-purple text-white rounded-lg hover:bg-brand-purple-hover transition-colors">
                Add New User
              </button>
              <button className="p-4 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors">
                Create Report
              </button>
              <button className="p-4 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors">
                View Analytics
              </button>
              <button className="p-4 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors">
                Manage Products
              </button>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}