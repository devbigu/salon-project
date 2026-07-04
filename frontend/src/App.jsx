import Router from "./route/Index";
import { AuthProvider } from "./auth/AuthContext";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const App = () => {
  return (
    <AuthProvider>
      <Router />
      <ToastContainer position="top-right" autoClose={4000} />
    </AuthProvider>
  );
};
export default App;
