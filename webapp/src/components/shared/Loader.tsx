import { Spinner } from "@/shadcn/components/ui/spinner";

type LoaderProps = {
  label: string;
};

export default function Loader({ label }: LoaderProps) {
  return (
    <div className="w-full h-full">
      <div className="absolute inset-0 flex flex-col gap-4 items-center justify-center">
        <Spinner className="size-16 text-foreground" />
        <p className="text-sm text-muted-foreground animate-pulse">{label}</p>
      </div>
    </div>
  );
}
