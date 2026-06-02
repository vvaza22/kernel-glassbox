import { cn } from "@/shadcn/lib/utils";

type FieldProps = {
  name: string;
  value: string | number;
};

export function Field({ name, value }: FieldProps) {
  return (
    <div className={cn("flex justify-between", "py-1 px-4", "hover:bg-muted")}>
      <div className="font-mono text-base text-muted-foreground">{name}</div>
      <div className="font-mono text-base text-foreground">{value}</div>
    </div>
  );
}

export function FieldGroupTitle({ title }: { title: string }) {
  return <h2 className="font-mono text-lg px-4 pt-4">{title}</h2>;
}
