---
title:  "动态规划第零讲"
date: 2025-02-17 02:50:00 +0800
categories: algorithm dynamic-programming 算法 动态规划
---

本章专门讲解典型的一维动态规划问题，这类问题不同题目间的差异极大，  
核心是找到状态的表示和状态间的转换关系，让我们从一个经典的问题开始。

## 打家劫舍
```text
给定一个非负数数组，从数组中取数，两个取数的位置之间至少间隔一个，求能取到的最大数量

输入：[2,7,9,3,1]
输出：12 (2+9+1)
```
这个问题的状态其实很容易枚举，int maxRob[i][j](0 <= i <= nums.length, 0 <= j <= 1)  
可以表示从左到右取数，取到位置i时，j==0表示不在该位置取数，j==1表示取数，这种情况下能取到的最大值。

$$
\begin{align*}
maxRob[0][0]&=0 \\
maxRob[0][1]&=nums[0] \\
maxRob[1][0]&=nums[0] \\
maxRob[1][1]&=nums[1] \\
maxRob[i][0]&=max(maxRob[i-1][0],maxRob[i-1][1]), i > 1 \\
maxRob[i][1]&=nums[i]+max(maxRob[i-2][0],maxRob[i-2][1],maxRob[i-1][0]), i > 1 \\
\end{align*}
$$

很容易理解，取了当前位置的数，就只能取上个位置没取数的值，或者上上个位置上最大的值，  
这样看这个题目是二维动态规划问题，实际上状态是可以合并到一维的

$$
\begin{align*}
maxRob[i][0]&=max(maxRob[i-1][0],maxRob[i-1][1]), i > 1 \\
maxRob[i][1]&=nums[i]+max(maxRob[i-2][0],maxRob[i-2][1],maxRob[i-1][0]), i > 1 \\
&=nums[i]+max(maxRob[i-2][0],maxRob[i-2][1]) \\
let\;rob[i]&=max(maxRob[i][0],maxRob[i][1]) \\
&=max(rob[i-1],nums[i]+rob[i-2])
\end{align*}
$$

我们重新定义rob[i]为从左到右取到位置i能取得的最大值(不论取不取位置i的数)，得到如下结论

$$
\begin{align*}
rob[0]&=nums[0] \\
rob[1]&=max(nums[0],nums[1]) \\
rob[i]&=max(rob[i-1],nums[i]+rob[i-2]),i > 1 \\
\end{align*}
$$

问题又回到一维了。动态规划问题都可以用自顶向下或自底向上两种方式解决，本质是一样的，一般自底向上的方式更快一点，因为省去了递归的堆栈调用。

```java
// https://leetcode.cn/problems/house-robber/submissions/606747322/
// 自底向上
    public int rob(int[] nums) {
        int[] rob = new int[nums.length];
        rob[0] = nums[0];
        if (nums.length > 1) {
            rob[1] = Math.max(nums[0], nums[1]);
        }
        for (int i = 2; i < nums.length; i++) {
            rob[i] = Math.max(rob[i - 1], nums[i] + rob[i - 2]);
        }
        return rob[nums.length - 1];
    }

// https://leetcode.cn/problems/house-robber/submissions/606748348
// 自顶向上
    public int rob(int[] nums) {
        Integer[] rob = new Integer[nums.length];
        return rob(nums.length - 1, nums, rob);
    }
    
    private int rob(int i, int[] nums, Integer[] rob) {
        if (i == 0) {
            return nums[0];
        }
        if (i == 1) {
            return Math.max(nums[0], nums[1]);
        }
        if (rob[i] != null) {
            return rob[i];
        }
        rob[i] = Math.max(rob(i - 1, nums, rob), nums[i] + rob(i - 2, nums, rob));
        return rob[i];
    }
```
自顶向上方法中定义的缓存数组类型是Integer[]，因为int默认值为0，属于有效的状态(比如数组全都是0)，无法判断出是未求值的状态，所以用封装类型。

