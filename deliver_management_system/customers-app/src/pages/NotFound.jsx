import { Link } from 'react-router-dom';

const NotFound = () => (
  <div className="max-w-md mx-auto px-4 py-24 text-center">
    <p className="text-7xl mb-4">🍽️</p>
    <h1 className="text-3xl font-bold text-gray-800 mb-2">Page not found</h1>
    <p className="text-gray-400 mb-8">Looks like this page went out for delivery and never came back.</p>
    <Link to="/" className="inline-block bg-orange-500 text-white px-8 py-3 rounded-xl font-semibold hover:bg-orange-600 transition-colors">Back to Home</Link>
  </div>
);
export default NotFound;
