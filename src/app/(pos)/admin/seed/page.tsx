'use client';

import { useState } from 'react';
import { toast } from 'sonner';

export default function SeedPage() {
  const [loading, setLoading] = useState(false);
  const [tableResult, setTableResult] = useState<any>(null);
  const [menuResult, setMenuResult] = useState<any>(null);

  const seedTables = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/admin/seed-tables', {
        method: 'POST',
      });
      const data = await response.json();
      
      if (response.ok) {
        setTableResult(data);
        toast.success(data.message || 'Tables seeded successfully!');
      } else {
        toast.error(data.error || 'Failed to seed tables');
      }
    } catch (error) {
      toast.error('Error seeding tables');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const seedMenu = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/admin/seed-menu', {
        method: 'POST',
      });
      const data = await response.json();
      
      if (response.ok) {
        setMenuResult(data);
        toast.success(data.message || 'Menu seeded successfully!');
      } else {
        toast.error(data.error || 'Failed to seed menu');
      }
    } catch (error) {
      toast.error('Error seeding menu');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-8 max-w-4xl">
      <div className="bg-white rounded-lg shadow-lg p-8">
        <h1 className="text-3xl font-bold mb-2">🌱 Production Data Seeding</h1>
        <p className="text-gray-600 mb-8">
          Initialize your production database with tables and sample menu items.
          <br />
          <span className="text-sm text-orange-600">⚠️ Admin access required</span>
        </p>

        <div className="space-y-6">
          {/* Tables Section */}
          <div className="border-2 border-gray-200 rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-3 flex items-center gap-2">
              📋 Seed Tables
            </h2>
            <p className="text-gray-600 mb-4 text-sm">
              Creates 10 tables (Table 1-10) with different capacities.
              If tables already exist, this will skip creation.
            </p>
            <button
              onClick={seedTables}
              disabled={loading}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? 'Processing...' : '🚀 Seed Tables'}
            </button>

            {tableResult && (
              <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                <h3 className="font-semibold text-green-800 mb-2">✅ Result:</h3>
                <pre className="text-sm text-gray-700 whitespace-pre-wrap">
                  {JSON.stringify(tableResult, null, 2)}
                </pre>
              </div>
            )}
          </div>

          {/* Menu Section */}
          <div className="border-2 border-gray-200 rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-3 flex items-center gap-2">
              🍽️ Seed Sample Menu
            </h2>
            <p className="text-gray-600 mb-4 text-sm">
              Creates ~22 sample menu items across different categories.
              You can add more items later through the Menu Management UI.
              If menu items already exist, this will skip creation.
            </p>
            <button
              onClick={seedMenu}
              disabled={loading}
              className="bg-orange-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? 'Processing...' : '🚀 Seed Menu Items'}
            </button>

            {menuResult && (
              <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                <h3 className="font-semibold text-green-800 mb-2">✅ Result:</h3>
                <pre className="text-sm text-gray-700 whitespace-pre-wrap">
                  {JSON.stringify(menuResult, null, 2)}
                </pre>
              </div>
            )}
          </div>

          {/* Instructions */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
            <h3 className="font-semibold text-blue-800 mb-2">📖 Next Steps:</h3>
            <ol className="list-decimal list-inside space-y-2 text-sm text-gray-700">
              <li>Click &quot;Seed Tables&quot; to create 10 tables</li>
              <li>Click &quot;Seed Menu Items&quot; to add sample menu</li>
              <li>Go to Dashboard to start taking orders</li>
              <li>Use Menu Management to add/edit more items</li>
              <li>Tables will appear on the dashboard once created</li>
            </ol>
          </div>

          {/* Warning */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
            <h3 className="font-semibold text-yellow-800 mb-2">⚠️ Important:</h3>
            <ul className="list-disc list-inside space-y-1 text-sm text-gray-700">
              <li>This page is for initial setup only</li>
              <li>Seeding is safe - it won&apos;t overwrite existing data</li>
              <li>Only ADMIN users can access this functionality</li>
              <li>You can delete this page after initial setup</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
