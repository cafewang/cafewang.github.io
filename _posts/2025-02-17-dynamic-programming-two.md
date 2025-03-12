---
title:  "动态规划第一讲"
date: 2025-02-17 03:50:00 +0800
categories: algorithm dynamic-programming 算法 动态规划
---

本章讨论多维动态规划问题。  
先看几个字符串相关的问题
## 编辑距离
```text
给定字符串word1和word2，通过三种操作使word1变为word2，返回最小操作次数，操作有如下三种
1. 插入一个字符
2. 删除一个字符
3. 替换一个字符
```
我们每次都看两字符串的首字母，以"abc"和"abd"为例，首字母相同，所以求"bc"和"bd"的编辑距离即可  
当首字母不同，如"abc"和"bcd"，分为三种情况
1. 替换首字母，变为"abc"和"acd"，这时结果为"bc"和"cd"的编辑距离+1
2. 删除word1首字母，结果为"bc"和"acd"的编辑距离+1
3. 删除word2首字母，结果为"abc"和"cd"的编辑距离+1

因此，我们定义int editDistance[i][j]表示word1从下标i开始的子串和word2从下标j开始的子串的编辑距离  
0 <= i <= word1.length, 0 <= j <= word2.length
$$
\begin{align*}
editDistance[i][j]&=word2.length-j,i == word1.length \\
&=word1.length-i,j == word2.length \\
&=editDistance[i+1][j+1],word1[i]==word2[j] \\
&=1+min(editDistance[i+1][j+1],editDistance[i+1][j],editDistance[i][j+1]),word1[i]\ne word2[j] \\
\end{align*}
$$

```java
// https://leetcode.cn/problems/edit-distance/submissions/544373505
    public int minDistance(String word1, String word2) {
        int len1 = word1.length(), len2 = word2.length();
        int[][] memo = new int[len1 + 1][len2 + 1];

        for (int i = len1; i >= 0; i--) {
            for (int j = len2; j >=0; j--) {
                if (i == len1 || j == len2) {
                    memo[i][j] = i != len1 ? len1 - i : len2 - j;
                } else {
                    memo[i][j] = word1.charAt(i) == word2.charAt(j) ? memo[i + 1][j + 1] 
                            : 1 + Math.min(Math.min(memo[i + 1][j], memo[i][j + 1]), memo[i + 1][j + 1]);
                }
            }
        }
        return memo[0][0];
    }
```

## 最长公共子序列
```text
给定字符串text1和text2，返回它们的最长公共子序列的长度。如果不存在，返回0

输入：text1 = "abcde", text2 = "ace" 
输出：3 ("ace")
```

还是比较首字母，以"abcde"和"ace"为例
+ 首字母相同，结果为后续字符"bcde"和"ce"的最长公共子序列长度+1
+ 首字母不同，取如下三种情况最大值
  + 删除text1首字母，比较"bcde"和"ace"
  + 删除text2首字母，比较"abcde"和"ce"
  + 删除两个字符串首字母，比较"bcde"和"ce"
  + 由于前两种情况一定不小于第三种，所以去掉第三种情况

设lcs[i][j]为text1从i开始的子串和text2从j开始的子串的最长公共子序列长度  
0 <= i <= text1.length, 0 <= j <= text2.length
$$
\begin{align*}
lcs[i][j]&=0,i==text1.length\;||\;j==text2.length \\
&=1+lcs[i+1][j+1],text1[i]==text2[j] \\
&=max(lcs[i+1][j],lcs[i][j+1]),text1[i]\neq text2[j] \\
\end{align*}
$$

```java
// https://leetcode.cn/problems/longest-common-subsequence/submissions/607688501
    public int longestCommonSubsequence(String text1, String text2) {
        int[][] lcs = new int[text1.length() + 1][text2.length() + 1];

        for (int i = text1.length(); i >= 0; i--) {
            for (int j = text2.length(); j >= 0; j--) {
                if (i == text1.length() || j == text2.length()) {
                    lcs[i][j] = 0;
                } else {
                    if (text1.charAt(i) == text2.charAt(j)) {
                        lcs[i][j] = 1 + lcs[i + 1][j + 1];
                    } else {
                        lcs[i][j] = Math.max(lcs[i+1][j], lcs[i][j+1]);
                    }
                }
            }
        }   
        return lcs[0][0];
    }
```

## 交错字符串
<div class="language-text highlighter-rouge">
<pre class="highlight">
<code>给定三个字符串s1、s2、s3，判断s3是否由s1和s2交错组成。
交错的定义是，s和t分割成若干非空子串：
· s=s<sub>1</sub>+s<sub>2</sub>+...+s<sub>n</sub>
· t=t<sub>1</sub>+t<sub>2</sub>+...+t<sub>m</sub>
· |n-m| <= 1

