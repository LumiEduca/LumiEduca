import toast from "react-hot-toast";

export const success = (msg) => toast.success(msg);
export const error = (msg) => toast.error(msg);
export const info = (msg) => toast(msg);