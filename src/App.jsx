import { createContext, useContext } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { supabaseEnabled } from './lib/supabase';
import { useStore as useLocalStore } from './lib/useStore';
import { useSupabaseStore } from './lib/useSupabaseStore';
import Layout from './components/Layout';
import Login from './pages/Login';
import PostcardWall from './pages/PostcardWall';
import Books from './pages/Books';
import Discussions from './pages/Discussions';
import NearMe from './pages/NearMe';
import Messages from './pages/Messages';
import SchwabLounge from './pages/SchwabLounge';
import Profile from './pages/Profile';
import TravelTracker from './pages/TravelTracker';
import Members from './pages/Members';
import Sessions from './pages/Sessions';

// Context to share store across components
export const StoreContext = createContext(null);

export function useAppStore() {
  return useContext(StoreContext);
}

function AppWithSupabase() {
  const storeData = useSupabaseStore();

  if (storeData.loading) {
    return (
      <div className="login-page">
        <div className="login-card" style={{ textAlign: 'center' }}>
          <div className="login-logo">
            <span className="logo-mark large">SC</span>
            <h1>SEP Circle</h1>
          </div>
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  if (!storeData.currentUser) return (
    <StoreContext.Provider value={storeData}>
      <Login />
    </StoreContext.Provider>
  );

  return (
    <StoreContext.Provider value={storeData}>
      <BrowserRouter>
        <Routes>
          <Route element={<Layout />}>
            <Route path="/" element={<PostcardWall />} />
            <Route path="/books" element={<Books />} />
            <Route path="/discussions" element={<Discussions />} />
            <Route path="/sessions" element={<Sessions />} />
            <Route path="/lounge" element={<SchwabLounge />} />
            <Route path="/nearby" element={<NearMe />} />
            <Route path="/travel" element={<TravelTracker />} />
            <Route path="/members" element={<Members />} />
            <Route path="/messages" element={<Messages />} />
            <Route path="/profile/:userId" element={<Profile />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </StoreContext.Provider>
  );
}

function AppWithLocalStorage() {
  const storeData = useLocalStore();

  if (!storeData.currentUser) return (
    <StoreContext.Provider value={storeData}>
      <Login />
    </StoreContext.Provider>
  );

  return (
    <StoreContext.Provider value={storeData}>
      <BrowserRouter>
        <Routes>
          <Route element={<Layout />}>
            <Route path="/" element={<PostcardWall />} />
            <Route path="/books" element={<Books />} />
            <Route path="/discussions" element={<Discussions />} />
            <Route path="/sessions" element={<Sessions />} />
            <Route path="/lounge" element={<SchwabLounge />} />
            <Route path="/nearby" element={<NearMe />} />
            <Route path="/travel" element={<TravelTracker />} />
            <Route path="/members" element={<Members />} />
            <Route path="/messages" element={<Messages />} />
            <Route path="/profile/:userId" element={<Profile />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </StoreContext.Provider>
  );
}

function App() {
  if (supabaseEnabled) return <AppWithSupabase />;
  return <AppWithLocalStorage />;
}

export default App;
