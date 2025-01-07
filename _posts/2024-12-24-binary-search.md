---
layout: commented
title:  "算法漫谈-二分查找"
author_profile: false
date: 2024-12-24 17:30:44 +0800
categories: algorithm binary-search 算法 二分查找
---

## 原理
二分查找是一种利用数组`有序性`查找指定元素的算法，首先还是举例说明
+ 假设数组为[1<sub>0</sub>, 2<sub>1</sub>, 3<sub>2</sub>, 5<sub>3</sub>, 5<sub>4</sub>]，查找目标元素3的下标
+ 首先设置左指针l=0，右指针r=5（数组长度）
+ 当l < r时循环
  + 计算l和r的中心坐标mid=l + (r - l) / 2
  + 中心点对应值记为v=nums[mid]，当v >= target时，令r = mid
  + 当v < target时，令l = mid + 1
  
实际演示一下，以不同颜色标识左指针l、右指针r以及mid
+ 第一轮循环，l=0，r=5，mid=2 [1<sub style="color:maroon">0</sub>, 2<sub>1</sub>, 3<sub style="color:green">2</sub>, 5<sub>3</sub>, 5<sub style="color:blue">4</sub>]
+ 第二轮循环，l=0，r=2，mid=1 [1<sub style="color:maroon">0</sub>, 2<sub style="color:green">1</sub>, 3<sub style="color:blue">2</sub>, 5<sub>3</sub>, 5<sub >4</sub>]
+ 第三轮循环，l=2，r=2，循环结束，得到目标元素3的下标为2 [1<sub>0</sub>, 2<sub>1</sub>, 3<sub style="color:green">2</sub>, 5<sub>3</sub>, 5<sub >4</sub>]

可以看到，循环结束时，左右坐标将数组分为两部分，[<font color="maroon">1<sub>0</sub>, 2<sub>1</sub>,</font> <font color="blue">3<sub>2</sub>, 5<sub>3</sub>, 5<sub>4</sub></font>] <Br>
左侧元素都小于目标值，右侧元素都大于等于目标值。<br>
我们不严谨地推论一下，将使右坐标向左移的条件称为`二分条件`，比如上方例子的`二分条件`为`数组元素大于等于目标值3`，则有
+ 当存在满足`二分条件`的元素时，循环结束，左右指针都落在`首个`满足二分条件的元素上，对于上方例子，即是`从左到右第一个大于等于目标值3的元素`
+ 当不存在满足`二分条件`的元素时，比如数组为[0<sub>0</sub>, 1<sub>1</sub>, 1<sub>2</sub>, 2<sub>3</sub>, 2<sub>4</sub>]，左指针会一直右移到右指针的初始位置

`时间复杂度`：设数组大小为n的有序数组二分查找的时间函数为$$T(n)$$，由于每次循环都会将数组长度缩短一半，得到如下等式

$$T(n)=T(\frac{n}{2})+1$$

这里1表示一次循环中的常量操作时间，设$$n=2^k$$（n为2的整数次幂是为了方便证明），则有

$$T(n)=T(2^{k-1})+1$$

$$T(2^{k-1})=T(2^{k-2})+1$$

展开$$T(n)$$得到

$$
\begin{align*}
T(n)&=T(2^{k-2})+2 \\
&=T(2^{k-3})+3 \\
&=T(2^{k-k})+k \\
&=k+1 \\
&=log_2{n}+1
\end{align*}
$$

注意$$T(1)=1$$，最终省略常数项得到二分查找的时间复杂度为$$O(log_2{n})$$，要小于线性时间

## 实践
### 基础二分
首先从最基础的二分查找开始
```java
// https://leetcode.cn/problems/search-insert-position
// 在有序数组中查找目标值并返回索引，没有则返回插入位置
// 输入: nums = [1,3,5,6], target = 5
// 输出: 2
    public int searchInsert(int[] nums, int target) {
        int l = 0, r = nums.length;

        while (l < r) {
            int mid = l + (r - l) / 2;
    
            if (nums[mid] >= target) {
                r = mid;
            } else {
                l = mid + 1;
            }
        }

        return l;
    }
```
代码很简单，有如下几点需要注意
+ 求mid使用了`l + (r - l) / 2`而不是`(l + r) / 2`，这样可以避免整数溢出
+ 不存在目标元素时，有两种情况
  + 存在满足二分条件的元素，如[1<sub>0</sub>, 2<sub>1</sub>, 3<sub>2</sub>]，目标值为0，二分条件为`元素大于等于0`，则左右指针落在下标0上，即`首个满足大于等于0的元素`
  + 不存在满足二分条件的元素，数组同上，目标值为5，二分条件为`元素大于等于5`，左右指针落在右指针初始位置即3
  + 上述两种情况都满足左右指针落在插入位置上
  
