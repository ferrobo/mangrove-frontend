import { Routes, Route } from 'react-router-dom';
import Layout from '@/components/Layout';
import Home from '@/pages/Home';
import Report from '@/pages/Report';
import MapPage from '@/pages/MapPage';
import Review from '@/pages/Review';

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<Home />} />
        <Route path="/report" element={<Report />} />
        <Route path="/map" element={<MapPage />} />
        <Route path="/review" element={<Review />} />
        <Route path="*" element={<Home />} />
      </Route>
    </Routes>
  );
}
