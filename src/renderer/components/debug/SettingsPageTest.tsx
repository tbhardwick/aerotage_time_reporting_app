import React from 'react';

export const SettingsPageTest: React.FC = () => {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">🧪 Minimal Settings Test Page</h1>
      
      <div className="p-4 bg-green-50 border border-green-200 rounded-md mb-4">
        <h3 className="font-semibold text-green-800 mb-2">✅ Success!</h3>
        <p className="text-green-700">
          If you can see this page, it means navigation to Settings works fine. 
          The issue is likely with the ProfileSettings component making API calls.
        </p>
      </div>

      <div className="p-4 bg-blue-50 border border-blue-200 rounded-md mb-4">
        <h3 className="font-semibold text-blue-800 mb-2">🔍 What this tells us:</h3>
        <ul className="text-blue-700 text-sm space-y-1">
          <li>• Navigation to /settings works</li>
          <li>• ProtectedRoute is not the issue</li>
          <li>• The problem is in ProfileSettings component</li>
          <li>• Specifically, it's the useUserProfile hook calling profileApi.getUserProfile()</li>
        </ul>
      </div>

      <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-md">
        <h3 className="font-semibold text-yellow-800 mb-2">🛠️ Next Steps:</h3>
        <p className="text-yellow-700 text-sm">
          We need to check why the debug flag isn't working or if there's another logout trigger.
        </p>
      </div>
    </div>
  );
}; 