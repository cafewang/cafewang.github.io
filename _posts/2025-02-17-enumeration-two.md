---
title:  "枚举第一讲"
date: 2025-02-17 12:50:00 +0800
categories: algorithm enumeration 算法
---
继续看几个经典的搜索类问题。

## 括号生成
```text
正整数n表示生成括号的对数，生成所有可能的有效括号组合

输入：n = 3
输出：["((()))","(()())","(())()","()(())","()()()"]
```

我们可以记录左括号和右括号的个数，添加有效的括号直到长度达到2n，规则如下
+ 左括号未达到n时，可以添加左括号
+ 左括号达到n 或 左括号数量大于右括号时，可以添加右括号

```java
    public List<String> generateParenthesis(int n) {
        List<String> result = new ArrayList<>();
        generate(new StringBuilder(), 0, 0, n, result);
        return result;
    }

    private void generate(StringBuilder builder, int leftCount, int rightCount, int n, List<String> result) {
        if (leftCount + rightCount == n + n) {
            result.add(builder.toString());
            return;
        }
        if (leftCount != n) {
            builder.append('(');
            generate(builder, leftCount + 1, rightCount, n, result);
            builder.deleteCharAt(builder.length() - 1);
        }
        
        if (leftCount == n || leftCount > rightCount) {
            builder.append(')');
            generate(builder, leftCount, rightCount + 1, n, result);
            builder.deleteCharAt(builder.length() - 1);
        }
    }
```

## 硬币
```text
给定数量不限的硬币，币值为25、10、5和1，计算n可以分解成几种表示(结果对10^9+7取模)
```

本题为典型的背包问题，我们可以这么思考，要获得唯一的表示，就需要按币值顺序消费，  
所以我们在消费一个币值时，有两种操作
1. 继续消费当前币值(假设余额足够)
2. 不再消费当前币值，转而消费后续的币值

假设币值数组为[1,10,25,5] (顺序不影响结果)，状态count[i][j]表示使用币值数组[0,i]的子数组表示值j的方案数。

$$
\begin{align*}
count[i][j]&=0,j<0 \\
count[i][0]&=1 \\
count[0][j]&=1\;if\;j\bmod\;coins[0]==0\;else\;0 \\
count[i][j]&=count[i-1][j]+count[i][j-coins[i]] \\
\end{align*}
$$

```java
// https://leetcode.cn/problems/coin-lcci/submissions/609829345
    public int waysToChange(int n) {
        int[] coins = new int[]{1, 10, 5, 25};
        int[][] memo = new int[coins.length][n + 1];
        for (int i = 0; i < coins.length; i++) {
            memo[i][0] = 1;
        }
        
        for (int i = 0; i < coins.length; i++) {
            for (int j = 1; j <= n; j++) {
                if (i == 0) {
                    memo[i][j] = j % coins[i] == 0 ? 1 : 0;
                } else {
                    memo[i][j] = modPlus(memo[i - 1][j], (j >= coins[i] ? memo[i][j - coins[i]] : 0));
                }
            }
        }

        return memo[coins.length - 1][n];
    }

    private int modPlus(int a, int b) {
        return (a + b) % ((int)1e9 + 7);
    }
```

## N皇后
<div class="language-text highlighter-rouge">
<pre class="highlight">
<code><b>n皇后问题</b>是研究如何将n个皇后放置在<b>nxn</b>的棋盘上，让皇后之间不会彼此攻击。
皇后会攻击处在同行、同列、同一斜线(两条斜线)上的棋子。
给定整数n，返回所有不同的解决方案，棋盘上'Q'代表皇后，'.'代表空位
</code>
</pre>
</div>

问题的关键点有三个：
1. 想要解决方案不重复，就需要锁定一个查找的顺序，我们采用行维度从上到下，列维度从左到右放置皇后的方式
2. 需要表示不可放置的位置，我们采用简单的二维布尔数组
3. 递归中返回时，即取走某个位置的皇后，可能导致部分位置变为可放置，我们采用集合来记录这些位置

```java
    private static final int[][] DIR = new int[][]{ {-1, -1}, {-1, 0}, {0, -1}, {0, 1}, {1, 0}, {1, 1}, {1, -1}, {-1, 1}};
    public List<List<String>> solveNQueens(int n) {
        boolean[][] banned = new boolean[n][n];
        List<List<Integer>> colsList = new ArrayList<>();
        search(new ArrayList<>(), n, banned, colsList);
        return toResult(colsList);
    }

    private void search(List<Integer> buf, int n, boolean[][] banned, List<List<Integer>> colsList) {
        if (buf.size() == n) {
            colsList.add(new ArrayList<>(buf));
            return;
        }
        int row = buf.size();

        for (int i = 0; i < n; i++) {
            if (!banned[row][i]) {
                List<int[]> newlyBanned = ban(row, i, banned);
                buf.add(i);
                search(buf, n, banned, colsList);
                buf.remove(buf.size() - 1);
                restore(newlyBanned, banned);
            }
        }
    }

    private List<int[]> ban(int row, int col, boolean[][] banned) {
        List<int[]> newlyBanned = new ArrayList<>();
        int n = banned.length;
        for (int i = 0; i < DIR.length; i++) {
            int nextRow = row + DIR[i][0], nextCol = col + DIR[i][1];
            while (0 <= nextRow && nextRow < n && 0 <= nextCol && nextCol < n) {
                if (!banned[nextRow][nextCol]) {
                    banned[nextRow][nextCol] = true;
                    newlyBanned.add(new int[]{nextRow, nextCol});
                }
                nextRow += DIR[i][0];
                nextCol += DIR[i][1];
            }
        }
        return newlyBanned;
    }

    private void restore(List<int[]> newlyBanned, boolean[][] banned) {
        for (int[] pair : newlyBanned) {
            banned[pair[0]][pair[1]] = false;
        }
    }

    private List<List<String>> toResult(List<List<Integer>> colsList) {
        List<List<String>> result = new ArrayList<>();
        for (List<Integer> cols : colsList) {
            List<String> list = new ArrayList<>();
            for (int i = 0; i < cols.size(); i++) {
                StringBuilder builder = new StringBuilder();
                for (int j = 0; j < cols.size(); j++) {
                    builder.append(cols.get(i) == j ? 'Q' : '.');
                }
                list.add(builder.toString());
            }
            result.add(list);
        }
        return result;
    }
```
我们在搜索时每次都搜索一行，因为同行不可能有两枚皇后。