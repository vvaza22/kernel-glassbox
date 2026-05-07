import { useState, useEffect, useMemo } from "react";
import { useTranslation } from "react-i18next";
import useProctree from "@/hooks/proctree";
import Loader from "@/components/ui/Loader";
import "@xyflow/react/dist/style.css";
import "@/styles/proctree.css";
import Viewer from "@/components/proctree/Viewer";

export default function Proctree() {
  const { t } = useTranslation("proctree");
  const { loaded, nodes } = useProctree();

  return loaded ? (
    <Viewer treeNodes={nodes} />
  ) : (
    <Loader label={t("loading")} />
  );
}