## 汉诺塔
```text
将多个带孔圆盘穿在三根柱子上，圆盘移动规则如下
1. 圆盘只能从柱子上方移走
2. 圆盘只能放在地上或比它大的圆盘上
3. 每次只能移动一个圆盘
问圆盘初始都在柱子A上时，怎样都移动到另一根柱子C上

输入：A = [2, 1, 0], B = [], C = []
输出：C = [2, 1, 0]
```
这也是一道经典的递归问题，假设圆盘数量为n，我们可以将问题分解为3步
1. 将n-1个圆盘从A移到B上
2. 将最大的圆盘从A移到C上
3. 将n-1个圆盘从B移到C上

<script defer type="text/tikz" data-tikz-libraries="positioning,shapes.arrows,fit">
\begin{tikzpicture}[
every node/.style={node font=\large\bfseries, line width=1.5pt, minimum size=12mm},
]

\foreach \x/\v in {0/A,1/B,2/C} {
  \pgfmathsetmacro{\left}{0+\x-0.1};
  \pgfmathsetmacro{\right}{0+\x+0.1};
  \draw (\left,0) rectangle node (p0\x) {} (\right,3) node[at start, below] {\v};
}

\foreach \x/\v in {0/A,1/B,2/C} {
  \pgfmathsetmacro{\left}{4+\x-0.1};
  \pgfmathsetmacro{\right}{4+\x+0.1};
  \draw (\left,0) rectangle node (p1\x) {} (\right,3) node[at start, below] {\v};
}

\foreach \x/\v in {0/A,1/B,2/C} {
  \pgfmathsetmacro{\left}{8+\x-0.1};
  \pgfmathsetmacro{\right}{8+\x+0.1};
  \draw (\left,0) rectangle node (p2\x) {} (\right,3) node[at start, below] {\v};
}

\foreach \x/\v in {0/A,1/B,2/C} {
  \pgfmathsetmacro{\left}{12+\x-0.1};
  \pgfmathsetmacro{\right}{12+\x+0.1};
  \draw (\left,0) rectangle node (p3\x) {} (\right,3) node[at start, below] {\v};
}

\draw[fill=white, fill opacity=1] (-.5,0) rectangle (.5,0.2);
\draw[fill=white, fill opacity=1] (-.4,0.2) rectangle (.4,0.4);
\draw[fill=white, fill opacity=1] (-.3,0.4) rectangle (.3,0.6);

\draw[fill=white, fill opacity=1] (3.5,0) rectangle (4.5,0.2);
\draw[fill=white, fill opacity=1] (4.6,0) rectangle (5.4,0.2);
\draw[fill=white, fill opacity=1] (4.7,0.2) rectangle (5.3,0.4);

\draw[fill=white, fill opacity=1] (9.5,0) rectangle (10.5,0.2);
\draw[fill=white, fill opacity=1] (8.6,0) rectangle (9.4,0.2);
\draw[fill=white, fill opacity=1] (8.7,0.2) rectangle (9.3,0.4);

\draw[fill=white, fill opacity=1] (13.5,0) rectangle (14.5,0.2);
\draw[fill=white, fill opacity=1] (13.6,0.2) rectangle (14.4,0.4);
\draw[fill=white, fill opacity=1] (13.7,0.4) rectangle (14.3,0.6);

\node[single arrow, draw=black, thick, fill=white,
      minimum width=1pt, single arrow head extend=3pt,
      inner xsep=0pt, fit=(p02.east) (p10.west)] {};

\node[single arrow, draw=black, thick, fill=white,
      minimum width=1pt, single arrow head extend=3pt,
      inner xsep=0pt, fit=(p12.east) (p20.west)] {};

\node[single arrow, draw=black, thick, fill=white,
      minimum width=1pt, single arrow head extend=3pt,
      inner xsep=0pt, fit=(p22.east) (p30.west)] {};
