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
下面是红黑树的运行效率，可以看到效率是对数级别，没有达到上节中哈希表的常数级别，但是二叉排序树支持有序操作


<style type="text/css">
.tg  {border-collapse:collapse;border-color:#ccc;border-spacing:0;}
.tg td{background-color:#fff;border-color:#ccc;border-style:solid;border-width:1px;color:#333;
  font-family:Arial, sans-serif;font-size:14px;overflow:hidden;padding:10px 5px;word-break:normal;}
.tg th{background-color:#f0f0f0;border-color:#ccc;border-style:solid;border-width:1px;color:#333;
  font-family:Arial, sans-serif;font-size:14px;font-weight:normal;overflow:hidden;padding:10px 5px;word-break:normal;}
.tg .tg-c3ow{border-color:inherit;text-align:center;vertical-align:top}
</style>
<table class="tg"><thead>
  <tr>
    <th class="tg-c3ow" colspan="2">最坏情况</th>
    <th class="tg-c3ow" colspan="2">平均情况</th>
  </tr></thead>
<tbody>
  <tr>
    <td class="tg-c3ow">查找</td>
    <td class="tg-c3ow">插入</td>
    <td class="tg-c3ow">查找</td>
    <td class="tg-c3ow">插入</td>
  </tr>
  <tr>
    <td class="tg-c3ow">$$2log_{2}N$$</td>
    <td class="tg-c3ow">$$2log_{2}N$$</td>
    <td class="tg-c3ow">$$log_{2}N$$</td>
    <td class="tg-c3ow">$$log_{2}N$$</td>
  </tr>
</tbody>
</table>

## 应用
### 验证合法性
```text
给定一个二叉树的根节点，判断是否为有效的二叉搜索树
```
验证二叉搜索树的关键在于检验节点的取值范围

<script defer type="text/tikz" data-tikz-libraries="positioning">
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

\node[draw=none] at (a) [right=0.01 of a,font=\small] {$(-\infty, +\infty)$};
\node[draw=none] at (b) [right=0.01 of b,font=\small] {$(-\infty, 5)$};
\node[draw=none] at (c) [right=0.01 of c,font=\small] {$(5, +\infty)$};
\node[draw=none] at (d) [right=0.01 of d,font=\small] {$(5, 7)$};
\node[draw=none] at (e) [right=0.01 of e,font=\small] {$(7, +\infty)$};
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

### 删除节点
```text
删除二叉搜索树中key对应的节点，保持二叉搜索树性质不变，不包含则不变
```

我们现在到key对应的节点
+ 如果节点的左子树非空，找到左子树中的前驱节点，和当前节点交换值，递归左子树删除节点
+ 如果节点的右子树非空，找到右子树中的后继节点，和当前节点交换值，递归右子树删除节点
+ 如果是叶子节点，直接删除即可

只和前驱或后继节点交换，能保证二叉搜索树的性质不变，以下图为例，刪除key=5的节点

<script defer type="text/tikz" data-tikz-libraries="positioning">
\begin{tikzpicture}[
level 1/.style = {sibling distance= 120pt},
level/.style={level distance=70pt, sibling distance=80pt},
every node/.style={circle, draw, node font=\large\bfseries, line width=1.5pt, minimum size=12mm},
gray node/.style={fill=gray!20,draw=gray!80},
]
\node[gray node] (a) {5} [line width=1pt]
    child {
        node (c) {3} 
        child { node (d) {2} }
        child { node (e) {4} }
    } 
    child {
        node {6} 
        child[missing]
        child { node {7} }
    }
;

\node[right=8 of a] {3} [line width=1pt]
    child {
        node[gray node] {5} 
        child { node {2} }
        child { node {4} }
    } 
    child {
        node {6} 
        child[missing]
        child { node {7} }
    }
;

\node[below=6 of a] (z) {3} [line width=1pt]
    child {
        node {2} 
        child { node[gray node] {5} }
        child { node {4} }
    } 
    child {
        node {6} 
        child[missing]
        child { node {7} }
    }
;

\node[right=8 of z] {3} [line width=1pt]
    child {
        node {2} 
        child[missing] 
        child { node {4} }
    } 
    child {
        node {6} 
        child[missing]
        child { node {7} }
    }
;
\end{tikzpicture}
</script>

```java
// https://leetcode.cn/problems/delete-node-in-a-bst/submissions/598596429
    public TreeNode deleteNode(TreeNode root, int key) {
        if (root == null) {
            return null;
        }
        if (root.val ==key && root.left == null && root.right == null) {
            return null;
        }
        deleteNode(root, key, null);
        return root;
    }
    
    private void deleteNode(TreeNode node, int key, TreeNode parent) {
        if (null == node) {
            return;
        }
    
        if (node.val != key) {
            if (key > node.val) {
                deleteNode(node.right, key, node);
            } else {
                deleteNode(node.left, key, node);
            }
            return;
        }
    
        if (node.left != null) {
            TreeNode pred = node.left;
            while (pred.right != null) {
                pred = pred.right;
            }
            node.val = pred.val;
            pred.val = key;
            deleteNode(node.left, key, node);
        } else if (node.right != null) {
            TreeNode succ = node.right;
            while (succ.left != null) {
                succ = succ.left;
            }
            node.val = succ.val;
            succ.val = key;
            deleteNode(node.right, key, node);
        } else {
            if (parent.left == node) {
                parent.left = null;
            } else {
                parent.right = null;
            }
        }
    }
```

### 第k小元素
```text
查找二叉搜索树中第k小的元素，从1开始计数
```

假设左子树有l个元素，显然根节点是第l+1小的元素  
+ 如果k<=l，结果显然在左子树中  
+ 如果k>l+1，结果显然在右子树中，求右子树中的第k-l-1个元素即可(排除了左子树和根节点中的l+1个元素)

```java
// https://leetcode.cn/problems/kth-smallest-element-in-a-bst/submissions/591925580
    public static class Result {
        int count;
        Integer value;
    
        public Result(int count, Integer value) {
            this.count = count;
            this.value = value;
        }
    }
    
    public int kthSmallest(TreeNode root, int k) {
        return getKth(root, k - 1).value;
    }
    
    /**
     从0开始计
     */
    public Result getKth(TreeNode root, int k) {
        if (root == null) {
            return new Result(0, null);
        }
    
        Result left = getKth(root.left, k);
        if (left.value != null) {
            return new Result(0, left.value);
        }
        if (k == left.count) {
            return new Result(0, root.val);
        }
        Result right = getKth(root.right, k - 1 - left.count);
        if (right.value != null) {
            return new Result(0, right.value);
        }
        return new Result(1 + left.count + right.count, null);
    }
```

### 中序后继
```text
给定一棵二叉搜索树，求指定节点p的中序后继，如果没有返回null
```

中序后继只有两种情况
+ 节点右子树中的最小节点
+ 没有右子树，则是最近的大于节点值的祖先节点(父节点到根节点路径上的全部节点)

```java
// https://leetcode.cn/problems/P5rCT8/submissions/604818500/
    public TreeNode inorderSuccessor(TreeNode root, TreeNode p) {
        return getSuccessor(root, null, null, p);
    }
    
    private TreeNode getSuccessor(TreeNode node, TreeNode parent, TreeNode parentSuccessor, TreeNode p) {
        if (node == null) {
            return null;
        }
    
        parentSuccessor = parent != null && parent.val > p.val ? parent : parentSuccessor;
    
        if (node != p) {
            return node.val < p.val ? getSuccessor(node.right, node, parentSuccessor, p)
                    : getSuccessor(node.left, node, parentSuccessor, p);
        }
    
        if (node.right == null) {
            return parentSuccessor;
        }
    
        TreeNode min = node.right;
        while (min.left != null) {
            min = min.left;
        }
        return min;
    }
```

### 二叉搜索树序列
```text
按照顺序插入生成一棵二叉搜索树的数组成为二叉搜索树序列
给定一个节点都不相同的二叉搜索树，输出全部二叉搜索树序列
```

<script defer type="text/tikz">
\begin{tikzpicture}[
level 1/.style = {sibling distance= 120pt},
level/.style={level distance=70pt, sibling distance=80pt},
every node/.style={circle, draw, node font=\large\bfseries, line width=1.5pt, minimum size=12mm},
gray node/.style={fill=gray!20,draw=gray!80},
]
\node (a) {3} [line width=1pt]
    child {
        node (c) {2}
        child { node (e) {1} }
        child[missing]
    } 
    child { node {4} }
;
\end{tikzpicture}
</script>

上树的序列有`[3,2,1,4]`、`[3,2,4,1]`、`[3,4,2,1]`三个  
我们可以用队列管理当前可插入的元素
+ 队列初始只包含根结点，即`[3]`
+ 根结点插入后，其左右子节点可插入，队列变为`[2,4]`(顺序不重要)
  + 插入2，则队列变为`[4,1]`
    + 再插入4和1，得到序列`[3,2,4,1]`
    + 再插入1和4，得到序列`[3,2,1,4]`
  + 插入4，则队列变为`[2]`，再插入2和1，得到序列`[3,4,2,1]`

实际上，二叉搜索树的序列就是拓扑排序的顺序

```java
// https://leetcode.cn/problems/bst-sequences-lcci/submissions/601159301
    public List<List<Integer>> BSTSequences(TreeNode root) {
        List<List<Integer>> result = new ArrayList<>();
        if (root == null) {
            result.add(new ArrayList<>());
            return result;
        }
        Deque<TreeNode> queue = new ArrayDeque<>();
        queue.add(root);
        search(queue, new ArrayList<>(), result);
        return result;
    }

    private void search(Deque<TreeNode> queue, List<Integer> buf, List<List<Integer>> result) {
        if (queue.isEmpty()) {
            result.add(new ArrayList<>(buf));
            return;
        }

        int size = queue.size();
        for (int i = 0; i < size; i++) {
            TreeNode item = queue.pollFirst();
            if (item.left != null) {
                queue.addLast(item.left);
            }
            if (item.right != null) {
                queue.addLast(item.right);
            }
            buf.add(item.val);
            search(queue, buf, result);
            buf.remove(buf.size() - 1);
            if (item.left != null) {
                queue.pollLast();
            }
            if (item.right != null) {
                queue.pollLast();
            }
            queue.addLast(item);
        }
    }
```
注意递归中队列的状态变化，每次插入一个元素，出队该元素，并将其子节点入队  
递归完毕后恢复队列，处理下一个元素

## 预告
本章内容到这里就结束了，主要讨论了二叉搜索树的性质及其应用，
后续可能会探讨二叉排序树简明易懂的实现方式以及更强大的应用，敬请期待😁