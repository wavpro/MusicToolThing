import { useContext } from 'react'
import { Outlet, Link } from "react-router-dom";
import { authIn } from "../../lib/handleRequests";
import { UserContext } from '../../index.js';
import Player from "../../lib/Player/Player.js";

import "../../css/layout.css"

const Layout = () => {
  const { user, setUser } = useContext(UserContext);

  console.log(user);

  if (!user) {
    return <button onClick={() => {
      authIn("admin", "admin77")
        .then((data) => {
          setUser(data.data);
        })
        .catch((error) => {
          console.error(error);
          setUser(null);
        });
    }}>Log in</button>
  }

  return <>
    <nav id="top-bar">
    </nav>
    <div id="main-content">
      <Outlet />
    </div>
    <Player />
  </>
};

export default Layout;