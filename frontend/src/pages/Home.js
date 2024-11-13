import Player from "../lib/Player/Player.js";
import { useContext, useState, useLayoutEffect } from 'react';
import { UserContext } from '../index.js';
import { getTrackInfo, createTrackAudioCover, getTracksUploadedByUser } from "../lib/handleRequests.js";

const Home = () => {
  const { queue, setQueue, user } = useContext(UserContext);
  const [els, setEls] = useState([]);

  useLayoutEffect(() => {
    // React advises to declare the async function directly inside useEffect
    async function getTracks() {
      const tracks = await getTracksUploadedByUser(user.id);
      let e = tracks.map((track, index) => (
        <div key={index}>
          <img src={createTrackAudioCover(track.id, 64)} alt={track.title} />
          <h3>{track.title}</h3>
          <button onClick={async () => {
            const info = await getTrackInfo(track.id);
  
            setQueue({
              position: queue.position,
              tracks: [...queue.tracks, {
                id: info.id,
                title: info.title,
                artist: info.artist,
                currentTime: 0,
                duration: info.duration,
                thumbnails: {
                  "64": createTrackAudioCover(2, 64),
                  "128": createTrackAudioCover(2, 128),
                  "512": createTrackAudioCover(2, 512),
                  "1000": createTrackAudioCover(2, 1000),
                }
              }]
            });
          }}>Add to queue</button>
        </div>
      ))
      setEls(e);
    };
    getTracks()
  }, [user.id, queue, setQueue]);

  return <>
      {els}
    <Player />
  </>
};

export default Home;