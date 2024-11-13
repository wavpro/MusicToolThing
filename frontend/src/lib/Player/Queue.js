import { useContext } from 'react';
import { UserContext } from '../../index.js';

import '../../css/queue.css';

export default function Queue() {
    const { queue, setQueue } = useContext(UserContext);

    return (
        <div id="queue">
            {queue.tracks.map((track, index) => (
                <button key={track.id} onClick={() => setQueue({ position: index, tracks: queue.tracks })} className={"queue-track " + (index === queue.position ? "selected-track" : "not-selected-track")}>
                    <img src={track.thumbnails["64"]} alt="" />
                    <div className="queue-tartist">
                        <p className="queue-title">{track.title}</p>
                        <p className="queue-artist">{track.artist}</p>
                    </div>
                </button>
            ))}
            {!queue.tracks.length ? <p id="no-tracks">No tracks in queue :(</p>: <></>}
        </div>
    );
}