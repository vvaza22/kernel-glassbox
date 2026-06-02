import useTaskview from "@/hooks/taskview";
import { useEffect } from "react";
import { useParams } from "wouter";
import { useTranslation } from "react-i18next";
import Loader from "@/components/ui/Loader";
import View from "@/components/taskview/View";

export default function Taskview() {
  const params = useParams();
  const { getView, viewData, connected } = useTaskview();
  const { t } = useTranslation("taskview");

  const pid = params["pid"]!;
  const startTime = params["startTime"]!;

  useEffect(() => {
    if (!connected) return;
    const key = {
      pid: parseInt(pid, 10),
      startTime: parseInt(startTime, 10),
    };
    getView(key);
  }, [connected]);

  return viewData === null ? (
    <Loader label={t("loading")} />
  ) : (
    <View viewData={viewData} />
  );
}
