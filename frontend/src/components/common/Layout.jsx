// import React from "react";
// import { Outlet } from "react-router-dom";
// import Header from "./Header";
// import Sidebar from "./Sidebar";

// const Layout = () => {
//   return (
//     <div className="min-h-screen bg-gray-50">
//       {/* Sidebar - Fixed */}
//       <div className="fixed top-0 left-0 w-64 h-full z-10 bg-gray-800">
//         <Sidebar />
//       </div>

//       {/* Header - Fixed, đè lên sidebar */}
//       <Header />

//       {/* Main Content */}
//       <main className="ml-64 pt-20 p-6">
//         <Outlet />
//       </main>
//     </div>
//   );
// };

// export default Layout;

// Layout.jsx - Compact & Stable
// Layout.jsx - Fixed với sidebar full height và proper spacing

// Layout.jsx - Perfect layout với sidebar fixed và pages tận dụng toàn bộ space
import React, { useState } from "react";
import { Outlet } from "react-router-dom";
import Header from "./Header";
import Sidebar from "./Sidebar";

const Layout = () => {
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* SIDEBAR - FIXED POSITION, ĐỨng YÊN HOÀN TOÀN */}
      <Sidebar isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />

      {/* MAIN CONTENT - Margin left để tránh sidebar, CHIẾM TOÀN BỘ SPACE CÒN LẠI */}
      <div
        className={`transition-all duration-300 ${
          isCollapsed ? "ml-12" : "ml-56"
        }`}
      >
        {/* HEADER - FIXED TOP, không bị sidebar che */}
        <div className="sticky top-0 z-30 bg-white border-b border-gray-200 h-16">
          <Header />
        </div>

        {/* PAGE CONTENT - CHIẾM TOÀN BỘ SPACE, NO WASTED SPACE */}
        <main className="min-h-[calc(100vh-4rem)]">
          <div className="p-4 h-full">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default Layout;
