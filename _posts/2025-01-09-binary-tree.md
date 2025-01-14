---
title:  "算法漫谈-二叉树"
date: 2025-01-09 21:30:44 +0800
categories: algorithm sum 算法 二叉树
---

这里默认大家已经对二叉树有基本的认识，在这个基础上做一下拓展和巩固。
## 表示
本文沿用力扣中的二叉树节点定义，包含左右节点和整数值
```java
 public class TreeNode {
     int val;
     TreeNode left;
     TreeNode right;
     TreeNode(int val, TreeNode left, TreeNode right) {
         this.val = val;
         this.left = left;
         this.right = right;
     }
 }
```

## 遍历
二叉树的遍历方式一般有四种
+ 先序
+ 中序
+ 后序
+ 层次

我们通过题目来看怎么应用各种遍历
### 后序
```text
https://leetcode.cn/problems/lowest-common-ancestor-of-a-binary-tree
给定二叉树，找到两个指定节点p、q的最近公共祖先。
祖先是一个节点从父节点上溯到根节点路径中的所有节点（包含节点自身）。
最近公共祖先是两个节点公共祖先中深度最大的。
```

如下图，p=5，q=1

<script defer type="text/tikz">
\begin{tikzpicture}[
level 1/.style = {sibling distance= 120pt},
level/.style={level distance=70pt, sibling distance=70pt},
every node/.style={circle, draw, node font=\large\bfseries, line width=1.5pt, minimum size=12mm},
]
\node {3} [line width=1pt]
    child {
        node {5} edge from parent [green!30,draw]
        child[black] { node {6}}
        child[black] {
            node {2}
            child {node {7}}
            child {node {4}}
        }
    }   
    child {
        node {1} edge from parent [green!30,draw]
        child[black] {node {0}}
        child[black] {node {8}}
    }
;
\end{tikzpicture}
</script>

很明显，根节点3是节点5和1的最近公共祖先<br>
要求解这个问题，我们需要三部分信息
+ 当前节点是不是p或者q
+ 左子树中是否包含p或者q
+ 右子树中是否包含p或者q

在子树结果从下到上收集的过程中，只要某个节点最先满足p和q都包含在子树中或者等于自身<br>
这个节点就是最近公共祖先

```java
// https://leetcode.cn/problems/lowest-common-ancestor-of-a-binary-tree/submissions/592388405
    TreeNode result;

    public TreeNode lowestCommonAncestor(TreeNode root, TreeNode p, TreeNode q) {
        result = null;
        traverse(root, p, q);
        return result;
    }

    public boolean[] traverse(TreeNode root, TreeNode p, TreeNode q) {
        if (root == null) {
            return null;
        }

        boolean[] left = traverse(root.left, p, q);
        boolean[] right = traverse(root.right, p, q);

        boolean[] pair = null;
        pair = new boolean[2];

        pair[0] = (p == root) || (left != null && left[0]) || (right != null && right[0]);
        pair[1] = (q == root) || (left != null && left[1]) || (right != null && right[1]);

        if (pair[0] && pair[1] && result == null) {
            result = root;
        }
        return pair;
    }
```
+ pair[0]表示当前节点及其子树是否包含p
+ pair[1]表示当前节点及其子树是否包含q
+ traverse在左右子树都处理完之后才执行判断，所以是后序遍历
+ 仅当`result==null`时才赋值，所以取的是深度最大的公共祖先
+ result也可以包装在递归函数的返回值中，而不是作为成员变量被共享

### 层次
```text
https://leetcode.cn/problems/binary-tree-right-side-view
想象站在二叉树右侧向左看，返回从上到下看到的节点值
```
以下树为例

 <script defer type="text/tikz">
\begin{tikzpicture}[
level/.style={level distance=70pt, sibling distance=70pt},
rightnode/.style={circle, draw=blue!60, fill=teal!20, node font=\large\bfseries, line width=1.5pt, minimum size=12mm},
circlenode/.style={draw=olive, fill=lightgray!20, circle, node font=\large\bfseries, line width=0.5pt, minimum size=12mm},
]
\node[rightnode] {1} [line width=1pt]
    child {
        node[circlenode] {2}
        child {
            node[rightnode] {4}
            child {
                node[rightnode] {5}
            }
        }
    }
    child { node[rightnode] {3} }
;
\end{tikzpicture}
</script>

