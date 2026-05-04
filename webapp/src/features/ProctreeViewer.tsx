import { useState } from "react";
import { useTranslation } from "react-i18next";
import useProctree from "@/hooks/proctree";
import Loader from "@/components/ui/Loader";
import { kernelId } from "@/adapters/proctree";

export default function ProctreeViewer() {
  const { t } = useTranslation("proctree");
  const { loaded, nodes } = useProctree();

  const [expanded, setExpanded] = useState(new Set<string>([kernelId]));

  return !loaded && <Loader label={t("loading")} />;
}
