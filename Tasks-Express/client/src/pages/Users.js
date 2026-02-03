import { useEffect, useState } from "react";
import API from "../services/api";
import UserTable from "../components/UserTable";

function Users() {
  const [users, setUsers] = useState([]);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    const res = await API.get("/users");
    setUsers(res.data);
  };

  return (
    <div className="page-container">
      <h2>User List</h2>
      <UserTable users={users} />
    </div>
  );
}

export default Users;
