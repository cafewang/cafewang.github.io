---
title:  "算法漫谈-滑动窗口"
date: 2025-01-05 16:30:44 +0800
categories: algorithm sum 算法 滑动窗口
---
滑动窗口是这样一类问题，求数组的`带有某些性质`的`子数组`的最大/最小长度或个数，`子数组`长度可能是一定的也可能是可变的。<br>
让我们一起从题目入手理解并解决典型的滑动窗口问题。
## 定长
先从一个典型题目入手，求字符串s长度为k的子串中元音的最大数目
```text
https://leetcode.cn/problems/maximum-number-of-vowels-in-a-substring-of-given-length/description/
输入：s = "leetcode", k = 3
输出：2
解释：长度为3的子串为"lee"(2)、"eet"(2)、"etc"(1)、"tco"(1)、"cod"(1)、"ode(2)"，括号中为元音数量，最大为2
```

所以问题的关键在于
+ 遍历所有的定长子串
+ 记录每个子串的元音个数

```java
// https://leetcode.cn/problems/maximum-number-of-vowels-in-a-substring-of-given-length/submissions/591306964/
    public int maxVowels(String s, int k) {
        int count = 0;
        int max = 0;
        for (int l = 0, r = 0; r != s.length();){
            char c = s.charAt(r);
            r++;
            count += isVowel(c) ? 1 : 0;

            if (r - l >= k) {
                if (r - l > k) {
                    count -= isVowel(s.charAt(l)) ? 1 : 0;
                    l++;
                }

                max = Math.max(max, count);
            }
        }

        return max;
    }

    public boolean isVowel(char c) {
        return  c == 'a' || c == 'e' || c == 'i' || c == 'o' || c == 'u';
    }
```

解析如下：
+ l和r分别记录当前子数组的左右两端，l为起始下标，r为结尾下标（不包含），`r-l`即为子数组长度
+ 先右移r，直到`r-l>k`，才右移l
+ 第一次进入`r-l>=k`的条件时是`r-l==k`，不移动l，之后每次都是`r-l>k`

下面介绍一个比较难的题目，求长度为k的滑动窗口的最大值
```text
https://leetcode.cn/problems/sliding-window-maximum
输入：nums = [1,3,-1,-3,5,3,6,7], k = 3
输出：[3,3,5,5,6,7]
解释：
滑动窗口的位置                最大值
---------------               -----
[1  3  -1] -3  5  3  6  7       3
 1 [3  -1  -3] 5  3  6  7       3
 1  3 [-1  -3  5] 3  6  7       5
 1  3  -1 [-3  5  3] 6  7       5
 1  3  -1  -3 [5  3  6] 7       6
 1  3  -1  -3  5 [3  6  7]      7
```
长度为k的子数组总数为`n-k+1`，n为数组长度<br>
如果使用优先队列记录最大值，需要使用`二元组`同时记录值和对应下标<br>
如果取出最大值下标不在窗口中，则出队，直到取到窗口中最大值<br>
这种算法时间复杂度在n远大于k的情况下大概为$$O(Nlog_{2}N)$$<br>
下面介绍更高效的`单调队列`的解法
+ 维护一个队列，窗口加入新元素时，将队尾小于新元素的项出列，然后从队尾入队该元素
+ 窗口删除元素时，待删除元素等于队头元素时，将队头元素出列
+ 取队头元素即为当前窗口对应最大值

演示一下，以数组[1,3,-1,-3,5,3,6,7], k = 3为例

| No |          窗口位置         |    队列   |
|----|:-------------------------:|:---------:|
| 1  | [1]  3  -1 -3  5  3  6  7 |    [1]    |
| 2  | [1  3]  -1 -3  5  3  6  7 |    [3]    |
| 3  | [1  3  -1] -3  5  3  6  7 | [3 -1]    |
| 4  | 1 [3  -1  -3] 5  3  6  7  | [3 -1 -3] |
| 5  | 1  3 [-1  -3  5] 3  6  7  | [5]       |
| 6  | 1  3  -1 [-3  5  3] 6  7  | [5 3]     |
| 7  | 1  3  -1  -3 [5  3  6] 7  | [6]       |
| 8  | 1  3  -1  -3  5 [3  6  7] | [7]       |

注意第五行，窗口先去掉元素3，由于3也是队首元素，先将3出队，然后5入队顶掉了-3和-1<br>
下面推理一下`单调队列`的性质<br>
+ 由于队列每个元素之前的元素都不小于自身，所以队列是`非严格递减的`，队首元素自然最大
+ 元素都是从队尾添加的，所以前面的元素都是先添加的，因此有队首元素是`最早添加且最大`
+ 下面证明`单调队列`中始终包含窗口最大值
  + 先证明窗口添加元素后，队列仍包含窗口最大值
    + 初始时队列和窗口都为空，显然包含最大值
    + 窗口添加一个元素，队列也会入队该元素，仍然包含最大值
    + 当窗口已经有值时添加元素
      + 如果新元素大于最大值，则会成为新的最大值，队列仍包含最大值
      + 如果新元素不大于最大值，则原最大值保留，队列仍包含最大值
  + 再证明窗口删除元素后，队列仍包含最大值
    + 在添加元素后删除窗口第一个元素，此时队首元素为窗口最大值
    + 如果删除元素等于最大值，则删除元素和队首元素是对应的，将队首出队即可
    + 如果删除元素小于最大值，由于删除的是窗口的第一个元素，最大值一定在后面，那队列中最大值一定会顶掉这个待删除的元素，所以不需要处理
  + 因此添加和删除操作都不会影响`单调队列`包含窗口最大值的性质，即`单调队列`始终包含窗口最大值

