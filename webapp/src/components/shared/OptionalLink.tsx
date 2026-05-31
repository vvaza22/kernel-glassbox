import { Link } from "wouter";

type OptionalLinkProps = {
  href?: string | null;
  children: React.ReactNode;
};

export default function OptionalLink({ href, children }: OptionalLinkProps) {
  return href ? <Link href={href}>{children}</Link> : <div>{children}</div>;
}
