import { Routes, Route } from 'react-router-dom';

function App() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Routes>
        <Route path="/" element={<Home />} />
      </Routes>
    </div>
  );
}

function Home() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">GroundPoint</h1>
        <p className="text-xl text-gray-600">
          Drone Construction Progress Monitoring Platform
        </p>
        <p className="text-sm text-gray-500 mt-2">MVP Development in Progress</p>
      </div>
    </div>
  );
}

export default App;
