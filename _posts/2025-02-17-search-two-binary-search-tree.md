---
title:  "查找第一讲-二叉搜索树"
date: 2025-02-17 02:30:00 +0800
categories: algorithm binary-search-tree 算法 二叉搜索树
---

上一节中的哈希表只能通过键查询值，而不能进行有序查找，比如查询最大最小的键、查找第k大的元素、按顺序遍历键等等  
而本节的二叉排序树就具有有序查找的能力，让我们看看是什么原理。

## 实现
二叉搜索树本身很简单，只是二叉树加上一些限制
+ 节点的值大于所有左子树中的值
+ 节点的值小于所有右子树中的值

每个节点设为一个键值对，以键作比较，就成了一个有序的哈希表

<script defer type="text/tikz">
\begin{tikzpicture}[
level 1/.style = {sibling distance= 120pt},
level/.style={level distance=70pt, sibling distance=70pt},
every node/.style={circle, draw, node font=\large\bfseries, line width=1.5pt, minimum size=12mm},
]
\node {6} [line width=1pt]
    child {
        node {2} 
        child[black] { node {1}}
        child[black] {
            node {4}
        }
    }   
    child {
        node {10} 
    }
;
\end{tikzpicture}
</script>

查询二叉搜索树只需要对比节点的值，不相等就递归左子树或右子树即可，效率取决于树的高度  
而平衡的二叉树高度约为$$log_{2}n$$，n为节点总数，所以算法的关键在于树的平衡  
常用的平衡树算法有红黑树、AVL树等，本章不细究二叉搜索树的实现，主要关注应用和各个操作的效率

## 应用
### 验证合法性
```text
给定一个二叉树的根节点，判断是否为有效的二叉搜索树
```
验证二叉搜索树的关键在于检验节点的取值范围

<script defer type="text/tikz">
\begin{tikzpicture}[
level 1/.style = {sibling distance= 120pt},
level/.style={level distance=70pt, sibling distance=80pt},
every node/.style={circle, draw, node font=\large\bfseries, line width=1.5pt, minimum size=12mm},
]
\node (a) {5} [line width=1pt]
    child { node (b) {1} }   
    child {
        node (c) {7} 
        child { node (d) {6} }
        child { node (e) {8} }
    }
;

\node[draw=none] at (a) [right=0.01 of a,font=\small] {$(-\infty\sim+\infty)$};
\node[draw=none] at (b) [right=0.01 of b,font=\small] {$(-\infty\sim5)$};
\node[draw=none] at (c) [right=0.01 of c,font=\small] {$(5\sim+\infty)$};
\node[draw=none] at (d) [right=0.01 of d,font=\small] {$(5\sim7)$};
\node[draw=none] at (e) [right=0.01 of e,font=\small] {$(7\sim+\infty)$};
\end{tikzpicture}
</script>

左右子树会把区间一分为二，我们每次检验左右子树里的值是否在区间内即可判断合法性

```java
// https://leetcode.cn/problems/validate-binary-search-tree/submissions/591973685
    public boolean isValidBST(TreeNode root) {
        return isValidBST(root, null, null);
    }
    
    public boolean isValidBST(TreeNode root, Integer min, Integer max) {
        if (root == null) {
            return true;
        }
    
        if (max != null && root.val >= max) {
            return false;
        }
        if (min != null && root.val <= min) {
            return false;
        }
    
        return isValidBST(root.left, min, root.val) && isValidBST(root.right, root.val, max);
    }
```
注意父节点和左右子树区间的传递
+ 左子树上限为父节点值(不包含)，下限继承父节点
+ 右子树下限为父节点值(不包含)，上限继承父节点