---
title:  "算法漫谈-单调栈"
date: 2025-02-17 13:50:00 +0800
categories: algorithm monotonic-stack 算法 单调栈
---

单调栈本质上就是一个队列，只是入队时将队尾大于(或小于)自身的元素出队，这使得它具有一些独特的性质。  
我们以数组[1,3,2,5,6]压入单调栈为例
+ [1]
+ [1,3]
+ [1,2]
+ [1,2,5]
+ [1,2,5,6]

可以看到单调栈具有如下性质：
+ 每一时刻都保持非递减顺序，队头元素最小
+ 排后的元素比前面的元素晚入队
+ 队列中的后一个元素，是前一个元素在数组中遇到的下一个更大的元素
+ 
## 下一个更大元素
```text
给定循环数组nums，返回nums中每个元素的下一个更大元素，没有则返回-1

输入: nums = [1,2,3,4,3]
输出: [2,3,4,-1,4]
```

循环数组一般的处理方式都是展开，而求下一个更大元素，我们可以利用递减单调栈的性质，  
每次入队将队尾较小的元素出队，这时就能记录出队元素的下一个更大元素，而一直留在栈中的元素没有下一个更大元素。

```java
// https://leetcode.cn/problems/next-greater-element-ii/submissions/610355485
    public int[] nextGreaterElements(int[] nums) {
        Deque<Integer> monoStack = new ArrayDeque<>();
        int[] result = new int[nums.length];
        int n = nums.length;
        for (int i = 0; i < n + n - 1; i++) {
            int v = nums[i % n];
            while (!monoStack.isEmpty() && nums[monoStack.peekLast() % n] < v) {
                if (monoStack.peekLast() < n) {
                    result[monoStack.peekLast()] = v;
                }
                monoStack.pollLast();
            }
            monoStack.addLast(i);
        }

        while (!monoStack.isEmpty()) {
            if (monoStack.peekLast() < n) {
                result[monoStack.peekLast()] = -1;
            }
            monoStack.pollLast();
        }
        return result;
    }
```
注意只记录下标为`[0,n)`的元素，循环队列后续元素不关注。

## 柱状图中的最大矩形
```text
给定n个非负整数，表示柱状图中的高度，每个柱子相邻，宽度为1。
求柱状图中，可以勾勒出来的矩形最大面积。
```

<script defer type="text/tikz">
\begin{tikzpicture}[
every node/.style={node font=\large\bfseries, line width=1.5pt, minimum size=12mm},
]

\foreach \x/\h/\v in {0/2/,1/1/,2/5/,3/6/,4/2/,5/3/} {
  \pgfmathsetmacro{\next}{int(\x+1)};
  \draw (\x,0) rectangle node (a\x) {\h} (\next,\h);
  \pgfmathsetmacro{\right}{int(\x+7)};
  \pgfmathsetmacro{\rNext}{int(\x+8)};
  \draw (\right,0) rectangle node (b\x) {\h} (\rNext,\h);
}

\draw[fill=lightgray, fill opacity=1] (9,0) rectangle node {10} (11,5);

\end{tikzpicture}
</script>

如上图,最大矩形面积为10。  
直接解法是求出每一根、每两根一直到每n根柱子能组成的最大矩形，复杂度在平方级别。  
线性解法是将每根柱子向左右展开，直到找到第一根小于柱子高度的柱子，或者遇到边界，得到矩形面积为柱子高度x柱子数量。  
如上图，高度为1和2的柱子就是高度为5的柱子展开时遇到的首个高度小于5的柱子。  
求左侧或右侧第一个小于自身的柱子，可以用单调栈在线性时间求得。


```java
// https://leetcode.cn/problems/largest-rectangle-in-histogram/submissions/544991244
    public int largestRectangleArea(int[] heights) {
        int[] leftSmaller = smallerArr(heights, false);
        int[] rightSmaller = smallerArr(heights, true);

        int max = 0;
        for (int i = 0; i < heights.length; i++) {
            max = Math.max(max, (rightSmaller[i] - leftSmaller[i] - 1) * heights[i]);
        }
        return max;
    }

    private int[] smallerArr(int[] heights, boolean leftToRight) {
        int[] smaller = new int[heights.length];
        Deque<Integer> monoStack = new ArrayDeque<>();
        int i = leftToRight ? 0 : heights.length - 1;
        while (leftToRight ? i != heights.length : i != -1) {
            while (!monoStack.isEmpty() && heights[monoStack.peekLast()] > heights[i]) {
                smaller[monoStack.pollLast()] = i;
            }
            monoStack.addLast(i);
            i += leftToRight ? 1 : -1;
        }
        while (!monoStack.isEmpty()) {
            smaller[monoStack.pollLast()] = leftToRight ? heights.length : -1;
        }
        return smaller;
    }
```



