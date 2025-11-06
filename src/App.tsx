import './App.css'
import Enroll from './components/Enroll'

export default function App() {
  // 🔧 Directly define your backend API base here
  const apiBase = 'http://127.0.0.1:4000';

  return (
    <div className="min-h-screen text-gray-900 p-8">
      <h1 className="text-3xl font-bold">Student Face Enrollment</h1>
      {/* Pass the backend URL to Enroll component */}
      <Enroll apiBase={apiBase} />
    </div>
  );
}
