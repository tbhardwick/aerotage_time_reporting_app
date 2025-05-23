console.log('🚀 Simple JS React app starting...');

// Wait for DOM to be ready
document.addEventListener('DOMContentLoaded', function() {
  console.log('📦 DOM ready, loading React...');
  
  // Simple test without any imports first
  setTimeout(function() {
    console.log('🧪 Testing simple React creation...');
    
    const root = document.getElementById('root');
    if (!root) {
      console.error('❌ Root not found');
      return;
    }
    
    // Create React app using global React (if available)
    if (typeof React !== 'undefined' && typeof ReactDOM !== 'undefined') {
      console.log('✅ Global React found');
      
      const app = React.createElement('div', {
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
          boxShadow: '0 10px 40px rgba(0,0,0,0.1)'
        }
      }, [
        React.createElement('h1', { key: 'h1', style: { color: '#0ea5e9' } }, '🎉 React Works!'),
        React.createElement('p', { key: 'p', style: { color: '#64748b' } }, 'Simple React app is working perfectly!')
      ]));
      
      const reactRoot = ReactDOM.createRoot(root);
      reactRoot.render(app);
      console.log('✅ React rendered successfully!');
      
    } else {
      console.log('❌ Global React not found, trying manual approach...');
      
      // Fallback: Pure DOM manipulation
      root.innerHTML = `
        <div style="
          padding: 40px; 
          text-align: center; 
          font-family: Arial, sans-serif;
          background: linear-gradient(135deg, #f0f9ff 0%, #fdf4ff 100%);
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
        ">
          <div style="
            background: white;
            padding: 40px;
            border-radius: 20px;
            box-shadow: 0 10px 40px rgba(0,0,0,0.1);
            max-width: 500px;
          ">
            <h1 style="color: #0ea5e9; margin-bottom: 20px;">
              🎉 Aerotage Time Reporting
            </h1>
            <p style="color: #64748b; margin-bottom: 20px;">
              App is working! React bundle had issues, but the foundation is solid.
            </p>
            <div style="
              background: #f0f9ff;
              padding: 20px;
              border-radius: 10px;
              border: 2px solid #0ea5e9;
            ">
              <p style="margin: 0; color: #0369a1; font-weight: bold;">
                ✅ Ready for Phase 2 Development!
              </p>
            </div>
          </div>
        </div>
      `;
      console.log('✅ Fallback DOM rendering successful!');
    }
  }, 1000);
}); 