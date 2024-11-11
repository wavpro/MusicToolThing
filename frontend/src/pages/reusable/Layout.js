import { useContext } from 'react'
import { Outlet, Link } from "react-router-dom";
import { authIn } from "../../lib/handleRequests";
import { UserContext } from '../../index.js';

const Layout = () => {
  const { user, setUser } = useContext(UserContext);

  if (!user) {
    return <button onClick={() => {
      authIn("admin", "admin")
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
    <nav>
      <ul>
        <li>
          <Link to="/">Home</Link>
        </li>
        <li>
          <Link to="/blogs">Blogs</Link>
        </li>
        <li>
          <Link to="/profile">Contact</Link>
        </li>
      </ul>
    </nav>

    <Outlet />
  </>
};

export default Layout;