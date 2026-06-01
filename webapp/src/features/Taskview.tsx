import useTaskview from "@/hooks/taskview";
import { useEffect } from "react";
import { useParams } from "wouter";
import Loader from "@/components/ui/Loader";
import View from "@/components/taskview/View";

export default function Taskview() {
  const params = useParams();
  const { getView, viewData, connected } = useTaskview();

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

  useEffect(() => {
    if (!viewData) return;
    console.log("Received taskview data:", viewData);
  }, [viewData]);

  return viewData === null ? (
    <Loader label="Loading task view..." />
  ) : (
    <View viewData={viewData} />
  );
}
