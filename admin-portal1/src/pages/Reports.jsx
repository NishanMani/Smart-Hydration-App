import { useState } from "react";
import Table from "../components/Table";
import "../styles/common.css";
import reportsData from "../data/reports";

const Reports = () => {
  const [month, setMonth] = useState("");
  const [status, setStatus] = useState("");

  const filteredReports = reportsData.filter((report) => {
    const matchMonth = month ? report.month === month : true;
    const matchStatus = status ? report.status === status : true;
    return matchMonth && matchStatus;
  });

  const columns = [
    { key: "title", label: "Title" },
    { key: "month", label: "Month" },
    {
      key: "status",
      label: "Status",
      render: (row) => (
        <span className={`badge ${row.status.toLowerCase()}`}>
          {row.status}
        </span>
      ),
    },
    { key: "createdBy", label: "Created By" },
    { key: "date", label: "Date" },
  ];

  const completedCount = filteredReports.filter(
    (r) => r.status === "Completed"
  ).length;

  const pendingCount = filteredReports.filter(
    (r) => r.status === "Pending"
  ).length;

  return (
    <div className="page">
      <div className="content reports-page">
        <div className="page-header">
          <h2>Reports</h2>
          <p className="subtitle">View and manage generated reports</p>
        </div>
        <div className="filters">
          <select value={month} onChange={(e) => setMonth(e.target.value)}>
            <option value="">All Months</option>
            <option value="January">January</option>
            <option value="February">February</option>
            <option value="March">March</option>
            <option value="April">April</option>
            <option value="May">May</option>
            <option value="June">June</option>
            <option value="July">July</option>
            <option value="August">August</option>
            <option value="September">September</option>
            <option value="October">October</option>
            <option value="November">November</option>
            <option value="December">December</option>
          </select>

          <select value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="">All Status</option>
            <option value="Completed">Completed</option>
            <option value="Pending">Pending</option>
          </select>

          <select>
            <option value="">Export</option>
            <option value="excel">Export Excel</option>
            <option value="pdf">Export PDF</option>
          </select>
        </div>

        <div className="summary">
          <div className="summary-card">
            <p>Total</p>
            <h3>{filteredReports.length}</h3>
          </div>

          <div className="summary-card completed">
            <p>Completed</p>
            <h3>{completedCount}</h3>
          </div>

          <div className="summary-card pending">
            <p>Pending</p>
            <h3>{pendingCount}</h3>
          </div>
        </div>

        <Table columns={columns} data={filteredReports} />
      </div>
    </div>
  );
};

export default Reports;