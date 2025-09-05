import React from "react";

const PageHeader = ({ title, subtitle, Icon }) => {
  return (
    <div className="flex items-center justify-between">
      <div className="min-w-0">
        <h1 className="text-xl font-bold text-gray-900 flex items-center">
          {Icon ? <Icon className="mr-2 h-5 w-5 text-blue-600" /> : null}
          <span className="truncate">{title}</span>
        </h1>
        {subtitle ? (
          <p className="text-sm text-gray-600 mt-1 truncate">{subtitle}</p>
        ) : null}
      </div>
    </div>
  );
};

export default PageHeader;
