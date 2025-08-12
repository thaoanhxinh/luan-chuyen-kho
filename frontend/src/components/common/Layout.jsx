import React from "react";
import { Outlet } from "react-router-dom";
import Header from "./Header";
import Sidebar from "./Sidebar";

const Layout = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sidebar - Fixed */}
      <div className="fixed top-0 left-0 w-64 h-full z-10 bg-gray-800">
        <Sidebar />
      </div>

      {/* Header - Fixed, đè lên sidebar */}
      <Header />

      {/* Main Content */}
      <main className="ml-64 pt-20 p-6">
        <Outlet />
      </main>
    </div>
  );
};

export default Layout;
