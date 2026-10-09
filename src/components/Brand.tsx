import logo from "@/assets/tanyora-logo.jpg";
import { site } from "@/lib/site";
export function Brand() {
  return <span className="inline-flex shrink-0 items-center gap-2.5 text-lg font-semibold">
    <img src={logo} alt="" width={40} height={40} className="h-10 w-10 rounded-lg object-cover" decoding="async" />{site.name}
  </span>;
}
