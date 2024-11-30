import { useContext } from 'react';
import { UserContext } from '../../index.js';

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

import '../../css/queue.css';

export default function Queue() {
    const { queue, setQueue } = useContext(UserContext);

    const showTracks = queue.tracks.length && !(
        queue.tracks.length === 1 && queue.tracks[0].id === -1
    );

    return (
        <div id="queue">
            {showTracks ?
                queue.tracks.map((track, index) => (
                    <div tabIndex={index} role="button" key={index} onClick={() => setQueue({ position: index, tracks: queue.tracks })} className={"queue-track " + (index === queue.position ? "selected-track" : "not-selected-track")}>
                        <img src={track.thumbnails["64"]} alt="" draggable="false" />
                        <div className="queue-tartist">
                            <p className="queue-title">{track.title}</p>
                            <p className="queue-artist">{track.artist}</p>
                        </div>
                        <button className="queue-track-button-remove" onClick={(e) => {
                            e.stopPropagation();

                            let position = queue.position;
                            if (queue.position >= 1 && queue.position === index) {
                                position--;
                            }

                            const tracks = [...queue.tracks];
                            tracks.splice(index, 1);

                            setQueue({
                                position,
                                tracks
                            });
                        }}><FontAwesomeIcon icon="fa-regular fa-square-minus" /></button>
                    </div>
                ))
                :
                <p id="no-tracks">No tracks in queue :(</p>}
        </div>
    );
}