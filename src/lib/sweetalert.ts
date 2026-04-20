import Swal, { SweetAlertOptions } from "sweetalert2";
import withReactContent from "sweetalert2-react-content";

const MySwal = withReactContent(Swal);

// ตั้งค่า 기본 (Default Config) สำหรับ SweetAlert2 ให้สวยงามและเข้ากับ Theme
const defaultOptions: SweetAlertOptions = {
  customClass: {
    confirmButton:
      "bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md font-medium mx-2 transition-colors",
    cancelButton:
      "bg-gray-400 hover:bg-gray-500 text-white px-4 py-2 rounded-md font-medium mx-2 transition-colors",
    popup: "rounded-xl shadow-xl",
    title: "text-xl font-semibold",
  },
  buttonsStyling: false,
};

export const showSuccess = (title: string, text?: string) => {
  return MySwal.fire({
    ...defaultOptions,
    icon: "success",
    title,
    text,
    timer: 2000,
    showConfirmButton: false,
  });
};

export const showError = (title: string, text?: string) => {
  return MySwal.fire({
    ...defaultOptions,
    icon: "error",
    title,
    text,
    confirmButtonText: "ตกลง",
  });
};

export const showWarning = (title: string, text?: string) => {
  return MySwal.fire({
    ...defaultOptions,
    icon: "warning",
    title,
    text,
    confirmButtonText: "ตกลง",
  });
};

export const showConfirm = async (
  title: string,
  text?: string,
  confirmText = "ยืนยัน",
  cancelText = "ยกเลิก",
) => {
  const result = await MySwal.fire({
    ...defaultOptions,
    icon: "question",
    title,
    text,
    showCancelButton: true,
    confirmButtonText: confirmText,
    cancelButtonText: cancelText,
    reverseButtons: false,
  });
  return result.isConfirmed;
};