输出为[1,3,4,5]<br>
这是很典型可以用层次遍历解决的问题<br>
但我们也可以使用先序遍历+记录层数来解决
```java
// https://leetcode.cn/problems/binary-tree-right-side-view/submissions/591974945
    public List<Integer> rightSideView(TreeNode root) {
        List<Integer> result = new ArrayList<>();
        rightSideView(root, result, 0);
        return result;
    }

    public void rightSideView(TreeNode root, List<Integer> result, int level) {
        if (root == null) {
            return;
        }

        if (level == result.size()) {
            result.add(root.val);
        }

        rightSideView(root.right, result, level + 1);
        rightSideView(root.left, result, level + 1);
    }
```
+ 采用`根右左`的顺序，首先访问到每一层最右边的元素
+ result仅记录每一层第一个访问的元素

## 构造
要唯一表示一个二叉树，可以在遍历中记录空节点

<script defer type="text/tikz">
\begin{tikzpicture}[
level/.style={level distance=70pt, sibling distance=70pt},
every node/.style={circle, draw=black, node font=\large\bfseries, line width=1.5pt, minimum size=12mm},
]
\node {1} [line width=1pt]
    child {node {2}}
    child{
        node {3}
        child {node {4}}
        child {node {5}}
    }
;
\end{tikzpicture}
</script>

上述二叉树可以表示成`"1,2,x,x,3,4,x,x,5,x,x"`这个字符串，逗号分隔并且空节点用x表示<br>
这样就可以序列化/反序列化二叉树
```java
// https://leetcode.cn/problems/serialize-and-deserialize-binary-tree/submissions/592468278/
// Encodes a tree to a single string.
    public String serialize(TreeNode root) {
        StringBuilder builder = new StringBuilder();
        encode(root, builder);
        return builder.toString();
    }
    
    public void encode(TreeNode root, StringBuilder builder) {
        if (builder.length() != 0) {
            builder.append(",");
        }
    
        if (root == null) {
            builder.append("x");
            return;
        }
    
        builder.append(String.valueOf(root.val));
        encode(root.left, builder);
        encode(root.right, builder);
    }
    
    int idx;
    // Decodes your encoded data to tree.
    public TreeNode deserialize(String data) {
        String[] nodeArr = data.split(",");
        idx = 0;
        return decode(nodeArr);
    }
    
    public TreeNode decode(String[] nodeArr) {
        String strVal = nodeArr[idx++];
        if (strVal.equals("x")) {
            return null;
        } else {
            TreeNode node = new TreeNode(Integer.parseInt(strVal));
            node.left = decode(nodeArr);
            node.right = decode(nodeArr);
            return node;
        }
    }
```

而对于每个节点值都不同的二叉树，还可以通过`前序+中序`或者`后序+中序`来构造<br>
这里我们只讲解`前序+中序`，仍以下图举例

<script defer type="text/tikz">
\begin{tikzpicture}[
level/.style={level distance=70pt, sibling distance=70pt},
every node/.style={circle, draw=black, node font=\large\bfseries, line width=1.5pt, minimum size=12mm},
]
\node {1} [line width=1pt]
    child {node {2}}
    child{
        node {3}
        child {node {4}}
        child {node {5}}
    }
;
\end{tikzpicture}
</script>

前序为`[1,2,3,4,5]`，中序为`[2,1,4,3,5]`
+ 根节点为1,查找在中序中的对应位置，可以分出左右子树[<font color="Salmon">2,</font>1,<font color="green">4,3,5</font>]
+ 再分别递归左右子树，即可组装整颗树

```java
// https://leetcode.cn/problems/construct-binary-tree-from-preorder-and-inorder-traversal/submissions/592539760
    public TreeNode buildTree(int[] preorder, int[] inorder) {
        Map<Integer, Integer> valToIdx = new HashMap<>();
        for (int i = 0; i < inorder.length; i++) {
            valToIdx.put(inorder[i], i);
        }
        return build(preorder, inorder, 0, preorder.length, 0, inorder.length, valToIdx);
    }
    
    public TreeNode build(int[] preorder, int[] inorder, int preL, int preR, int inL, int inR, Map<Integer, Integer> valToIdx) {
        if (preL == preR) {
            return null;
        }
        int v = preorder[preL];
        int mid = valToIdx.get(v);
        int leftLen = mid - inL;
    
        TreeNode node = new TreeNode(v);
        node.left = build(preorder, inorder, preL + 1, preL + 1 + leftLen, inL, inL + leftLen, valToIdx);
        node.right = build(preorder, inorder, preL + 1 +leftLen, preR, inL + leftLen + 1, inR, valToIdx);
        return node;
    }
```
+ 首先用Map记录节点值到中序数组下标的映射，这样查询父节点只需要常数时间
+ 构造时，前序数组的第一个元素为当前子树的根节点，在中序数组中查询到对应元素后，就知道了左右子树在两个数组中的位置，进行递归即可

