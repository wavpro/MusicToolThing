import Player from "../lib/player";
import { useContext } from 'react';
import { UserContext } from '../index.js';
import { getTrackInfo, createTrackAudioCover } from "../lib/handleRequests.js";

const Home = () => {
  const { playing, setPlaying } = useContext(UserContext);
  return <>
    <button onClick={async () => {
      const info = await getTrackInfo(2);
      const cover = createTrackAudioCover(2, 64);

      setPlaying({
        id: info.id,
        title: info.title,
        artist: info.artist,
        currentTime: 0,
        duration: info.duration,
        thumbnailUrl: cover,
        paused: true,
      });
    }}>Play 2</button>
    <Player />
  </>
};

export default Home;