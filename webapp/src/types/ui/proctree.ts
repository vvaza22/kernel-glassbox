export type SubTreeNode = {
  id: string;
  name: string;
  pid: number;
};

export type TreeNode = {
  id: string;
  // parentId may point to a TreeNode or SubTreeNode
  parentId: string;
  // parentTreeNodeId always points to a TreeNode
  parentTreeNodeId: string;
  name: string;
  pid: number;
  startTime: number;
  subNodes: SubTreeNode[];
  childTreeNodeIds: string[];
};

export type Pos = {
  x: number;
  y: number;
};

export type LeaderNodeData = {
  id: string;
  name: string;
  pid: number;
  startTime: number;
  numSubNodes: number;
  hasChildren: boolean;
  expanded: boolean;
  onExpandToggle: (id: string) => void;
};

export type SubNodeData = {
  name: string;
  pid: number;
};
