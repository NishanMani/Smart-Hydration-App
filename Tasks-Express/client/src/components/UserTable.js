import API from "../services/api";

function UserTable({ users, fetchUsers }) {
  const deleteUser = async (email) => {
    if (!window.confirm("Are you sure?")) return;

    try {
      await API.delete("/users", {
        data: { email }, 
      });

      fetchUsers(); 
    } catch (err) {
      alert(err.response?.data?.message || "Delete failed");
    }
  };

  return (
    <table className="user-table">
      <thead>
        <tr>
          <th>Name</th>
          <th>Email</th>
          <th>Role</th>
          <th>Action</th>
        </tr>
      </thead>

      <tbody>
        {users.map((user) => (
          <tr key={user._id}>
            <td>{user.name}</td>
            <td>{user.email}</td>
            <td>{user.role}</td>
            <td>
              <button
                className="btn btn-danger"
                onClick={() => deleteUser(user.email)}
              >
                Delete
              </button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export default UserTable;
