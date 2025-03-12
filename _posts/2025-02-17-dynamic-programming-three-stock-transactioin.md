---
title:  "动态规划第二讲-股票买卖"
date: 2025-02-17 04:50:00 +0800
categories: algorithm dynamic-programming 算法 动态规划 股票买卖
---

本章介绍一个系列的经典动态规划问题-买卖股票，首先看最基础的版本。

## 基础
```text
给定一个数组prices，第i个元素表示一支股票第i天的价格。
只能选择某天买入，并在未来另一天卖出，返回交易获得的最大利润，不能获利则返回0

输入：[7,1,5,3,6,4]
输出：5 (i=1时买入，i=4时卖出)
```

求出每天后续的最高价格，就能得到每天的最大利润，然后求出全局最大利润

```java
// https://leetcode.cn/problems/best-time-to-buy-and-sell-stock/submissions/589453478/
    public int maxProfit(int[] prices) {
        int maxProfit = 0, maxValue = prices[prices.length - 1];

        for (int i = prices.length - 2; i >= 0; i--) {
            maxProfit = Math.max(maxProfit, maxValue - prices[i]);
            maxValue = Math.max(maxValue, prices[i]);
        }

        return maxProfit;
    }
```

## 不限交易次数
```text
描述如上题，只是不再限定交易次数，在每一天，都可以购买或出售股票。
在任何时候都只能持有一支股票，可以在同一天购买后售出，返回能获得的最大利润。

输入：prices = [7,1,5,3,6,4]
输出：7 (i=1买入，i=2卖出，然后i=3买入，i=4卖出)
```

在每个非递减子数组的起点买入，终点卖出，就能获得最大利润。  
[7,<font color="CornflowerBlue">1,5</font>,<font color="darkgreen">3,6</font>,4]的最大利润就是两段非递减子数组构成的

```java
// https://leetcode.cn/problems/best-time-to-buy-and-sell-stock-ii/submissions/597524858/
    public int maxProfit(int[] prices) {
        int sum = 0;
        Integer min = prices[0];

        for (int i = 1; i < prices.length; i++) {
            int v = prices[i];
            if (v < prices[i - 1]) {
                sum += prices[i - 1] - min;
                min = v;
            } else if (i == prices.length - 1) {
                sum += prices[i] - min;
            }
        }

        return sum;
    }
```

## 含手续费

<div class="language-text highlighter-rouge">
<pre class="highlight">
<code>描述与上题相同，不同点在于每次交易都需要交手续费fee，求最大利润

输入：prices = [1, 3, 2, 8, 4, 9], fee = 2
输出：8 ([1<sub>in</sub>, 3, 2, 8<sub>out</sub>, 4<sub>in</sub>, 9<sub>out</sub>]=8-1-2+9-4-2=8)
</code>
</pre>
</div>

再使用非递减数组已经不能得到最大利润了，比如[1, 3, 2, 8, 4, 9]，非递减数组三次交易得到的利润为7。  
这时我们思考股票交易的状态，每天结束时只可能有两种状态，持有(用HOLD表示)或空仓(用EMPTY表示)
+ 持有有两种可能性
  + 一是前一天结束为持有，当天未交易(如果当天先卖出后买入，不仅没挣钱，还亏了手续费，不考虑)
  + 二是前一天结束为空仓，当天买入
+ 空仓也有两种可能
  + 一是前一天结束为空仓，当天未交易
  + 二是前一天结束为持有，当天卖出

因此我们定义int maxProfit[i][j]表示第i天以状态j(HOLD/EMPTY)结束时的最大利润

$$
\begin{align*}
maxProfit[0][EMPTY]&=0 \\
maxProfit[0][HOLD]&=-prices[0] \\
maxProfit[i][EMPTY]&=max(maxProfit[i-1][EMPTY],maxProfit[i-1][HOLD]+prices[i]-fee) \\
maxProfit[i][HOLD]&=max(maxProfit[i-1][HOLD],maxProfit[i-1][EMPTY]-prices[i]) \\
\end{align*}
$$

又因为最终空仓状态肯定收益更高，而maxProfit[i][EMPTY]又是随i增大非递减的，  
所以取maxProfit[prices.length - 1][EMPTY]即是最大利润

```java
// https://leetcode.cn/problems/best-time-to-buy-and-sell-stock-with-transaction-fee/submissions/597546078/
    private static final int HOLD = 1, EMPTY = 0;

    public int maxProfit(int[] prices, int fee) {
        int[][] memo = new int[prices.length][2];
        memo[0][HOLD] = -prices[0];
        memo[0][EMPTY] = 0;

        for (int i = 1; i < prices.length; i++) {
            memo[i][HOLD] = Math.max(
                memo[i - 1][EMPTY] - prices[i], memo[i - 1][HOLD]);
            memo[i][EMPTY] = Math.max(
                memo[i - 1][EMPTY], memo[i - 1][HOLD] + prices[i] - fee);
        }

        return memo[prices.length - 1][EMPTY];
    }
```

## 冷冻期
<div class="language-text highlighter-rouge">
<pre class="highlight">
<code>我们撤销手续费，但是加入一天冷冻期
即卖出后一天不能马上买入，要间隔一天才可以，求最大利润

