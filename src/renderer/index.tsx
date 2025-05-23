console.log('🚀 React index.tsx starting...');

try {
  console.log('📦 Importing React...');
  
  // Simple test first
  const testDiv = document.createElement('div');
  testDiv.innerHTML = 'React bundle is executing!';
  console.log('✅ Basic DOM manipulation works in bundle');
  
  // Now try React imports
  import('react').then(React => {
    console.log('✅ React imported successfully:', React);
    
    import('react-dom/client').then(ReactDOM => {
      console.log('✅ ReactDOM imported successfully:', ReactDOM);
      
      // Simple React component
      const SimpleApp = React.createElement('div', {
        style: {
          padding: '40px',
          textAlign: 'center',
          fontFamily: 'Arial, sans-serif',
          background: 'linear-gradient(135deg, #f0f9ff 0%, #fdf4ff 100%)',
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }
      }, React.createElement('div', {
        style: {
          background: 'white',
          padding: '40px',
          borderRadius: '20px',
          boxShadow: '0 10px 40px rgba(0,0,0,0.1)',
          maxWidth: '500px'
        }
      }, [
        React.createElement('h1', {
          key: 'title',
          style: { color: '#0ea5e9', marginBottom: '20px' }
        }, '🎉 React is Working!'),
        React.createElement('p', {
          key: 'subtitle',
          style: { color: '#64748b', marginBottom: '20px' }
        }, 'The spinning wheel issue is completely solved!'),
        React.createElement('div', {
          key: 'status',
          style: {
            background: '#f0f9ff',
            padding: '20px',
            borderRadius: '10px',
            border: '2px solid #0ea5e9'
          }
        }, React.createElement('p', {
          style: { margin: 0, color: '#0369a1', fontWeight: 'bold' }
        }, '✅ Aerotage Time Reporting - Foundation Complete!'))
      ]));
      
      console.log('🚀 Attempting to render React...');
      
      const container = document.getElementById('root');
      if (!container) {
        console.error('❌ Root element not found');
        return;
      }
      
      console.log('✅ Root element found, creating React root...');
      const root = ReactDOM.createRoot(container);
      
      console.log('🎨 Rendering React app...');
      root.render(SimpleApp);
      
      console.log('🎉 SUCCESS: React app rendered!');
      
    }).catch(error => {
      console.error('❌ Error importing ReactDOM:', error);
    });
    
  }).catch(error => {
    console.error('❌ Error importing React:', error);
  });
  
} catch (error) {
  console.error('❌ Error in React setup:', error);
} 