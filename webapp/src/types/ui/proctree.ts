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
  subNodes: SubTreeNode[];
  childTreeNodeIds: string[];
};

export type Pos = {
  x: number;
  y: number;
};
