import AdminDashboard from "./AdminDashboard";
import UserDashboard from "./UserDashboard";

export default function Dashboard() {
  // get the item from localStorage
  const username = localStorage.getItem("user");
  const userRole = localStorage.getItem("role");


  // if it's null or undefined, set user to null
  const user = userRole ? JSON.parse(userRole) : null;

  if (!user) return <p>Please log in first.</p>;

  // optional chaining in case role is missing
  const roleName = user.role;
  console.log(roleName+" role in dashboard");

  if (roleName === "admin") {
    return (
      <div>
        
        <AdminDashboard />
      </div>
    );
  } else if (roleName === "customer" || roleName === "user") {
    console.log("hello");
    return (
      <div>
        <h2>Welcome {username} (User)</h2>
        <UserDashboard />
      </div>
    );
  } else {
    return <p>Unknown role: {roleName}</p>;
  }
}
