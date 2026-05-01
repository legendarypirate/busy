import type { Metadata } from "next";
import LoginView from "./LoginView";

export const metadata: Metadata = {
  title: "Нэвтрэх | BUSY.mn",
  description: "Платформд нэвтрэх",
};

export const dynamic = "force-dynamic";

export default LoginView;