输入：s1 = "aabcc", s2 = "dbbca", s3 = "aadbbcbcac"
输出：true "<font color="">aa</font><font color="green">dbbc</font><font color="">bc</font><font color="green">a</font><font color="">c</font>"
</code>
</pre>
</div>

我们依次判断s3的首字母，分为三种情况
+ 首字母和s1、s2的首字母均不相同，s3不是s1、s2构成的交错字符串
+ 和s1、s2中的一个相同，则移去这个字母，比较后续字符
+ 和s1、s2首字母都相同，则尝试两种路径，只要一个能构成交错字符串即可

设boolean interleave[i][j]表示s1以i开始的子串和s2以j开始的子串是否构成s3中对应长度的交错字符串  
0 <= i <= s1.length, 0 <= j <= s2.length
$$
\begin{align*}
if\;i&== s1.length\;||\;j==s2.length \\
interleave[i][j]&=true,i == s1.length\;\&\&\;j==s2.length \\
&=s2[j,s2.length).equals(s3[i+j,s3.length)),j\neq s2.length \\
&=s1[i,s1.length).equals(s3[i+j,s3.length)),i \neq s1.length \\
if\;i&\neq s1.length\;\&\&\;j\neq s2.length \\
interleave[i][j]&=false ,s3[i+j]\neq s1[i]\;\&\&\; s3[i+j]\neq s2[j]\\
&=interleave[i+1][j],s3[i+j]== s1[i]\;\&\&\; s3[i+j]\neq s2[j]\\
&=interleave[i][j+1],s3[i+j]\neq s1[i]\;\&\&\; s3[i+j]== s2[j]\\
&=interleave[i+1][j]\;||\;interleave[i][j+1],s3[i+j]== s1[i]== s2[j]\\
\end{align*}
$$
其中s1[i,s1.length)表示字符串s1从i到s1.length(不包含)的子串

```java
// https://leetcode.cn/problems/interleaving-string/submissions/607776103
    public boolean isInterleave(String s1, String s2, String s3) {
        if (s1.length() + s2.length() != s3.length()) {
            return false;
        }

        boolean[][] interleave = new boolean[s1.length() + 1][s2.length() + 1];
        for (int i = s1.length(); i >= 0; i--) {
            for (int j = s2.length(); j >= 0; j--) {
                if (i == s1.length() || j == s2.length()) {
                    interleave[i][j] = i == s1.length() ? s2.substring(j).equals(s3.substring(i + j)) : s1.substring(i).equals(s3.substring(i + j));
                } else {
                    boolean result = false;
                    if (s1.charAt(i) == s3.charAt(i + j)) {
                        result |= interleave[i + 1][j];
                    }
                    if (s2.charAt(j) == s3.charAt(i + j)) {
                        result |= interleave[i][j + 1];
                    }
                    interleave[i][j] = result;
                }
            }
        }

        return interleave[0][0];
    }
```

## 最小路径和
```text
给定包含非负整数的mxn网格grid,请找出一条左上到右下的路径，使得路径和最小
每次只能向下或向右移动一步
```

$$
\begin{array}{|c|c|c|}
\hline
\rowcolor{orange}
1 & 3 & \columncolor{orange}1  \\
\hline
1 & 5 & 1  \\
\hline
4 & 2 & 1\\
\hline
\end{array}
$$

上图演示了网格中的最小路径和，可以这样求解  
首先定义每个格子到右下角的最小路径和int minPathSum[i][j]，i、j为横纵坐标
+ 右下角最小路径和为grid[i][j]
+ minPathSum[i][j]= grid[i][j] + min(minPathSum[i+1][j],minPathSum[i][j+1])，当且仅当右方和下方位置都存在


```java
// https://leetcode.cn/problems/minimum-path-sum/submissions/607893133
    public int minPathSum(int[][] grid) {
        int row = grid.length, col = grid[0].length;
        int[][] minPathSum = new int[row][col];

        for (int i = row - 1; i >= 0; i--) {
            for (int j = col - 1; j >= 0; j--) {
                if (i == row - 1 && j == col - 1) {
                    minPathSum[i][j] = grid[i][j];
                } else {
                    Integer min = null;
                    if (i != row - 1) {
                        min = grid[i][j] + minPathSum[i + 1][j];
                    }
                    if (j != col - 1) {
                        min = min == null ? grid[i][j] + minPathSum[i][j + 1]
                            : Math.min(min, grid[i][j] + minPathSum[i][j + 1]);
                    }
                    minPathSum[i][j] = min;
                }
            }
        }
        return minPathSum[0][0];
    }
```

