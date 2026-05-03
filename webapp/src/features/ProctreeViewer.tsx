import { useState } from "react";
import { useTranslation } from "react-i18next";
import Loader from "@/components/ui/Loader";

export default function ProctreeViewer() {
  const { t } = useTranslation("proctree");
  const [loading, _] = useState(true);

  return loading && <Loader label={t("loading")} />;
}
