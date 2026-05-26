import { useEffect, useRef } from "react";
import { Timeline } from "vis-timeline";
import { DataSet } from "vis-data";
import type { DataItem } from "vis-timeline";
import "vis-timeline/styles/vis-timeline-graph2d.min.css";

export type GroupItem = {
  id: number;
  content: string;
};

type VisTimelineProps = {
  items: DataItem[];
  groups: GroupItem[];
};

export default function VisTimeline({ items, groups }: VisTimelineProps) {
  const contRef = useRef<HTMLDivElement | null>(null);
  const visRef = useRef<Timeline | null>(null);

  useEffect(() => {
    if (!contRef.current || visRef.current) return;
    visRef.current = new Timeline(contRef.current, [], [], {
      showMajorLabels: false,
      showMinorLabels: false,
      showCurrentTime: false,
      showTooltips: true,
      selectable: false,
      groupOrder: "id",
      orientation: "top",
      tooltip: {
        delay: 0,
        followMouse: true,
      },
      stack: false,
    });

    return () => {
      visRef.current?.destroy();
      visRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (!visRef.current) return;
    visRef.current.setData({
      groups: new DataSet(groups),
      items: new DataSet(items),
    });
    visRef.current.fit();
  }, [items, groups]);

  return <div className="w-full" ref={contRef}></div>;
}