## 三角形最小路径和
```text
给定一个三角形triangle，找出自顶向下的最小路径和
每一步只能移动到下一层正下方或者正下方右侧的节点
```

$$
\begin{array}{|c|c|c|c|}
\hline
\cellcolor{lightgray}2 \\
\hline
\cellcolor{lightgray}3 & 4  \\
\hline
6 & \cellcolor{lightgray}5 & 7 \\
\hline
4 & \cellcolor{lightgray}1 & 8 & 3 \\
\hline
\end{array}
$$

上图灰色区域表示了取得最小和的路径，解法和上一题类似。  
设minSum[i][j]为起点到每个点(横纵坐标分别为i、j)的最小路径和  
0 <= i < triangle.length, 0 <= j <= i
+ i==0，minSum[i][j]=triangle[i][j]
+ i!=0，minSum[i][j]=triangle[i][j]+min(triangle[i-1][j],triangle[i-1],[j-1])，即取正上方和正上方左侧位置(两者一定存在一个，不存在的不比较)的最小路径和作比较

```java
// https://leetcode.cn/problems/triangle/submissions/607952254
    public int minimumTotal(List<List<Integer>> triangle) {
        int[][] minSum = new int[triangle.size()][triangle.size()];

        for (int i = 0; i < triangle.size(); i++) {
            for (int j = 0; j <= i; j++) {
                if (i == 0) {
                    minSum[i][j] = triangle.get(i).get(j);
                } else {
                    Integer min = null;
                    if (j - 1 >= 0) {
                        min = minSum[i - 1][j - 1];
                    }
                    if (j <= i - 1) {
                        min = min == null ? minSum[i - 1][j] : Math.min(min,  minSum[i - 1][j]);
                    }
                    minSum[i][j] = triangle.get(i).get(j) + min;
                }
            }
        }

        int result = minSum[triangle.size() - 1][0];
        for (int i = 1; i < triangle.size(); i++) {
            result = Math.min(result, minSum[triangle.size() - 1][i]);
        }
        return result;
    }
```

## 最大正方形
```text
在由0和1组成的二维矩阵matrix中，找到只包含1的最大正方形，返回其面积
```

$$
\begin{array}{|c|c|c|}
\hline
1 & 0 & 0 \\
\hline
\cellcolor{lightgray}1 & \cellcolor{lightgray}1 & 1 \\
\hline
\cellcolor{lightgray}1 & \cellcolor{lightgray}1 & 0 \\
\hline
\end{array}
$$

如上图，最大面积为4。我们可以设int maxSize[i][j]为以点(i,j)为右下角的最大全1正方形边长，显然有
+ 当matrix[i][j]=0时，maxSize[i][j]=0
+ 当matrix[i][j]=1时，如下图，浅蓝区域表示以左侧点为右下角的最大正方形，青色和深灰区域表示以上方或左上方为右下角的最大正方形，maxSize[i][j]为三者最小值的边加一

$$
\begin{array}{|c|c|c|c|}
\hline
0 & 0 & 0 & 0 \\
\hline
\cellcolor{cyan}1 & \cellcolor{darkgray}1 & \cellcolor{darkgray}1 & \cellcolor{teal}1 \\
\hline
\cellcolor{cyan}1 & \cellcolor{darkgray}1 & \cellcolor{darkgray}1 & \cellcolor{teal}1 \\
\hline
\cellcolor{cyan}1 & \cellcolor{cyan}1 & \cellcolor{cyan}1 & \cellcolor{lightgray}1 \\
\hline
\end{array}
$$

```java
// https://leetcode.cn/problems/maximal-square/submissions/608187253
    public int maximalSquare(char[][] matrix) {
        int row = matrix.length, col = matrix[0].length;
        int[][] minSize = new int[row][col];
        int max = 0;
        for (int i = 0; i < row; i++) {
            for (int j = 0; j < col; j++) {
                if (matrix[i][j] == '0') {
                    minSize[i][j] = 0;
                } else if (i == 0 && j == 0) {
                    minSize[i][j] = 1;
                } else {
                    if (i == 0 || j == 0) {
                        minSize[i][j] = 1;
                    } else {
                        minSize[i][j] = 1 + Math.min(minSize[i - 1][j - 1], 
                            Math.min(minSize[i - 1][j], minSize[i][j - 1]));
                    }
                }

                max = Math.max(max, minSize[i][j] * minSize[i][j]);
            }
        }
        return max;
    }
```