\end{tikzpicture}
</script>

```java
// https://leetcode.cn/problems/hanota-lcci/submissions/606655920
    public void hanota(List<Integer> A, List<Integer> B, List<Integer> C) {
        move(A, A.size(), C, B);
    }
    
    private void move(List<Integer> src, int count, List<Integer> des, List<Integer> other) {
        if (count == 1) {
            des.add(src.get(src.size() - 1));
            src.remove(src.size() - 1);
            return;
        }
    
        move(src, count - 1, other, des);
        move(src, 1, des, other);
        move(other, count - 1, des, src);
    }
```

## 瓷砖平铺
```text
有两种形状的砖，一个是2x1的长条砖，一个是L形的3格砖，现在需要铺满2xn个方格的路面，砖可以旋转。
求出所有平铺的总数，结果对10^9+7取模。
平铺相同当且仅当一种平铺的每个砖块在另一种平铺的对应位置都是相同类型相同方向的砖块。
```

<script defer type="text/tikz">
\begin{tikzpicture}[
every node/.style={node font=\large\bfseries, line width=1.5pt, minimum size=12mm},
green node/.style={draw=none, fill=green!30, fill opacity=0.2},
gray node/.style={draw=none, fill=gray!30, fill opacity=0.2},
]
\draw[help lines] (0,0) grid (8,2);

\draw (0,0) rectangle (3,2) (4,0) rectangle (7,2);
\draw[green node] (0,0) rectangle (1,1) (0,1) rectangle (1,2);
\draw[green node] (4,1) rectangle (5,2) (5,1) rectangle (6,2);
\draw[gray node] (4,0) rectangle (5,1) (5,0) rectangle (6,1);
\end{tikzpicture}
</script>

如上图，仅处理2x1的砖还是很简单的，可以先竖铺两格，或者横铺两个2x1砖。  
设置总格子数为m=2xn，count[i]为铺满i格的平铺总数，那么竖铺两格就是count[i-2]，  
横铺两个2x1就是count[i-4]，问题出在L形砖要怎么处理。

<script defer type="text/tikz">
\begin{tikzpicture}[
every node/.style={node font=\large\bfseries, line width=1.5pt, minimum size=12mm},
green node/.style={draw=none, fill=green!30, fill opacity=0.2},
gray node/.style={draw=none, fill=gray, fill opacity=0.2},
]
\draw[help lines] (0,0) grid (12,2);

\draw (0,0) rectangle (3,2) (4,0) rectangle (7,2) (8,0) rectangle (11,2);
\draw[green node] (0,0) rectangle (1,1) (1,0) rectangle (2,1) (1,1) rectangle (2,2);
\path[dashed] (0,0) edge (2,2) (0,2) edge (2,0);

\draw[green node] (4,0) rectangle (5,1) (4,1) rectangle (5,2) (5,1) rectangle (6,2);
\draw[green node] (8,0) rectangle (9,1) (8,1) rectangle (9,2) (9,0) rectangle (10,1);
\end{tikzpicture}
</script>

显然图中的第一种摆法是不行的，这样空的一格始终无法填补，所以只能有后两种摆法，而它们是对称的，这样偶数块砖的铺法就确定了。

$$
count[i]=count[i-2]+count[i-4]+2count[i-3],i \bmod 2==0\;\&\&\;i >=6
$$

<script defer type="text/tikz">
\begin{tikzpicture}[
every node/.style={node font=\large\bfseries, line width=1.5pt, minimum size=12mm},
green node/.style={draw=none, fill=green!30, fill opacity=0.2},
gray node/.style={draw=none, fill=gray, fill opacity=0.2},
]
\draw[help lines] (0,0) grid (12,2);

