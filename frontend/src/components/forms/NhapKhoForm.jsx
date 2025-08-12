import React from "react";
import CreateNhapKhoForm from "./CreateNhapKhoForm";
import EditNhapKhoForm from "./EditNhapKhoForm";

const NhapKhoForm = ({ mode = "create", phieuId, onSuccess, onCancel }) => {
  if (mode === "edit") {
    return (
      <EditNhapKhoForm
        phieuId={phieuId}
        onSuccess={onSuccess}
        onCancel={onCancel}
      />
    );
  }

  return <CreateNhapKhoForm onSuccess={onSuccess} onCancel={onCancel} />;
};

export default NhapKhoForm;
