import ReactDOM from "react-dom/client";
import { createContext, useState, useEffect } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Layout from "./pages/reusable/Layout";
import Home from "./pages/Home";
import Blogs from "./pages/Blogs";
import Profile from "./pages/Profile";
import NoPage from "./pages/NoPage";

import { authProfile } from "./lib/handleRequests.js";

import './css/global.css';

import { library } from '@fortawesome/fontawesome-svg-core'
import { fas } from '@fortawesome/free-solid-svg-icons'
import { faTwitter, faFontAwesome } from '@fortawesome/free-brands-svg-icons'

library.add(fas, faTwitter, faFontAwesome)

export const UserContext = createContext(null);

/*const playing = {
  id: number;
  title: string;
  artist: string;
  currentTime: number;
  duration: number;
  thumbnails: {
    [size: string]: string;
  };
}
*/

export default function App() {
  const [user, setUser] = useState(null);
  const [queue, setQueue] = useState({
    position: 0,
    tracks: []
  });
  const [playing, setPlaying] = useState(queue.tracks[queue.position]);

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
      <UserContext.Provider value={{ user, setUser, playing, setPlaying, queue, setQueue }}>
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