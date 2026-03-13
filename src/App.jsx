import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { useStore } from './lib/useStore';
import Layout from './components/Layout';
import Login from './pages/Login';
import PostcardWall from './pages/PostcardWall';
import Books from './pages/Books';
import Discussions from './pages/Discussions';
import NearMe from './pages/NearMe';
import Messages from './pages/Messages';
import SchwabLounge from './pages/SchwabLounge';
import Profile from './pages/Profile';

function App() {
  const { currentUser } = useStore();

  if (!currentUser) return <Login />;

  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<PostcardWall />} />
          <Route path="/books" element={<Books />} />
          <Route path="/discussions" element={<Discussions />} />
          <Route path="/lounge" element={<SchwabLounge />} />
          <Route path="/nearby" element={<NearMe />} />
          <Route path="/messages" element={<Messages />} />
          <Route path="/profile/:userId" element={<Profile />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
