---
title:  "算法漫谈-前缀和"
date: 2025-02-17 14:50:00 +0800
categories: algorithm prefix-sum 算法 前缀和
---

前缀和就是记录数组前i个元素之和的数组，0 <= i <= arr.length，子数组之和相关问题几乎都可以通过前缀和来解决。  
之前的系列中我们其实已经使用过很多次前缀和了。首先来看最基本的使用

## 区域和检索
```text
给定整数数组，求解任意left和right(包含left和right)之间元素之和
```

这里就引出了前缀和的两种表示方法
1. prefixSum[i]表示数组前i个元素之和，0 <= i <= arr.length
2. prefixSum[i]表示数组从0到i的子数组元素之和，0 <= i < arr.length

本文采用第一种表示。以sum[i,j]表示范围为i到j(包含)的子数组元素之和

$$
sum[i,j]=prefixSum[j + 1]-prefixSum[i]
$$

```java
// https://leetcode.cn/problems/range-sum-query-immutable/submissions/610287026
class NumArray {
    int[] prefixSum;

    public NumArray(int[] nums) {
        prefixSum = new int[nums.length + 1];
        for (int i = 1; i <= nums.length; i++) {
            prefixSum[i] = prefixSum[i - 1] + nums[i - 1];
        }
    }

    public int sumRange(int left, int right) {
        return prefixSum[right + 1] - prefixSum[left];
    }
}
```


## 和为k的子数组
```text
给定整数数组nums和整数k，统计和为k的子数组个数。

输入：nums = [1,2,3], k = 3
输出：2 ([1,2]和[3])
```

之前我们通过滑动窗口的方式求解过这个问题，现在改成使用前缀和。  
我们将问题分解成，以数组下标i结尾的和为k的子数组个数，0 <= i < nums.length，将其全部相加即可。
以nums = [1,2,3], k = 3为例，假设要求以下标1结尾的和为3的子数组个数。  
以下标1结尾的子数组和，可以看成`prefixSum[2] - prefixSum[j]`，0 <= j < 2，  
这样问题就变成了`prefixSum[2] - prefixSUm[j] = 3`，即`prefixSum[i] = prefixSum[2] - 3`，  
也就是要求为指定值的前缀和的个数，我们用map统计一下即可。

```java
// https://leetcode.cn/problems/subarray-sum-equals-k/submissions/610297269
    public int subarraySum(int[] nums, int k) {
        int prefixSum = 0;
        Map<Integer, Integer> valueToCount = new HashMap<>();
        valueToCount.put(0, 1);
        int result = 0;
        for (int i = 0; i < nums.length; i++) {
            prefixSum += nums[i];
            result += valueToCount.getOrDefault(prefixSum - k, 0);
            valueToCount.putIfAbsent(prefixSum, 0);
            valueToCount.put(prefixSum, 1 + valueToCount.get(prefixSum));
        }
        return result;
    }
```

## 有序数组距离
```text
给定长度为n的整数数组nums，每次操作使n - 1个元素增加1.
返回让所有元素相等的最小操作次数。

输入：nums = [1,2,3]
输出：3
解释：只需要3次操作（注意每次操作会增加两个元素的值）：
[1,2,3]  =>  [2,3,3]  =>  [3,4,3]  =>  [4,4,4]
```

每次操作使n - 1个元素增加一，等价于使一个元素减一，最小操作数即每个元素减到最小元素的操作之和

首先我们需要求出数组每个位置和其他位置值之差的绝对值之和，比如数组[3,1,2]，
对应结果数组称为dist=[3,3,2]，由于排序不会影响题目结果，dist数组可以在排序后以线性时间求解

$$
\begin{align*}
dist[i]&=(nums[i]-nums[0])+(nums[i]-nums[1])+...+(nums[i+1]-nums[i])+...+(nums[n-1]-nums[i]) \\
&=(2*i-n+1)*nums[i]-prefixSum[i]+prefixSum[n]-prefixSum[i+1]
\end{align*}
$$

求解完成后`dist[0]`即为答案

```java
// https://leetcode.cn/problems/minimum-moves-to-equal-array-elements/submissions/610344086/
    public int minMoves(int[] nums) {
        Arrays.sort(nums);
        int n = nums.length;
        int[] prefixSum = new int[nums.length + 1];
        for (int i = 1; i <= nums.length; i++) {
            prefixSum[i] = prefixSum[i - 1] + nums[i - 1];
        }
        int[] dist = new int[nums.length];
        for (int i = 0; i < nums.length; i++) {
            dist[i] = (i + i - n + 1) * nums[i] - prefixSum[i] + prefixSum[n] - prefixSum[i + 1];
        }
        return dist[0];
    }
```