\path (0,0) edge (0,1) (0,1) edge (1,1) (1,1) edge (1,2) (1,2) edge (3,2) (3,2) edge (3,0) (3,0) edge (0,0);
\draw[green node] (0,0) rectangle (1,1) (1,0) rectangle (2,1);

\path (4,0) edge (4,1) (4,1) edge (5,1) (5,1) edge (5,2) (5,2) edge (7,2) (7,2) edge (7,0) (7,0) edge (4,0);
\draw[green node] (4,0) rectangle (5,1) (5,0) rectangle (6,1) (5,1) rectangle (6,2);
\end{tikzpicture}
</script>

如上图，奇数格地砖的铺设因为是对称的，我们以一种样式举例即可，可以先横铺一个2x1砖，或者铺一个L形砖，  
这样奇数的铺法也解决了，整合起来就得到完整方案。

$$
count[i]=count[i-2]+count[i-3],i\bmod2==1\;\&\&\;i>=5
$$

```java
// https://leetcode.cn/problems/domino-and-tromino-tiling/submissions/606673999
    private static final int MOD = (int)1e9 + 7;

    public int numTilings(int n) {
        int[] memo = new int[n + n + 1];

        for (int i = 2; i <= n + n; i++) {
            if (i == 2) {
                memo[i] = 1;
            } else if (i == 3) {
                memo[i] = 1;
            } else if (i == 4) {
                memo[i] = 2;
            } else if (i == 5) {
                memo[i] = 2;
            } else {
                if (i % 2 == 0) {
                    memo[i] = mod(mod(mod(memo[i - 2] + memo[i - 4]) + memo[i - 3]) + memo[i - 3]);
                } else {
                    memo[i] = mod(memo[i - 2] + memo[i - 3]);
                }
                
            }
        }

        return memo[n + n];
    }

    private int mod(int v) {
        return v % MOD;
    }
```
+ 小于5的铺法都需要手动求解
+ 注意mod的使用，每次相加都需要取模

## 乘积最大子数组
```text
给定整数数组nums，找出乘积最大的非空连续子数组，并返回乘积
保证每个子数组的乘积都是32位整数

输入: nums = [2,3,-2,4]
输出: 6 ([2,3])
```

这题需要利用整数乘法的性质，当非零整数和其他非零整数相乘时，乘积的绝对值是非减的，  
所以只要没遇到零，我们总会得到一个最大乘积或最小乘积，记录起来就能得到最终结果。 

```java
// https://leetcode.cn/problems/maximum-product-subarray/submissions/607002906
    public int maxProduct(int[] nums) {
        int min = nums[0], max = nums[0];
        int result = nums[0];

        for (int i = 1; i < nums.length; i++) {
            int maxProduct = nums[i] * max;
            int minProduct = nums[i] * min;
            min = Math.min(nums[i], Math.min(maxProduct, minProduct));
            max = Math.max(nums[i], Math.max(maxProduct, minProduct));
            result = Math.max(result, max);
        }
        return result;
    }
```
解释一下，这里min是指以i结尾的子数组乘积的最小值，而max是以i结尾的子数组乘积的最大值，由于使用了比较省去了符号的判断，比较简洁。  
另外需要注意，直接从左到右计算乘积不一定能取得最大值，例如[2,-5,-2,-4,3]，从左到右只能得到20，而从右到左才能得到真最大值24，需要计算两轮。

## 最长递增子序列
```text
给定整数数组nums，找到最长严格递增子序列的长度

输入：nums = [10,9,2,5,3,7,101,18]
输出：4
解释：最长递增子序列是 [2,3,7,101]，因此长度为 4 。
```

想让递增子序列尽可能长，就需要结尾的元素尽可能小，给后续元素预留更大的空间，  
所以可以定义数组minTail[i]表示长度为i+1的递增子序列的最小结尾元素，0 <= i < nums.length  
最初数组为空，遍历第一个元素直接加入数组，表示长度1的递增子序列结尾元素为nums[0]
+ 继续遍历，如果新元素大于数组尾部元素，加入数组，组成长度+1的递增子序列
+ 新元素等于数组尾部元素，忽略
+ 新元素小于尾部元素，替换掉数组中从左到右首个大于新元素的元素

