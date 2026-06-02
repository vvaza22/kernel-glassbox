import { describe, expect, test } from "vitest";
import { toTreeNodes } from "./proctree";
import type { TreeNode } from "@/types/ui/proctree";
import type { WebsocketTaskKey } from "@/types/ws/shared";
import type { ProctreeNode } from "@/types/ws/proctree";

// TODO: toTreeNodes does not guarantee the order, make tests more general

const rootKey: WebsocketTaskKey = { pid: "0", startTime: "0" };
const fakeKey: WebsocketTaskKey = { pid: "-1", startTime: "-1" };
const rootTreeNode: TreeNode = {
  id: "0-0",
  parentId: "",
  parentTreeNodeId: "",
  name: "swapper/0",
  pid: "0",
  isKthread: true,
  startTime: "0",
  subNodes: [],
  childTreeNodeIds: [],
};

describe("toTreeNodes", () => {
  test("returns root node on empty input", () => {
    expect(toTreeNodes([])).toEqual([rootTreeNode]);
  });

  test("handles root with multiple children", () => {
    const keyA: WebsocketTaskKey = { pid: "1", startTime: "100" };
    const keyB: WebsocketTaskKey = { pid: "2", startTime: "200" };

    const nodes: ProctreeNode[] = [
      {
        parent: fakeKey,
        realParent: rootKey,
        groupLeader: keyA,
        self: keyA,
        name: "A",
        isKthread: false,
      },
      {
        parent: fakeKey,
        realParent: rootKey,
        groupLeader: keyB,
        self: keyB,
        name: "B",
        isKthread: false,
      },
    ];

    const expectedNodes: TreeNode[] = [
      {
        ...rootTreeNode,
        childTreeNodeIds: ["1-100", "2-200"],
      },
      {
        id: "1-100",
        parentId: "0-0",
        parentTreeNodeId: "0-0",
        name: "A",
        pid: keyA.pid,
        startTime: keyA.startTime,
        isKthread: false,
        subNodes: [],
        childTreeNodeIds: [],
      },
      {
        id: "2-200",
        parentId: "0-0",
        parentTreeNodeId: "0-0",
        name: "B",
        pid: keyB.pid,
        startTime: keyB.startTime,
        isKthread: false,
        subNodes: [],
        childTreeNodeIds: [],
      },
    ];

    expect(toTreeNodes(nodes)).toEqual(expectedNodes);
  });

  test("handles sub nodes", () => {
    const keyA: WebsocketTaskKey = { pid: "10", startTime: "100" };
    const keyB: WebsocketTaskKey = { pid: "20", startTime: "200" };
    const nodes: ProctreeNode[] = [
      {
        parent: fakeKey,
        realParent: rootKey,
        groupLeader: keyA,
        self: keyA,
        name: "A",
        isKthread: false,
      },
      {
        parent: fakeKey,
        realParent: rootKey,
        groupLeader: keyA,
        self: { pid: "11", startTime: "110" },
        name: "A1",
        isKthread: false,
      },
      {
        parent: fakeKey,
        realParent: rootKey,
        groupLeader: keyB,
        self: keyB,
        name: "B",
        isKthread: false,
      },
      {
        parent: fakeKey,
        realParent: rootKey,
        groupLeader: keyB,
        self: { pid: "21", startTime: "210" },
        name: "B1",
        isKthread: false,
      },
      {
        parent: fakeKey,
        realParent: rootKey,
        groupLeader: keyB,
        self: { pid: "22", startTime: "220" },
        name: "B2",
        isKthread: false,
      },
    ];
    const expectedNodes: TreeNode[] = [
      {
        ...rootTreeNode,
        childTreeNodeIds: ["10-100", "20-200"],
      },
      {
        id: "10-100",
        parentId: "0-0",
        parentTreeNodeId: "0-0",
        name: "A",
        pid: keyA.pid,
        startTime: keyA.startTime,
        isKthread: false,
        subNodes: [
          {
            id: "11-110",
            name: "A1",
            pid: "11",
            startTime: "110",
          },
        ],
        childTreeNodeIds: [],
      },
      {
        id: "20-200",
        parentId: "0-0",
        parentTreeNodeId: "0-0",
        name: "B",
        pid: keyB.pid,
        startTime: keyB.startTime,
        isKthread: false,
        subNodes: [
          {
            id: "21-210",
            name: "B1",
            pid: "21",
            startTime: "210",
          },
          {
            id: "22-220",
            name: "B2",
            pid: "22",
            startTime: "220",
          },
        ],
        childTreeNodeIds: [],
      },
    ];
    expect(toTreeNodes(nodes)).toEqual(expectedNodes);
  });

  test("handles deep trees", () => {
    const keyA = { pid: "1", startTime: "100" };
    const keyB = { pid: "2", startTime: "200" };
    const keyC = { pid: "3", startTime: "300" };
    const keyD = { pid: "40", startTime: "4000" };
    const keyD1 = { pid: "41", startTime: "4100" };
    const keyE = { pid: "5", startTime: "500" };
    const keyF = { pid: "6", startTime: "600" };

    const nodes: ProctreeNode[] = [
      {
        parent: fakeKey,
        realParent: rootKey,
        groupLeader: keyA,
        self: keyA,
        name: "A",
        isKthread: false,
      },
      {
        parent: fakeKey,
        realParent: keyA,
        groupLeader: keyB,
        self: keyB,
        name: "B",
        isKthread: false,
      },
      {
        parent: fakeKey,
        realParent: rootKey,
        groupLeader: keyC,
        self: keyC,
        name: "C",
        isKthread: false,
      },
      {
        parent: fakeKey,
        realParent: keyC,
        groupLeader: keyD,
        self: keyD,
        name: "D",
        isKthread: false,
      },
      {
        parent: fakeKey,
        realParent: fakeKey,
        groupLeader: keyD,
        self: keyD1,
        name: "D1",
        isKthread: false,
      },
      {
        parent: fakeKey,
        realParent: keyD1,
        groupLeader: keyE,
        self: keyE,
        name: "E",
        isKthread: false,
      },
      {
        parent: fakeKey,
        realParent: keyD,
        groupLeader: keyF,
        self: keyF,
        name: "F",
        isKthread: false,
      },
    ];

    const result = toTreeNodes(nodes);
    expect(result).toHaveLength(7); // 6 main nodes + root
    expect(result[0]).toEqual({
      ...rootTreeNode,
      childTreeNodeIds: ["1-100", "3-300"],
    });

    // The order of other nodes is not guaranteed

    expect(result).toContainEqual({
      id: "1-100",
      parentId: "0-0",
      parentTreeNodeId: "0-0",
      name: "A",
      pid: keyA.pid,
      startTime: keyA.startTime,
      isKthread: false,
      subNodes: [],
      childTreeNodeIds: ["2-200"],
    });

    expect(result).toContainEqual({
      id: "2-200",
      parentId: "1-100",
      parentTreeNodeId: "1-100",
      name: "B",
      pid: keyB.pid,
      startTime: keyB.startTime,
      isKthread: false,
      subNodes: [],
      childTreeNodeIds: [],
    });

    expect(result).toContainEqual({
      id: "3-300",
      parentId: "0-0",
      parentTreeNodeId: "0-0",
      name: "C",
      pid: keyC.pid,
      startTime: keyC.startTime,
      isKthread: false,
      subNodes: [],
      childTreeNodeIds: ["40-4000"],
    });

    expect(result).toContainEqual({
      id: "40-4000",
      parentId: "3-300",
      parentTreeNodeId: "3-300",
      name: "D",
      pid: keyD.pid,
      startTime: keyD.startTime,
      isKthread: false,
      subNodes: [
        {
          id: "41-4100",
          name: "D1",
          pid: keyD1.pid,
          startTime: keyD1.startTime,
        },
      ],
      childTreeNodeIds: ["5-500", "6-600"],
    });

    expect(result).toContainEqual({
      id: "5-500",
      parentId: "41-4100",
      parentTreeNodeId: "40-4000",
      name: "E",
      pid: keyE.pid,
      startTime: keyE.startTime,
      isKthread: false,
      subNodes: [],
      childTreeNodeIds: [],
    });

    expect(result).toContainEqual({
      id: "6-600",
      parentId: "40-4000",
      parentTreeNodeId: "40-4000",
      name: "F",
      pid: keyF.pid,
      startTime: keyF.startTime,
      isKthread: false,
      subNodes: [],
      childTreeNodeIds: [],
    });
  });
});
