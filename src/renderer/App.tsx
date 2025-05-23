import React from 'react';

console.log('App.tsx loading...');

const App: React.FC = () => {
  console.log('App component rendering...');
  
  return (
    <div style={{ 
      padding: '20px', 
      fontFamily: 'Arial, sans-serif',
      background: 'linear-gradient(135deg, #f0f9ff 0%, #fdf4ff 100%)',
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    }}>
      <div style={{
        background: 'white',
        padding: '40px',
        borderRadius: '20px',
        boxShadow: '0 10px 40px rgba(0,0,0,0.1)',
        textAlign: 'center',
        maxWidth: '500px'
      }}>
        <h1 style={{ 
          color: '#0ea5e9', 
          marginBottom: '20px',
          fontSize: '2.5rem'
        }}>
          🎉 Aerotage Time Reporting
        </h1>
        <p style={{ 
          color: '#64748b', 
          fontSize: '1.2rem',
          marginBottom: '30px'
        }}>
          React app is working successfully!
        </p>
        <div style={{
          background: '#f0f9ff',
          padding: '20px',
          borderRadius: '10px',
          border: '2px solid #0ea5e9'
        }}>
          <p style={{ margin: 0, color: '#0369a1', fontWeight: 'bold' }}>
            ✅ Electron + React + TypeScript + Webpack
          </p>
        </div>
      </div>
    </div>
  );
};

export default App; 