以nums = [10,9,2,5,3,7,101,18]举例
+ 加入10，minTail=[10]
+ 加入9，minTail=[9]
+ 加入2，minTail=[2]
+ 加入5，minTail=[2,5]
+ 加入3，minTail=[2,3]
+ 加入7，minTail=[2,3,7]
+ 加入101，minTail=[2,3,7,101]
+ 加入18，minTail=[2,3,7,18]，结果为数组长度4

可以使用二分查找找到插入位置，这样算法时间复杂度就约为$$O(Nlog_2N)$$

```java
// https://leetcode.cn/problems/longest-increasing-subsequence/submissions/597425293
    public static class Queue {
        int[] arr;
        int size;

        public Queue(int cap) {
            arr = new int[cap];
            size = 0;
        }

        public void insert(int num) {
            if (size == 0 || num > arr[size - 1]) {
                arr[size++] = num;
                return;
            }

            int l = 0, r = size;
            while (l < r) {
                int mid = l + (r - l) / 2;
                int v = arr[mid];
                if (v >= num) {
                    r = mid;
                } else {
                    l = mid + 1;
                }
            }
            arr[l] = num;
        }

        public int size() {
            return size;
        }
    }

    public int lengthOfLIS(int[] nums) {
        Queue queue = new Queue(nums.length);
        for (int n : nums) {
            queue.insert(n);
        }

        return queue.size();
    }
```

## 等和子集
```text
给定正整数非空数组nums，判断是否可以将数组分为两个非空子集，使得两子集元素和相等

输入：nums = [1,5,11,5]
输出：true
解释：数组可以分割成 [1, 5, 5] 和 [11] 。

输入：nums = [1,2,3,5]
输出：false
解释：数组不能分割成两个元素和相等的子集。
```
此问题等价于，判断是否存在非空子集，其元素和等于数组总元素和的一半。  
这是典型的0-1背包问题，正向遍历子集是不可能的，数量会达到$$2^n$$,  
但是可以用动态规划解决，首先设定状态canMake[i][j],0 <= i < nums.length, 0 <= j <= target，  
target即目标和，canMake[i][j]表示数组从左到右依次选择元素，[0,i]的元素都选择完(其中每个元素都可选可不选)，是否能使和等于j

$$
\begin{align*}
canMake[i][0]&=true \\
canMake[0][nums[0]]&=true \\
canMake[0][j\;!=\;nums[0]\;\&\&\;j\;!=\;0]&=false \\
canMake[i][j]&=canMake[i-1][j],nums[i]>j \\
&=canMake[i-1][j]\;||\;canMake[i-1][j-nums[i]],nums[i]<=j
\end{align*}
$$

+ 第一个条件是，目标和为0一定能满足，为恒真
+ 第二个是，只选第一个元素，只能组成0或这个元素的值
+ 第三个是，nums[i]大于j时，无法选择元素i，只能参考canMake[i-1][j]
+ 第四个是，nums[i]不大于j时，可以选择元素i，不选i则参考canMake[i-1][j]，选择i则参考canMake[i-1][j-nums[i]]

```java
// https://leetcode.cn/problems/partition-equal-subset-sum/submissions/545262717
    public boolean canPartition(int[] nums) {
        int sum = nums[0], max = nums[0];
        for (int i = 1; i < nums.length; i++) {
            sum += nums[i];
            max = Math.max(max, nums[i]);
        }

        int target = sum >> 1;

        if ((sum & 1) == 1 || max > target) {
            return false;
        }

        boolean[][] memo = new boolean[nums.length][target + 1];

        for (int i = 0; i < nums.length; i++) {
            for (int j = 0; j <= target; j++) {
                if (j == 0) {
                    memo[i][j] = true;
                } else if (i == 0) {
                    memo[i][j] = j == nums[0];
                } else {
                    if (nums[i] <= j) {
                        memo[i][j] = memo[i - 1][j - nums[i]] || 
                        memo[i - 1][j];
                    } else {
                        memo[i][j] = memo[i - 1][j];
                    }
                }
            }
        }

        return memo[nums.length - 1][target];
    }
```