```java
// https://leetcode.cn/problems/sliding-window-maximum/submissions/591312092
    public int[] maxSlidingWindow(int[] nums, int k) {
        int[] result = new int[nums.length - k + 1];
        int i = 0;
        Deque<Integer> deque = new ArrayDeque<>();

        for (int l = 0, r = 0; r != nums.length;) {
            int v = nums[r++];

            while (!deque.isEmpty() && deque.peekLast() < v) {
                    deque.pollLast();
            }
            deque.addLast(v);

            if (r - l >= k) {
                if (r - l > k) {
                    if (nums[l] == deque.peekFirst()) {
                        deque.pollFirst();
                    }
                    l++;
                }
                result[i++] = deque.peekFirst();
            }
        }

        return result;
    }
```

`空间复杂度`：队列长度最大为k，复杂度为$$O(k)$$<br>
`时间复杂度`：数组每个元素只会入队和出队一次，而l和r两个指针也最多移动数组长度，所以合计复杂度为$$O(n)$$

## 变长
上述问题滑动窗口的大小是固定的，而以下问题没有指定滑动窗口的大小。
### 最长
求满足条件的最长的滑动窗口，例如<br>
```text
https://leetcode.cn/problems/longest-substring-without-repeating-characters
给定一个字符串，找出其中不含有重复字符的最长子串的长度。

输入: s = "pwwkew"
输出: 3 （无重复字符的最长子串是 "wke"或"kew"，长度为 3）
```

解决这类问题的思路是
+ 将滑动窗口扩大（r指针右移），直到不满足给定条件
+ 再将窗口缩小（l指针右移），直到满足条件，记录窗口大小，再重复这一过程

```java
// https://leetcode.cn/problems/longest-substring-without-repeating-characters/submissions/591439741/
    public int lengthOfLongestSubstring(String s) {
        boolean[] containChar = new boolean[128];
        int maxLen = 0;
        for (int l = 0, r = 0; r != s.length();) {
            char c = s.charAt(r);
            r++;
 
            while (containChar[c]) {
                containChar[s.charAt(l)] = false;
                l++;
            }
            containChar[c] = true;

            maxLen = Math.max(maxLen, r - l);
        }

        return maxLen;
    }
```

以上一题为例，containChar记录窗口中已出现的字符<br>
如果再次遇到，说明当前窗口不符合条件，所以缩小窗口，直到找到刚好符合条件的窗口<br>
`空间复杂度`：$$O(1)$$，containChar是定长数组<br>
`时间复杂度`：$$O(n)$$

### 最短
仍然从题目入手
```text
https://leetcode.cn/problems/minimum-size-subarray-sum
找出数组中总和大于等于target的长度最小的子数组，并返回其长度。
如果不存在符合条件的子数组，返回0。

输入：target = 7, nums = [2,3,1,2,4,3]
输出：2 （[4,3]是满足条件最短的子数组）
```

思路如下
+ 扩大窗口，r指针右移一次
+ 缩小窗口(l指针右移)直到不满足条件或窗口为空，从第一步重复执行
+ 由于窗口不能为空，求得窗口大小为1可以直接返回

```java
// https://leetcode.cn/problems/minimum-size-subarray-sum/submissions/591444437/
    public int minSubArrayLen(int target, int[] nums) {
        Integer minLen = null;
        int sum = 0;
        for (int l = 0, r = 0; r != nums.length;) {
            int v = nums[r];
            sum += v;
            r++;

            while (sum >= target && l < r) {
                if (minLen == null) {
                    minLen = r - l;
                } else {
                    minLen = Math.min(minLen, r - l);
                }

                if (minLen == 1) {
                    return 1;
                }
                sum -= nums[l++];
            }
        }

        return minLen == null ? 0 : minLen;
    }
```

`空间复杂度`：$$O(1)$$<br>
`时间复杂度`：$$O(n)$$

### 至少
请看题
```text
https://leetcode.cn/problems/count-substrings-with-k-frequency-characters-i
给定字符串s和正整数k，求s的所有子串中，至少有一个字符出现至少k次的子串总数

输入： s = "abacb", k = 2
输出： 4
解释：'a'至少出现两次的子串有"aba"，"abac"，"abacb"，
'b'出现至少两次的子串有"bacb"
```

