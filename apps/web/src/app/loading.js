import { Loader } from "@/components/ui/loader";

export default function Loading() {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <Loader className="w-8 h-8 text-white" />
    </div>
  );
}