## 路径
首先看一个基础问题
```text
给定根节点和表示目标和的整数targetSum，判断该树中是否存在 根节点到叶子节点 的路径，
这条路径上所有节点值相加等于targetSum
```
示例如下

<script defer type="text/tikz">
\begin{tikzpicture}[
level 1/.style = {sibling distance= 120pt},
level/.style={level distance=70pt, sibling distance=70pt},
every node/.style={circle, draw, node font=\large\bfseries, line width=1.5pt, minimum size=12mm},
edge from parent/.style={line width=1pt, draw},
bluenode/.style={fill=teal!20}
]
\node[bluenode] {5} 
    child { node[bluenode] {4}
        child { node[bluenode] {11}
            child { node {7}}
            child { node[bluenode] {2}}
        }
    }
    child { node {8}
        child { node {13}}
        child { node {4}}
    }
;
\end{tikzpicture}
</script>

上图中即存在`5+4+11+2=22`的路径<br>
要计算根节点到叶子结点的路径和，只需记录从根节点到父节点的路径和即可<br>
在参数中保存路径和，返回值传递是否已找到符合的路径和
```java
// https://leetcode.cn/problems/path-sum/submissions/591770280
    public boolean hasPathSum(TreeNode root, int targetSum) {
        return hasPathSum(root, targetSum, 0);
    }

    public boolean hasPathSum(TreeNode root, int targetSum, int sum) {
        if (root == null) {
            return false;
        }

        if (root.left == null && root.right == null) {
            return sum + root.val == targetSum;
        }

        return hasPathSum(root.left, targetSum, sum + root.val ) ||
        hasPathSum(root.right, targetSum, sum + root.val); 
    }
```

### 单向路径和
现在加大难度
```text
给定二叉树和整数targetSum，求二叉树中路径和等于targetSum的路径总数
路径起点不需要是根节点，终点也不需要是叶子结点，但是方向只能从父节点到子节点
```
<script defer type="text/tikz">
\begin{tikzpicture}[
level 1/.style = {sibling distance= 120pt},
level/.style={level distance=70pt, sibling distance=70pt},
every node/.style={circle, draw, node font=\large\bfseries, line width=1.5pt, minimum size=12mm},
edge from parent/.style={line width=1pt, draw},
bluenode/.style={fill=teal!20},
]
\node {10} 
    child { node[bluenode] {5}
        child { node[bluenode] {3} edge from parent [blue!50]
            child[black] { node {3}}
            child[black] { node {-2}}
        }
        child { node[bluenode]{2} edge from parent [red!35]
            child[missing] 
            child[black] { node[bluenode] {1} edge from parent [red!35] }
        }
    }
    child { node[bluenode] {-3}
        child[missing]
        child { node[bluenode] {11} edge from parent [violet!50] }
    }
;
\end{tikzpicture}
</script>
图中路径和为8的三条路径已用不同颜色标注<br>
+ 要求出`任意单向路径的和是否等于目标值`需要用到前缀和数组
+ 前缀和数组即从根节点到某一节点过程中，每到一个节点都记录路径和组成的数组
<script defer type="text/tikz">
\begin{tikzpicture}[
level 1/.style = {sibling distance= 120pt},
level/.style={level distance=70pt, sibling distance=70pt},
every node/.style={circle, draw, node font=\large\bfseries, line width=1.5pt, minimum size=12mm},
edge from parent/.style={line width=1pt, draw},
bluenode/.style={fill=teal!20},
]
\node[bluenode] (a) {10} 
    child { node[bluenode] (b) {5} edge from parent [blue!50]
        child[black] { node[bluenode] (c) {3} edge from parent [blue!50]
            child[black] { node[bluenode] (d) {3} edge from parent [blue!50] }
            child[black] { node {-2}}
        }
        child[black] { node{2}
            child[missing] 
            child { node {1} }
        }
    }
    child { node {-3}
        child[missing]
        child { node {11} }
    }