这类条件为`至少xxx`的问题符合这样的性质，当我们已经找到一个符合条件的子数组<br>
如上题中的"aba"，则以它为前缀的任意子数组都符合条件，所以得到"abac"和"abacb"两个解<br>
这时r=3，我们得到以"aba"为前缀的解一共有$$n-r+1=5-3+1=3$$个，由此得到如下思路
+ 将窗口扩大（r右移）直至符合条件
+ 缩小窗口（l右移）直至不符合条件，记录所有符合条件的子数组(`n-r+1`)

举例说明，字符串为"abacbabacb"，k=2

| No |     窗口位置     |    计数     | 总和 |
|----|:------------:|:---------:|----|
| 1  | [aba]cbabacb | 10-3+1=8  | 8  |
| 2  | a[bacb]abacb | 10-5+1=6  | 14 |
| 3  | ab[acba]bacb | 10-6+1=5  | 19 |
| 5  | aba[cbab]acb | 10-7+1=4  | 23 |
| 6  | abac[bab]acb | 10-7+1=4  | 27 |
| 7  | abacb[aba]cb | 10-8+1=3  | 30 |
| 8  | abacba[bacb] | 10-10+1=1 | 31 |

注意第5第6行，"cbab"缩短为"bab"仍然符合条件，所以记录了两次

```java
// https://leetcode.cn/problems/count-substrings-with-k-frequency-characters-i/submissions/591482320/
    public int numberOfSubstrings(String s, int k) {
        int[] counter = new int[26];
        int result = 0;

        for (int l = 0, r = 0; r != s.length();) {
            char c = s.charAt(r);
            r++;
            counter[c - 'a']++;

            while (counter[c - 'a'] == k) {
                result += s.length() - r + 1;
                counter[s.charAt(l) - 'a']--;
                l++;
            }
        }

        return result;
    }
```

`空间复杂度`：$$O(1)$$<br>
`时间复杂度`：$$O(n)$$

### 至多 
再看这题
```text
https://leetcode.cn/problems/subarray-product-less-than-k
给定非负整数k，返回子数组内所有元素的乘积严格小于k的子数组个数，数组元素都为整数

输入：nums = [10,5,2,6], k = 100
输出：8 ([10], [10,5], [5], [5, 2], [2], [5, 2, 6], [2, 6], [6])
```

对于这类条件为`至多/不大于/小于`的问题，找到一个解后，它的所有非空子数组也都是解<br>
比如[10,5]是一个解，那么[10]和[5]显然也是解<br>
为了让答案不包含重复子数组，我们只记录r值相同的子数组，得到如下思路
+ 扩大窗口(r右移)，只要窗口满足条件，解数量加`r-l`，即窗口大小
  + 以[5,2,6]举例，加入三个子数组[6], [2,6], [5,2,6]
+ 当窗口不满足条件时，缩小窗口(l右移)直到满足条件，跳到第一步

```java
// https://leetcode.cn/problems/subarray-product-less-than-k/submissions/591145487/
    public int numSubarrayProductLessThanK(int[] nums, int k) {
        if (k <= 1) {
            return 0;
        }

        int product = 1;
        int result = 0;
        for (int l = 0, r = 0; r != nums.length;) {
            int v = nums[r];
            r++;
            product *= v;

            while (product >= k) {
                product /= nums[l];
                l++;
            }
            result += r - l;
        }

        return result;
    }
```

+ 过滤了`k<=1`的情况，由于数组元素都是正整数，这种情况无解
+ 每次右移r都会检查是否满足条件，不满足则左移直到满足条件，然后计数
+ 缩小窗口时不用检查`l<r`，因为`l==r`时`product==1`，`product<k`一定成立，会退出while循环
  
`空间复杂度`：$$O(1)$$<br>
`时间复杂度`：$$O(n)$$

### 恰好
```text
https://leetcode.cn/problems/binary-subarrays-with-sum
给定二元数组和一个整数goal，统计和为goal的子数组数量
输入：nums = [1,0,1,0,1], goal = 2
输出：4 (满足要求的子数组有：[1,0,1]、[1,0,1,0]、[0,1,0,1]、[1,0,1])
```

我们可以套用解决`至少`问题的思路来处理`恰好`问题<br>
以上题为例，假设goal=2，我们可以分别求`和至少为2`(即`2,3,...`)和`和至少为3`(即`3,4,...`)的子数组数量<br>
相减就得到`和恰好为2`的子数组数量

```java
// https://leetcode.cn/problems/binary-subarrays-with-sum/submissions/591153958/
    public int numSubarraysWithSum(int[] nums, int goal) {
        return atLeast(nums, goal) - atLeast(nums, goal + 1);
    }

    public int atLeast(int[] nums, int goal) {
        int count = 0;
        int result = 0;
        for (int l = 0, r = 0; r != nums.length;) {
            int v = nums[r];
            r++;
            count += v;

            while (count >= goal && l < r) {
                result += nums.length - r + 1;
                count -= nums[l];
                l++;
            }
        }

        return result;
    }
```

`空间复杂度`：$$O(1)$$<br>
`时间复杂度`：$$O(n)$$

## 结语
本期的滑动窗口之旅就先滑到这里了，关于数组还有很多有趣实用的内容，我们后续再介绍
