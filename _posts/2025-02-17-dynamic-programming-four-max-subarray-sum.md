---
title:  "动态规划第三讲-最大子数组和"
date: 2025-02-17 10:50:00 +0800
categories: algorithm dynamic-programming max-subarray-sum 算法 动态规划 最大子数组和
---

## 最大子数组和
<div class="language-text highlighter-rouge">
<pre class="highlight">
<code>给定整数数组nums，求具有最大和的连续子数组，返回最大和

输入：nums = [-2,1,-3,4,-1,2,1,-5,4]
输出：6 ([-2,1,-3,<font color="CornflowerBlue">4,-1,2,1</font>,-5,4])
</code>
</pre>
</div>

我们设置int maxValue[i]为以下标i结尾的子数组的最大和

$$
\begin{align*}
maxValue[0]&=nums[0] \\
maxValue[i]&=max(maxValue[i-1]+nums[i],nums[i]),i>0 \\
\end{align*}
$$

很好理解，如果`maxValue[i-1] < 0`，拼接上一个最大和子数组不能使最大和增长，所以取nums[i]。

```java
// https://leetcode.cn/problems/maximum-subarray/submissions/608633617/
    public int maxSubArray(int[] nums) {
        int max = nums[0], sum = nums[0];

        for (int i = 1; i < nums.length; i++) {
            sum = sum >= 0 ? sum + nums[i] : nums[i];
            max = Math.max(max, sum);
        }
        return max;
    }
```

## 最大环形子数组和
```text
给定长度为n的环形整数数组nums，返回非空子数组的最大和

输入：nums = [5,-3,5]
输出：10 ([5,5])
```

将数组延长是处理环形数组的一般方式，比如[5,-3,5]->[5,-3,5,5,-3]，  
后一个数组长度不大于3的所有子数组都是环形数组的子数组，那么问题就转化成了求长度不大于n的最大和子数组。  
我们知道子数组和可以通过前缀和之差(或后缀和)来求解，那以i结尾子数组的最大和就是prefixSum[i] - min(0, prefixSum[j](0 <= j < i))  
举个例子[1,-2,3,1]，求i=3结尾子数组的最大和，前缀和数组为prefixSum=[1,-1,2,3]，  
i之前最小的前缀和为-1,所以最大和为4-(-1)=4。现在的问题是要使子数组长度不大于n，即`i - 1 - j <= n`。  
类似求定长滑动窗口最大值的方式，我们可以用单调栈来维护下标范围确定的子数组中的最小值，  
这里就是前缀和数组下标范围为`[i - n,i)`，这里的最小值对应prefixSum[i] - prefixSum[i - n]，得到长度为n的以i结尾的子数组

```java
// https://leetcode.cn/problems/maximum-sum-circular-subarray/submissions/608680897/
    public int maxSubarraySumCircular(int[] nums) {
        Deque<int[]> monoStack = new ArrayDeque<>();
        int max = nums[0];
        int prefixSum = nums[0];
        int len = nums.length;
        monoStack.addLast(new int[]{0, nums[0]});
        for (int i = 1; i < len + len - 1; i++) {
            while (!monoStack.isEmpty() && i - monoStack.peekFirst()[0] > len) {
                monoStack.pollFirst();
            }
            prefixSum += nums[i % len];
            max = Math.max(max, prefixSum - monoStack.peekFirst()[1]);
            while (!monoStack.isEmpty() && monoStack.peekLast()[1] >= prefixSum) {
                monoStack.pollLast();
            }
            monoStack.addLast(new int[]{i, prefixSum});
        }
        return max;
    }
```
有人可能会疑问子数组都是用前缀和之差的来的，如果最大和子数组是下标从0开始的怎么办?  
其实没有问题，比如[1,2,-5]，最大和子数组是[1,2]，我们展开原数组为[1,2,-5|,1,2]，整个数组减去竖线前的部分即得到[1,2]