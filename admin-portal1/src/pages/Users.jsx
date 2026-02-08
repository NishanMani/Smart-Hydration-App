import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Modal from "../components/Modal";
import "../styles/common.css";
import usersData from "../data/users";

const Users = () => {
  const navigate = useNavigate();

  const [search, setSearch] = useState("");
  const [role, setRole] = useState("");
  const [selectedUser, setSelectedUser] = useState(null);

  const filteredUsers = usersData.filter((user) => {
    const matchSearch =
      user.name.toLowerCase().includes(search.toLowerCase()) ||
      user.email.toLowerCase().includes(search.toLowerCase());

    const matchRole = role ? user.role === role : true;
    return matchSearch && matchRole;
  });

  return (
    <div className="page">
      <div className="content users-page">
        <div className="page-header">
          <h2>Users</h2>
          <p className="subtitle">Manage and view application users</p>
        </div>

        <div className="filters">
          <input
            type="text"
            placeholder="Search by name or email"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />

          <select value={role} onChange={(e) => setRole(e.target.value)}>
            <option value="">All Roles</option>
            <option value="Admin">Admin</option>
            <option value="User">User</option>
          </select>
        </div>

        <div className="table-wrapper">
          <table className="table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Role</th>
                <th>Action</th>
              </tr>
            </thead>

            <tbody>
              {filteredUsers.length > 0 ? (
                filteredUsers.map((user) => (
                  <tr key={user.id}>
                    <td>{user.name}</td>
                    <td>{user.email}</td>
                    <td>
                      <span className={`role-badge ${user.role.toLowerCase()}`}>
                        {user.role}
                      </span>
                    </td>
                    <td className="action-cell">
                      <button
                        className="btn-outline"
                        onClick={() => setSelectedUser(user)}
                      >
                        View
                      </button>
                      <button
                        className="btn-primary"
                        onClick={() =>
                          navigate("/profile", { state: user })
                        }
                      >
                        View Profile
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="4" className="empty">
                    No users found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <Modal isOpen={!!selectedUser} onClose={() => setSelectedUser(null)}>
          <h3>User Details</h3>
          <p><strong>Name:</strong> {selectedUser?.name}</p>
          <p><strong>Email:</strong> {selectedUser?.email}</p>
          <p><strong>Role:</strong> {selectedUser?.role}</p>
        </Modal>
      </div>
    </div>
  );
};

export default Users;