### 首尾位置
下面增加一点难度，加深理解
```text
https://leetcode.cn/problems/find-first-and-last-position-of-element-in-sorted-array
查找排序数组中目标值的第一个和最后一个位置，不存在则返回-1
输入：nums = [5,7,7,8,8,10], target = 8
输出：[3,4]

输入：nums = [5,7,7,8,8,10], target = 6
输出：[-1,-1]
```

```java
// https://leetcode.cn/problems/find-first-and-last-position-of-element-in-sorted-array/submissions/589200337
    public int[] searchRange(int[] nums, int target) {
        int fst = searchFirst(nums, target);
        // searchFirst会找到第一个大于等于目标值的元素，需要判断下标是否越界，以及值是否等于目标值
        if (fst == nums.length || nums[fst] != target) {
            return new int[]{-1, -1};
        }

        // searchSecond会找到第一个大于目标值的元素，需要取左侧的元素，即目标值的最后一个位置
        return new int[]{fst, searchSecond(nums, target) - 1};
    }

    public int searchFirst(int[] nums, int target) {
        int l = 0, r = nums.length;

        while (l < r) {
            int mid = l + (r - l) / 2;
            int v = nums[mid];

            
            if (v >= target) {
                r = mid;
            } else {
                l = mid + 1;
            }
        }

        return l;
    }

    public int searchSecond(int[] nums, int target) {
        int l = 0, r = nums.length;

        while (l < r) {
            int mid = l + (r - l) / 2;
            int v = nums[mid];

            // 注意二分条件的设置
            if (v > target) {
                r = mid;
            } else {
                l = mid + 1;
            }
        }

        return l;
    }
```
通过这个例子可以体会二分条件的使用

## 变种
接下来看看二分查找的变种形式，从易到难逐步提升
### 求平方根
```text
// https://leetcode.cn/problems/jJ0w9p/description
给定非负整数x，求它的正整数平方根，舍去小数部分
输入: x = 4
输出: 2

输入: x = 8
输出: 2 （8 的平方根是 2.82...，舍去小数部分，得到2） 
```

```java
    public int mySqrt(int x) {
        if (x <= 1) {
            return x;
        }
        if (x <= 3) {
            return 1;
        }
        long l = 1, r = x;
        while (l < r) {
            long mid = l + (r - l) / 2;
            if (mid * mid >= x) {
                r = mid;
            } else {
                l = mid + 1;
            }
        }

        return (int)(l * l > (long)x ? l - 1 : l);
    }
```
+ 先单独处理3及以下的情况
+ 二分条件为`元素的平方大于等于目标值`，与基础二分稍有不同，所以取得的值是`第一个平方大于等于目标值的数`
+ 平方运算可能溢出，使用long类型
+ 结果需要忽略小数部分，所以处理成平方大于目标值，则减一

### 山脉数组
`山脉数组`必须满足
+ 长度n >= 3
+ 存在下标i，数组[a<sub>0</sub>, ..., a<sub>i</sub>]为严格递增，数组[a<sub>i</sub>, ..., a<sub>n - 1</sub>]为严格递减
现在需要求下标i
  
```text
https://leetcode.cn/problems/B1IidL/description
输入：arr = [0,1,0]
输出：1

输入：arr = [1,3,5,4,2]
输出：2
```

寻找一下`二分条件`，山脉数组显然有[a<sub>i</sub>, ..., a<sub>n - 1</sub>]里的元素都大于右侧元素，<br>
而[a<sub>0</sub>, ..., a<sub>i-1</sub>]中的元素都小于等于右侧元素
```java
    public int peakIndexInMountainArray(int[] arr) {
        int l = 0, r = arr.length;

        while (l < r) {
            int mid = l + (r - l) / 2;
            int v = arr[mid];
            int right = arr[mid + 1];

            if (v > right) {
                r = mid;b
            } else {
                l = mid + 1;
            }
        }

        return l;
    }
```
需注意求`right=arr[mid + 1]`可能数组越界，但因为本题的`i≠n-1`，所以忽略了检查

