import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Forma Pop 3D - Autenticação",
};

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
