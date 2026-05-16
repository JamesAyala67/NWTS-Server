import { useState } from "react";
import axios from "axios";
import { User, Lock, Eye, EyeOff, ShieldCheck } from "lucide-react";

// Lalaag ko kuta mukha ni Lowell
// import EasterEgg from "../../assets/login-bg.png";
import LoginBG from "../../assets/login-1.jpg";

export default function Login() {
  const [role, setRole] = useState<"Staff" | "Admin">("Staff");
  const [showPassword, setShowPassword] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const response = await axios.post(
        "http://localhost:3000/api/auth/login",
        {
          username,
          password,
          role,
        },
      );
      // Save the JWT token returned by the backend to local Storage
      // This token will be used for authenticating future API requests to protected routes
      localStorage.setItem("token", response.data.token);
      // Saves the usersname and roles to the local storage so that we can use it
      localStorage.setItem("userName", response.data.user.name);
      localStorage.setItem("userRole", response.data.user.role);
      // Redirect to the Landing Page after Successful login
      // Palitan nlng ni sa Dashboard pag na Implement na tultol
      window.location.href = "/clients";
    } catch (error: any) {
      // If the backend sends back a 401 (Unauthorized), show an alert
      alert(
        error.response?.data?.error || "Failed to login. Please try again.",
      );
    }
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row font-sans">
      {/* left Side: Branding */}
      <div className="relative hidden md:flex md:w-1/2 bg-gray-900 items-center justify-center p-12 text-center overflow-hidden">
        {/* Background Image */}
        <div
          className="absolute inset-0 z-0 opacity-60 bg-cover bg-center"
          style={{
            backgroundImage: `url(${LoginBG})`,
          }}
        />
        {/* Gradient Overlay */}
        <div className="absolute inset-0 z-0 bg-gradient-to-b from-transparent to-[#2a332c]/80" />

        <div className="relative z-10 flex flex-col items-center mt-[-10%]">
          {/* Pa-Insert nlng ki Logo kung trip nindo */}
          {/* Insert digdi */}
          <div className="flex items-center gap-4 text-[#e2dcc8] text-sm tracking-widest mb-4">
            <span>EST.</span>
            <div className="w-8 h-[1px] bg-[#e2dcc8]"></div>
            <span>1996</span>
          </div>

          <h1 className="text-4xl md:text-5xl font-serif text-[#f9f8f3] tracking-wide mb-2">
            NEW HEAVEN'S WAY
          </h1>
          <h2 className="text-lg md:text-xl text-[#e2dcc8] tracking-[0.2em] uppercase mb-8">
            Memorial Garden
          </h2>

          <p className="text-[#f9f8f3] text-sm max-w-sm leading-relaxed opacity-90">
            Honoring lives. Preserving memories.
            <br />
            Serving generations with care and respect.
          </p>
        </div>
      </div>

      {/* Right Side: Login Form */}
      <div className="w-full md:w-1/2 flex items-center justify-center bg-[#FDFCF8] p-8">
        <div className="max-w-md w-full">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-serif text-[#313c34] mb-2 font-bold">
              Welcome Back
            </h2>
            <p className="text-gray-500 text-sm">
              Please sign in to continue to your account
            </p>
            <div className="flex items-center justify-center mt-6">
              <div className="w-16 h-[1px] bg-gray-300"></div>
              <svg
                className="w-4 h-4 mx-2 text-gray-400"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M12 22c4-4 4-10 0-14-4 4-4 10 0 14z" />
              </svg>
              <div className="w-16 h-[1px] bg-gray-300"></div>
            </div>
          </div>

          <form onSubmit={handleLogin} className="space-y-5">
            {/* Role Selection */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Login as
              </label>
              <div className="grid grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() => setRole("Staff")}
                  className={`flex items-center gap-3 p-3 border rounded-lg transition-all ${
                    role === "Staff"
                      ? "border-[#4A5D4E] bg-white ring-1 ring-[#4A5D4E]"
                      : "border-gray-200 bg-transparent hover:bg-gray-50"
                  }`}
                >
                  <div
                    className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${role === "Staff" ? "border-[#4A5D4E]" : "border-gray-300"}`}
                  >
                    {role === "Staff" && (
                      <div className="w-2 h-2 rounded-full bg-[#4A5D4E]" />
                    )}
                  </div>
                  <span className="text-sm font-medium text-gray-800">
                    Staff
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setRole("Admin")}
                  className={`flex items-center gap-3 p-3 border rounded-lg transition-all ${
                    role === "Admin"
                      ? "border-[#4A5D4E] bg-white ring-1 ring-[#4A5D4E]"
                      : "border-gray-200 bg-transparent hover:bg-gray-50"
                  }`}
                >
                  <div
                    className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${role === "Admin" ? "border-[#4A5D4E]" : "border-gray-300"}`}
                  >
                    {role === "Admin" && (
                      <div className="w-2 h-2 rounded-full bg-[#4A5D4E]" />
                    )}
                  </div>
                  <span className="text-sm font-medium text-gray-800">
                    Admin
                  </span>
                </button>
              </div>
            </div>

            {/* Username */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Username
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  placeholder="Enter your username"
                  className="w-full pl-10 pr-3 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#4A5D4E] focus:border-[#4A5D4E] bg-transparent"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  className="w-full pl-10 pr-10 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#4A5D4E] focus:border-[#4A5D4E] bg-transparent"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5" />
                  ) : (
                    <Eye className="h-5 w-5" />
                  )}
                </button>
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              className="w-full bg-[#4A5D4E] text-white font-medium py-3 rounded-lg hover:bg-[#3b4b3e] transition-colors mt-4"
            >
              Sign In
            </button>
          </form>

          {/* Footer */}
          <div className="mt-8 pt-6 border-t border-gray-200 flex items-center justify-center gap-2 text-xs text-gray-500">
            <ShieldCheck className="h-4 w-4" />
            <span>Secure access. Authorized personnel only.</span>
          </div>
        </div>
      </div>
    </div>
  );
}
