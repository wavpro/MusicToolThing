import { useContext, useState, useEffect } from 'react';
import { UserContext } from '../index.js';
import { getTracksUploadedByUser } from "../lib/handleRequests.js";
import ListOfTracks from './reusable/ListOfTracks.js';

const Home = () => {
  const { queue, setQueue, user } = useContext(UserContext);
  const [tracks, setTracks] = useState([]);

  useEffect(() => {
    // React advises to declare the async function directly inside useEffect
    async function getTracks() {
      setTracks(await getTracksUploadedByUser(user.id));
    };
    getTracks()
  }, [user.id]);

  return <ListOfTracks tracks={tracks} />;
};

export default Home;