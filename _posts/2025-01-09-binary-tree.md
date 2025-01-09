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


## 结语
二叉树是理解递归的绝佳方式，也有助于图和森林的学习，希望本文能以点带面，帮大家拓宽思路、加深理解。