## 最长有效括号
```text
给定只包含左右括号的字符串s，求最长有效括号子串的长度

输入：s = "(()"
输出：2 "()"

输入：s = ")()())"
输出：4 "()()"
```

定义int maxLen[i]为下标范围是[0,i]，且以i结尾的最长有效括号子串长度，0 <= i < s.length
+ maxLen[0]=0，单个括号无法构成有效子串
+ s[i]='('时，maxLen[i]=0，左括号结尾无法构成有效子串
+ s[i]=')'时，先找到对应左括号使括号闭合，即判断i-maxLen[i-1]-1位置是不是左括号
  + 不是左括号，括号无法闭合，maxLen[i]=0
  + 是左括号，再看maxLen[i-maxLen[i-1]-2]的长度，拼接上maxLen[i-1]+2即为maxLen[i]

以`(()(()())`举例，查看i=8的求解

<script defer type="text/tikz">
\begin{tikzpicture}[
every node/.style={node font=\large\bfseries, line width=1.5pt, minimum size=12mm},
gray node/.style={fill=gray!20},
blue node/.style={fill=blue!20},
green node/.style={fill=green!20},
]

\foreach \x/\v/\type in {0/(/,1/(/blue node,2/)/blue node,3/(/green node,4/(/gray node,5/)/gray node,6/(/gray node,7/)/gray node,8/)/green node} {
  \pgfmathsetmacro{\next}{\x+1};
  \draw[\type] (\x,0) rectangle (\next,1) node[midway] (a\x) {$\v_{\x}$};
}

\foreach \x/\v in {0/0,1/0,2/2,3/0,4/0,5/2,6/0,7/4,8/?} {
  \pgfmathsetmacro{\next}{\x+1};
  \draw (\x,-1) rectangle (\next,0) node[midway] (b\x) {$\v$};
}
\end{tikzpicture}
</script>

可以清楚看到maxLen[8]由i=3和i=8的括号包围的有效括号`()()`以及前面拼接的`()`组成，长度为2+4+2=8

$$
\begin{align*}
maxLen[0]&=0 \\ 
maxLen[i]&=0,s[i]=( \\
maxLen[i]&=0,i-maxLen[i-1]-1 < 0\;||\;s[i-maxLen[i-1]-1]=) \\
maxLen[i]&=2+maxLen[i-1], s[i-maxLen[i-1]-1]=(\;\&\&\;i-maxLen[i-1]-2 < 0\\
maxLen[i]&=2+maxLen[i-1]+maxLen[i-maxLen[i-1]-2], s[i-maxLen[i-1]-1]=(\;\&\&\;i-maxLen[i-1]-2 >= 0\\
\end{align*}
$$

```java
// https://leetcode.cn/problems/longest-valid-parentheses/submissions/607323344
    public int longestValidParentheses(String s) {
        int[] maxLen = new int[s.length()];
        int max = 0;
        
        for (int i = 1; i < s.length(); i++) {
            char c = s.charAt(i);
            if (c == '(') {
                continue;
            }
            if (i - maxLen[i - 1] - 1 < 0 || s.charAt(i - maxLen[i - 1] - 1) == ')') {
                continue;
            }
            maxLen[i] = 2 + maxLen[i - 1] + (i - maxLen[i - 1] - 2 >= 0 ? maxLen[i - maxLen[i - 1] - 2] : 0);
            max = Math.max(max, maxLen[i]);
        }
        return max;
    }
```