输入: prices = [1,2,3,0,2]
输出: 3 ([1<sub>in</sub>,2<sub>out</sub>,3<sub>frozen</sub>,0<sub>in</sub>,2<sub>out</sub>])
</code>
</pre>
</div>

我们需要记录上次卖出的日期，以确定是否在冷冻期内无法买入。  
定义结构PAndD，PAndD.profit表示利润，PAndD.date表示上次卖出日期。  
PAndD memo[i][j] 表示第i天以状态j结束的最大利润和上次卖出日期。
由于冷冻期为一天限制了买入，所以求memo[i][HOLD]时需要检查`i - memo[i-1][EMPTY].date >= 2`是否成立，否则不能买入

```java
// https://leetcode.cn/problems/best-time-to-buy-and-sell-stock-with-cooldown/submissions/608489012/
    private static final int EMPTY = 0, HOLD = 1, FROZEN = 2;

        private static class PAndD {
        int profit, date;
        public PAndD(int profit, int date) {
            this.profit = profit;
            this.date = date;
        }
    }

    public int maxProfit(int[] prices) {
        PAndD[][] memo = new PAndD[prices.length][2];
        memo[0][EMPTY] = new PAndD(0, -2);
        memo[0][HOLD] = new PAndD(-prices[0], -2);

        for (int i = 1; i < prices.length; i++) {
            memo[i][EMPTY] = memo[i - 1][EMPTY].profit >= memo[i - 1][HOLD].profit + prices[i] ? memo[i - 1][EMPTY] : new PAndD(memo[i - 1][HOLD].profit + prices[i], i);
            if (i - memo[i - 1][EMPTY].date >= 2) {
                memo[i][HOLD] = memo[i - 1][HOLD].profit >= memo[i - 1][EMPTY].profit - prices[i] ? memo[i - 1][HOLD] : new PAndD(memo[i - 1][EMPTY].profit - prices[i], memo[i - 1][EMPTY].date);
            } else {
                if (i == 1) {
                    memo[i][HOLD] = memo[i - 1][HOLD];
                } else {
                    memo[i][HOLD] = memo[i - 1][HOLD].profit >= memo[i - 2][EMPTY].profit - prices[i] ? memo[i - 1][HOLD] : new PAndD(memo[i - 2][EMPTY].profit - prices[i], memo[i - 2][EMPTY].date);
                }
            }
        }

        return memo[prices.length - 1][EMPTY].profit;
    }
```
+ 默认上次卖出日期设为-2，这样从i=0开始就可以买入
+ 当`i - memo[i - 1][EMPTY].date == 1`，即前一天刚卖出获得最大利润时，不能取前一天空仓状态买入，因为处在冷冻期，但是可以取前两天的空仓状态，即memo[i - 2][EMPTY]

## 限定交易次数
```text

```

<div class="language-text highlighter-rouge">
<pre class="highlight">
<code>撤销手续费和冷冻期，限制最多完成k笔交易，求最大利润

输入：k = 2, prices = [3,2,6,5,0,3]
输出：7 ([3,2<sub>in</sub>,6<sub>out</sub>,5,0<sub>in</sub>,3<sub>out</sub>])
</code>
</pre>
</div>

类似冷冻期的处理，我们设PAndC memo[i][j][k] 表示第i天以状态j结束，且交易次数不大于k的最大利润

$$
\begin{align*}
memo[0][EMPTY][k]&=0 \\
memo[0][HOLD][k]&=-prices[0] \\
memo[i][EMPTY][0]&=0 \\
memo[i][HOLD][0]&=max(memo[i][HOLD][i-1],-prices[i]); \\
if\;i>0\;\&\&\;k>0\\
memo[i][EMPTY][k]&=max(memo[i-1][EMPTY][k],memo[i-1][HOLD][k-1] + prices[i]) \\
memo[i][HOLD][k]&=max(memo[i-1][HOLD][k],memo[i-1][EMPTY][k] - prices[i]) \\
\end{align*}
$$

```java
// https://leetcode.cn/problems/best-time-to-buy-and-sell-stock-iv/submissions/608510449/
    private static final int EMPTY = 0, HOLD = 1;
    public int maxProfit(int k, int[] prices) {
        int[][][] memo = new int[prices.length][2][k + 1];

        for (int i = 0; i <= k; i++) {
            memo[0][EMPTY][i] = 0;
            memo[0][HOLD][i] = -prices[0];
        }

        for (int i = 1; i < prices.length; i++) {
            memo[i][EMPTY][0] = 0;
            memo[i][HOLD][0] = Math.max(memo[i - 1][HOLD][0], -prices[i]);
        }

        for (int i = 1; i < prices.length; i++) {
            for (int j = 1; j <= k; j++) {
                memo[i][EMPTY][j] = Math.max(memo[i - 1][EMPTY][j], memo[i - 1][HOLD][j - 1] + prices[i]);
                memo[i][HOLD][j] = Math.max(memo[i - 1][HOLD][j], memo[i - 1][EMPTY][j] - prices[i]);
            }
        }

        return memo[prices.length - 1][EMPTY][k];
    }
```