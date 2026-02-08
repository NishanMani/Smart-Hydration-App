import { Pie, Bar } from "react-chartjs-2";
import { Chart as ChartJS,
  ArcElement,
  BarElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend,
} from "chart.js";
import { useNavigate } from "react-router-dom";

ChartJS.register(
  ArcElement,
  BarElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend
);

const Dashboard = () => {
  const navigate = useNavigate();

  const user = {
    name: "Girish",
    role: "Admin",
  };
  const handleLogout = () => {
    localStorage.removeItem("user");
    navigate("/login");
  };

  const pieData = {
    labels: ["Admin", "Manager", "User"],
    datasets: [
      {
        data: [10, 35, 75],
        backgroundColor: ["#1e6fd9", "#22c55e", "#f97316"],
      },
    ],
  };
  const barData = {
    labels: ["Jan", "Feb", "Mar", "Apr", "May", "Jun"],
    datasets: [
      {
        label: "Completed",
        data: [12, 19, 15, 22, 18, 25],
        backgroundColor: "#22c55e",
      },
      {
        label: "Pending",
        data: [5, 7, 6, 4, 8, 3],
        backgroundColor: "#f97316",
      },
    ],
  };
  const activities = [
    { id: 1, action: "User registered", status: "completed", date: "2026-02-01" },
    { id: 2, action: "Report uploaded", status: "pending", date: "2026-02-02" },
    { id: 3, action: "Profile updated", status: "completed", date: "2026-02-03" },
    { id: 4, action: "Monthly review", status: "active", date: "2026-02-04" },
  ];

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <h2>Welcome, {user.name} </h2>
        <button className="logout-btn" onClick={handleLogout}>
          Logout
        </button>
      </div>

      <div className="dashboard-stats">
        <div className="stat-card">
          <p className="stat-title">Total Users</p>
          <h3 className="stat-value">120</h3>
        </div>

        <div className="stat-card">
          <p className="stat-title">Total Reports</p>
          <h3 className="stat-value">340</h3>
        </div>

        <div className="stat-card">
          <p className="stat-title">System Status</p>
          <h3 className="stat-value">Active</h3>
        </div>
      </div>

      <div className="dashboard-charts">
        <div className="chart-card">
          <p className="chart-title">Users by Role</p>
          <div className="chart-container">
            <Pie data={pieData} />
          </div>
        </div>

        <div className="chart-card">
          <p className="chart-title">Monthly Reports</p>
          <div className="chart-container">
            <Bar data={barData} />
          </div>
        </div>
      </div>
      <div className="activity-section">
        <h3>Recent Activities</h3>

        <table className="activity-table">
          <thead>
            <tr>
              <th>Action</th>
              <th>Status</th>
              <th>Date</th>
            </tr>
          </thead>
          <tbody>
            {activities.map((item) => (
              <tr key={item.id}>
                <td>{item.action}</td>
                <td>
                  <span className={`badge ${item.status}`}>
                    {item.status}
                  </span>
                </td>
                <td>{item.date}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Dashboard;