### 旋转数组
`旋转数组`就是将数组循环右移若干次形成的数组。
比如`[0,1,2,4,5,6,7]`循环右移4次，得到`[4,5,6,7,0,1,2]`<br>
现要求将有序且无重复元素的数组旋转，取得其最小值
```text
https://leetcode.cn/problems/find-minimum-in-rotated-sorted-array
输入：nums = [3,4,5,1,2]
输出：1

输入：nums = [11,13,15,17]
输出：11
```
设置`二分条件`为`元素不大于数组的尾元素`，则二分查找最终得到`第一个不大于尾元素的元素`，即`最小元素`
```java
    public int findMin(int[] nums) {
        int l = 0, r = nums.length;
        int last = nums[nums.length - 1];

        while (l < r) {
            int mid = l + (r - l) / 2;
            int v = nums[mid];

            if (v <= last) {
                r = mid;
            } else {
                l = mid + 1;
            }
        }

        return nums[l];
    }
```

`注意`：如果有重复元素，就不能使用二分查找，比如`[3, 3, 3, 2, 3]`，得到下标为0，元素为3，结果错误

### 求中位数
有两个正序数组，长度分别为m和n，求出两个数组的中位数
```text
输入：nums1 = [1,3], nums2 = [2]
输出：2.00000

输入：nums1 = [1,2], nums2 = [3,4]
输出：2.50000 = (2 + 3) / 2.0
```
如果使用归并操作，求两个数组的第k个元素，时间复杂度为$$O(m + n)$$，下面介绍一种更高效的方式
+ 数组1: [1<sub>0</sub>, 3<sub>1</sub>, 5<sub>2</sub>, 5<sub>3</sub>, 7<sub>4</sub>]
+ 数组2: [2<sub>0</sub>, 2<sub>1</sub>, 3<sub>2</sub>, 4<sub>3</sub>, 6<sub>4</sub>]
+ 假设要求第5个元素，有5/2=2，我们取nums1和nums2上的第2个元素进行比较
+ 显然有`nums1[1] > nums2[1]`，则有<font color="green">绿色区域</font>的`nums1[1]`不小于nums2的<font color="blue">蓝色区域</font>中的元素
+ [1<sub>0</sub>, <font color="green">3<sub>1</sub>,</font> 5<sub>2</sub>, 5<sub>3</sub>, 7<sub>4</sub>]
+ [<font color="blue">2<sub>0</sub>, 2<sub>1</sub>,</font> 3<sub>2</sub>, 4<sub>3</sub>, 6<sub>4</sub>]
+ 所以第5个元素一定不在nums2的<font color="blue">蓝色区域</font>中，可以去掉这两个元素
+ 问题转换为求第5-2=3个元素
+ 数组1: [1<sub>0</sub>, 3<sub>1</sub>, 5<sub>2</sub>, 5<sub>3</sub>, 7<sub>4</sub>]
+ 数组2: [3<sub>0</sub>, 4<sub>1</sub>, 6<sub>2</sub>]

```java
    public double findMedianSortedArrays(int[] nums1, int[] nums2) {
        int len1 = nums1.length, len2 = nums2.length;

        if ((len1 + len2) % 2 == 0) {
            return (kthElem(nums1, nums2, (len1 + len2) / 2) + kthElem(nums1, nums2, (len1 + len2) / 2 - 1)) / 2d;
        } else {
            return kthElem(nums1, nums2, (len1 + len2) / 2);
        }
    }

    public int kthElem(int[] nums1, int[] nums2, int k) {
        int i = 0, j = 0;
        int m = nums1.length, n = nums2.length;

        while (true) {
            if (m == i) {
                return nums2[j + k];
            }
            if (j == n) {
                return nums1[i + k];
            }
            if (k == 0) {
                return nums1[i] < nums2[j] ? nums1[i] : nums2[j];
            }

            int count1 = Math.min(m - i, (k + 1) / 2);
            int count2 = Math.min(n - j, (k + 1) / 2);

            if (nums1[i + count1 - 1] <= nums2[j + count2 - 1]) {
                i += count1;
                k -= count1;
            } else {
                j += count2;
                k -= count2;
            }
        } 
    }
```
+ 这里kthElem的k是从下标0开始的
+ 首先处理了数组为空(`m==i或n==j`)和求第0个元素的情况，不处理会造成数组越界
+ 由于排除元素的个数不能大于数组剩余元素个数，所以有`Math.min(m - i, (k + 1) / 2)`，一次能排除的个数最大为数组剩余个数
+ 每次排除`k/2`个元素，求中位数时`k=(m+n)/2`，所以时间复杂度为$$O(log_{2}(m+n))$$

## 结语
理解二分查找的关键在于理解`二分条件`的作用及使用，希望本文能帮大家拓宽思路，增进功力。
