import { expect, test } from "vitest";
import { toTreeNodes } from "./proctree";
import type { TreeNode } from "@/types/ui/proctree";

// TODO: toTreeNodes does not guarantee the order, make tests more general

const rootKey = { pid: 0, startTime: 0 };
const fakeKey = { pid: -1, startTime: -1 };
const rootTreeNode: TreeNode = {
  id: "0-0",
  parentId: "",
  parentTreeNodeId: "",
  name: "swapper",
  pid: 0,
  subNodes: [],
  childTreeNodeIds: [],
};

test("toTreeNodes returns root node on empty input", () => {
  expect(toTreeNodes([])).toEqual([rootTreeNode]);
});

test("toTreeNodes handles root with multiple children", () => {
  const keyA = { pid: 1, startTime: 100 };
  const keyB = { pid: 2, startTime: 200 };
  const nodes = [
    {
      parent: fakeKey,
      realParent: rootKey,
      groupLeader: keyA,
      self: keyA,
      name: "A",
    },
    {
      parent: fakeKey,
      realParent: rootKey,
      groupLeader: keyB,
      self: keyB,
      name: "B",
    },
  ];
  expect(toTreeNodes(nodes)).toEqual([
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
      subNodes: [],
      childTreeNodeIds: [],
    },
    {
      id: "2-200",
      parentId: "0-0",
      parentTreeNodeId: "0-0",
      name: "B",
      pid: keyB.pid,
      subNodes: [],
      childTreeNodeIds: [],
    },
  ]);
});

test("toTreeNodes handles sub nodes", () => {
  const keyA = { pid: 10, startTime: 100 };
  const keyB = { pid: 20, startTime: 200 };
  const nodes = [
    {
      parent: fakeKey,
      realParent: rootKey,
      groupLeader: keyA,
      self: keyA,
      name: "A",
    },
    {
      parent: fakeKey,
      realParent: rootKey,
      groupLeader: keyA,
      self: { pid: 11, startTime: 110 },
      name: "A1",
    },
    {
      parent: fakeKey,
      realParent: rootKey,
      groupLeader: keyB,
      self: keyB,
      name: "B",
    },
    {
      parent: fakeKey,
      realParent: rootKey,
      groupLeader: keyB,
      self: { pid: 21, startTime: 210 },
      name: "B1",
    },
    {
      parent: fakeKey,
      realParent: rootKey,
      groupLeader: keyB,
      self: { pid: 22, startTime: 220 },
      name: "B2",
    },
  ];
  expect(toTreeNodes(nodes)).toEqual([
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
      subNodes: [
        {
          id: "11-110",
          name: "A1",
          pid: 11,
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
      subNodes: [
        {
          id: "21-210",
          name: "B1",
          pid: 21,
        },
        {
          id: "22-220",
          name: "B2",
          pid: 22,
        },
      ],
      childTreeNodeIds: [],
    },
  ]);
});

test("toTreeNodes handles deep trees", () => {
  const keyA = { pid: 1, startTime: 100 };
  const keyB = { pid: 2, startTime: 200 };
  const keyC = { pid: 3, startTime: 300 };
  const keyD = { pid: 40, startTime: 4000 };
  const keyD1 = { pid: 41, startTime: 4100 };
  const keyE = { pid: 5, startTime: 500 };
  const keyF = { pid: 6, startTime: 600 };

  const nodes = [
    {
      parent: fakeKey,
      realParent: rootKey,
      groupLeader: keyA,
      self: keyA,
      name: "A",
    },
    {
      parent: fakeKey,
      realParent: keyA,
      groupLeader: keyB,
      self: keyB,
      name: "B",
    },
    {
      parent: fakeKey,
      realParent: rootKey,
      groupLeader: keyC,
      self: keyC,
      name: "C",
    },
    {
      parent: fakeKey,
      realParent: keyC,
      groupLeader: keyD,
      self: keyD,
      name: "D",
    },
    {
      parent: fakeKey,
      realParent: fakeKey,
      groupLeader: keyD,
      self: keyD1,
      name: "D1",
    },
    {
      parent: fakeKey,
      realParent: keyD1,
      groupLeader: keyE,
      self: keyE,
      name: "E",
    },
    {
      parent: fakeKey,
      realParent: keyD,
      groupLeader: keyF,
      self: keyF,
      name: "F",
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
    subNodes: [],
    childTreeNodeIds: ["2-200"],
  });

  expect(result).toContainEqual({
    id: "2-200",
    parentId: "1-100",
    parentTreeNodeId: "1-100",
    name: "B",
    pid: keyB.pid,
    subNodes: [],
    childTreeNodeIds: [],
  });

  expect(result).toContainEqual({
    id: "3-300",
    parentId: "0-0",
    parentTreeNodeId: "0-0",
    name: "C",
    pid: keyC.pid,
    subNodes: [],
    childTreeNodeIds: ["40-4000"],
  });

  expect(result).toContainEqual({
    id: "40-4000",
    parentId: "3-300",
    parentTreeNodeId: "3-300",
    name: "D",
    pid: keyD.pid,
    subNodes: [
      {
        id: "41-4100",
        name: "D1",
        pid: keyD1.pid,
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
    subNodes: [],
    childTreeNodeIds: [],
  });

  expect(result).toContainEqual({
    id: "6-600",
    parentId: "40-4000",
    parentTreeNodeId: "40-4000",
    name: "F",
    pid: keyF.pid,
    subNodes: [],
    childTreeNodeIds: [],
  });
});
