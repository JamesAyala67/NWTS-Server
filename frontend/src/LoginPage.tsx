import React, { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import axios from "axios";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Button } from "@/components/ui/button";
import { User, Lock } from "lucide-react";
// Ensure this path is correct based on your folder structure
import { ScrollArea } from "@/components/ui/scroll-area";

import loginBg from "@/assets/login-1.jpg";
import logo from "@/assets/logo.png";

const loginFn = async (credentials: Record<string, string>) => {
  const response = await axios.post(
    "http://localhost:5000/api/login",
    credentials,
  );
  return response.data;
};

function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("admin");

  const mutation = useMutation({
    mutationFn: loginFn,
    onSuccess: (data) => {
      alert(`Welcome, ${data.user.username}!`);
    },
    onError: (error: any) => {
      alert(error.response?.data?.message || "Login failed");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    mutation.mutate({ username, password, role });
  };

  return (
    /* h-screen ensures the ScrollArea takes up the full viewport */
    <ScrollArea className="h-screen w-full rounded-none border-none">
      <div className="flex min-h-screen w-full flex-col lg:flex-row">
        {/* Left Column: Background Image */}
        <div
          className="hidden lg:block lg:w-[65%] bg-cover bg-center"
          style={{
            backgroundImage: `url(${loginBg})`,
            backgroundPosition: "center",
            backgroundSize: "cover",
          }}
        />

        {/* Right Column: Login Panel */}
        <div className="w-full lg:w-[35%] min-h-screen bg-[#424B40] relative flex flex-col items-center justify-center p-8 shadow-2xl">
          <div className="w-full max-w-sm flex flex-col items-center py-12">
            {/* Logo */}
            <div className="w-48 h-48 mb-6 rounded-full overflow-hidden">
              <img
                src={logo}
                alt="New Heaven's Way Memorial Garden"
                className="w-full h-full object-contain"
              />
            </div>

            <h1 className="text-white text-xl font-bold tracking-widest mb-10">
              HI, WELCOME
            </h1>

            <form onSubmit={handleSubmit} className="w-full space-y-6">
              {/* Username */}
              <div className="flex items-center space-x-3 w-full">
                <User className="text-white w-6 h-6 shrink-0" />
                <Input
                  id="username"
                  placeholder="Username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                  className="bg-[#DDD9CD] border-0 text-black placeholder:text-gray-500 font-semibold h-12 rounded-lg focus-visible:ring-1 focus-visible:ring-white/50"
                />
              </div>

              {/* Password */}
              <div className="flex items-center space-x-3 w-full">
                <Lock className="text-white w-6 h-6 shrink-0" />
                <Input
                  id="password"
                  type="password"
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="bg-[#DDD9CD] border-0 text-black placeholder:text-gray-500 font-semibold h-12 rounded-lg focus-visible:ring-1 focus-visible:ring-white/50"
                />
              </div>

              {/* Role Selection */}
              <div className="flex items-center justify-center pt-2">
                <RadioGroup
                  value={role}
                  onValueChange={setRole}
                  className="flex space-x-8"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem
                      value="admin"
                      id="role-admin"
                      className="border-white text-white focus:ring-offset-0"
                    />
                    <Label
                      htmlFor="role-admin"
                      className="text-white text-sm font-medium cursor-pointer"
                    >
                      Admin
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem
                      value="staff"
                      id="role-staff"
                      className="border-white text-white focus:ring-offset-0"
                    />
                    <Label
                      htmlFor="role-staff"
                      className="text-white text-sm font-medium cursor-pointer"
                    >
                      Staff
                    </Label>
                  </div>
                </RadioGroup>
              </div>

              {/* Submit Button */}
              <div className="pt-6 flex justify-center">
                <Button
                  type="submit"
                  disabled={mutation.isPending}
                  className="w-32 bg-[#DDD9CD] hover:bg-[#c4c0b5] text-black font-bold h-10 rounded-xl transition-all shadow-md active:scale-95"
                >
                  {mutation.isPending ? "LOADING..." : "LOGIN"}
                </Button>
              </div>
            </form>
          </div>

          {/* Footer - Positioned relative to the panel padding to avoid overlapping on small screens */}
          <div className="mt-auto lg:absolute lg:bottom-6 text-white text-xs font-light tracking-wide opacity-80">
            Created on December xx, 2025
          </div>
        </div>
      </div>
    </ScrollArea>
  );
}

export default LoginPage;
