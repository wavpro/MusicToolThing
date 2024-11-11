import ReactDOM from "react-dom/client";
import { createContext, useState, useEffect } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Layout from "./pages/reusable/Layout";
import Home from "./pages/Home";
import Blogs from "./pages/Blogs";
import Profile from "./pages/Profile";
import NoPage from "./pages/NoPage";

import { authProfile } from "./lib/handleRequests.js";

export const UserContext = createContext(null);

/*const playing = {
  id: number;
  title: string;
  artist: string;
  currentTime: number;
  duration: number;
  thumbnailUrl: string;
  paused: boolean;
}*/

export default function App() {
  const [user, setUser] = useState(null);
  const [playing, setPlaying] = useState({
    id: 1,
    title: "No song playing",
    artist: "Artist 1",
    currentTime: 0,
    duration: 0,
    thumbnailUrl: "http://localhost:4000/tracks/0/cover?size=64",
    paused: true,
  });

  useEffect(() => {
    authProfile()
      .then((user) => {
        console.log(user);
        setUser(user);
      })
      .catch((error) => {
        console.error("Error fetching user profile:", error);
      });
  }, []);

  return (
    <BrowserRouter>
      <UserContext.Provider value={{ user, setUser, playing, setPlaying }}>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<Home />} />
            <Route path="blogs" element={<Blogs />} />
            <Route path="profile" element={<Profile />} />
            <Route path="*" element={<NoPage />} />
          </Route>
        </Routes>
      </UserContext.Provider>
    </BrowserRouter>
  );
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);