;
\end{tikzpicture}
</script>
+ 如上图中的路径，前缀和数组为[10, 15, 18, 21]
+ `10->3`这条路径中的任意一个子路径，都可以由前缀和数组中两个元素的差值表示
+ 比如`18-10=8`就表示`5->3`这条子路径

```java
// https://leetcode.cn/problems/path-sum-iii/submissions/592980493
    public int pathSum(TreeNode root, int targetSum) {
        Map<Long, Integer> prefixSumToCount = new HashMap<>();
        prefixSumToCount.put(0L, 1);
        return pathSum(root, targetSum, 0, prefixSumToCount);
    }
    
    public int pathSum(TreeNode root, int targetSum, long sum, Map<Long, Integer> prefixSumToCount) {
        if (root == null) {
            return 0;
        }
    
        int v = root.val;
        int result = prefixSumToCount.getOrDefault(sum + v - targetSum, 0);
        int count = prefixSumToCount.getOrDefault(sum + v, 0);
        prefixSumToCount.put(sum + v, count + 1);
        result += pathSum(root.left, targetSum, sum + v, prefixSumToCount);
        result += pathSum(root.right, targetSum, sum + v, prefixSumToCount);
        prefixSumToCount.put(sum + v, count);
        return result;
    }
```
+ 算法中用Map记录了前缀和数组的值及出现的次数
+ 每次都查找最新的前缀和-targetSum是否等于之前的前缀和，有则计入结果
+ Map首先添加0出现1次，是对应前缀和本身而非差值等于目标值的情况

### 最大路径和
到这里可以搬出这期最有难度的一个题目了
```text
给定一个二叉树，返回其 最大路径和
路径至少包含一个节点，且同一个节点在一条路径中最多出现一次
```

<script defer type="text/tikz">
\begin{tikzpicture}[
level 1/.style = {sibling distance= 120pt},
level/.style={level distance=70pt, sibling distance=70pt},
every node/.style={circle, draw, node font=\large\bfseries, line width=1.5pt, minimum size=12mm},
edge from parent/.style={line width=1pt, draw},
bluenode/.style={fill=teal!20},
]
\node {-10} 
    child {node {9}}
    child {node[bluenode] {20}
        child {node[bluenode] {15} edge from parent [blue!60]}
        child {node[bluenode] {7} edge from parent [blue!60]}
    }
;
\end{tikzpicture}
</script>

上例中的最大路径和如图所示，为`15->20->7=42`<br>
首先我们下一个推论，二叉树中的路径都有且只有一个深度最小的节点，证明如下
+ 使用反证法，假设路径中至少有两个深度最小的节点
+ 由于二叉树中相邻节点都是父子关系，则路径在这两个节点各自的子树当中
+ 由于两个子树中的路径一定是相连的，则相连的这个节点处在两个子树中
+ 这个相连的节点一定在两个子树中都有父节点，这显然是不可能的
+ 所以结论为`二叉树路径中有且只有一个深度最小的节点`，姑且称为路径的`根节点`

这个根节点将路径分为三个部分，`左子树中的路径`+`根节点`+`右子树中的路径`<br>
这样我们就可以采用递归的方式，分别求`以左子节点结束的最大路径`和`以右子节点结束的最大路径`<br>
通过根节点连接，就能求出当前节点作为根节点的最大路径和，遍历所有节点即可得到最大值
```java
// https://leetcode.cn/problems/binary-tree-maximum-path-sum/submissions/591819333
    Integer max;
    
    public int maxPathSum(TreeNode root) {
        max = null;
        maxSumThroughNode(root);
        return max;
    }
    
    public int maxSumThroughNode(TreeNode root) {
        if (root == null) {
            return 0;
        }
        int leftSum = maxSumThroughNode(root.left);
        int rightSum = maxSumThroughNode(root.right);
        if (max == null) {
            max = root.val + leftSum + rightSum;
        } else {
            max = Math.max(max, root.val + leftSum + rightSum);
        }
        return Math.max(0, Math.max(leftSum, rightSum) + root.val);
    }
```
> 💡 注意，最后一个语句返回了以根节点结束的最大路径和，即左子树和右子树中较大的路径加上根节点的值，
> 但这个值可能是负的，这时直接返回0，表示抛弃该路径

## 结语
二叉树是理解递归的绝佳方式，也有助于图和森林的学习，希望本文能以点带面，帮大家拓宽思路、加深理解。