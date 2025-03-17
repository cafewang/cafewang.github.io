---
title:  "算法漫谈-优先队列"
date: 2025-02-17 15:50:00 +0800
categories: algorithm priority-queue 算法 优先队列
---

优先队列经常被用来求排序相关的问题，一般通过堆来实现，查找最值只需要常数时间，插入和删除最值需要对数时间。  
下面我们来看一些典型的应用。

## 查找和最小的k对数字
```text
给定两个非递减排序的整数数组nums1和nums2，以及整数k。
定义一对值(u, v)，u来自nums1，来自nums2。
找出和最小的k个数对

输入: nums1 = [1,7,11], nums2 = [2,4,6], k = 3
输出: [1,2],[1,4],[1,6]
```

以nums1 = [1,7,11], nums2 = [2,4,6]举例，使用数组下标表示数对，  
(0,1) = nums1[0] + nums2[1] = 5，所有数对构成如下矩阵

$$
\definecolor{airforceblue}{rgb}{0.36, 0.54, 0.66}
\definecolor{almond}{rgb}{0.94, 0.87, 0.8}
\definecolor{arylideyellow}{rgb}{0.91, 0.84, 0.42}
\definecolor{ashgrey}{rgb}{0.7, 0.75, 0.71}
\begin{array}{|c|c|c|}
\hline
\rowcolor{ashgrey}
3_{(0,0)} & 5_{(0,1)} & 7_{(0,2)}  \\
\hline
\rowcolor{almond}
9_{(1,0)} & 11_{(1,1)} & 13_{(1,2)}  \\
\hline
\rowcolor{arylideyellow}
13_{(2,0)} & 15_{(2,1)} & 17_{(2,2)} \\
\hline
\end{array}
$$

很明显同一行的数对是从左到右非递减的，我们采取如下方式就可以取下一个元素
1. 首先将第一列元素放入优先队列(最小堆中)
2. 取出最小元素，将同一行的下一个元素插入队列，没有则不插入
3. 循环取出k个元素

我们展示一下取出(0,0)后的矩阵状态

$$
\begin{array}{|c|c|c|}
\hline
\rowcolor{ashgrey}
5_{(0,1)} & 7_{(0,2)} &  \\
\hline
\rowcolor{almond}
9_{(1,0)} & 11_{(1,1)} & 13_{(1,2)}  \\
\hline
\rowcolor{arylideyellow}
13_{(2,0)} & 15_{(2,1)} & 17_{(2,2)} \\
\hline
\end{array}
$$

```java
// https://leetcode.cn/problems/find-k-pairs-with-smallest-sums/submissions/610129268
    public List<List<Integer>> kSmallestPairs(int[] nums1, int[] nums2, int k) {
        List<List<Integer>> result = new ArrayList<>();
        PriorityQueue<int[]> minPQ = new PriorityQueue<>((a, b) -> Integer.compare(nums1[a[0]] + nums2[a[1]], nums1[b[0]] + nums2[b[1]]));
        int rows = nums1.length, cols = nums2.length;
        for (int i = 0; i < rows; i++) {
            minPQ.add(new int[]{i, 0});
        }

        for (int i = 0; i < k; i++) {
            int[] minPair = minPQ.poll();
            List<Integer> pair = new ArrayList<>();
            pair.add(nums1[minPair[0]]);
            pair.add(nums2[minPair[1]]);
            result.add(pair);
            if (minPair[1] != cols - 1) {
                minPQ.add(new int[]{minPair[0], minPair[1] + 1});
            }
        }
        return result;
    }
```

## IPO
```text
公司需要做一些项目在IPO前积累更多资本。给定n个项目，每个项目i都有纯利润profit[i]和启动资金capital[i]。
必须现有资金不小于启动资金才能承接项目，完成后获得纯利润。每个项目只能完成一次。
初始资本为w，最多完成k个项目，求可获得的最大资金。


```
输入：k = 2, w = 0, profits = [1,2,3], capital = [0,1,1]
输出：4 (先完成项目0，获得利润1，再完成项目2，获得利润3，最终资本为4)

要获得最大收益，就需要在可启动的项目中，选择利润最大的，以获取最大收益。  
项目完成后，再把新的可启动的项目添加进来，进行下一轮选择，直到没有可选的项目 或者 已选完k个项目。

```java
// https://leetcode.cn/problems/ipo/submissions/610145567
    public int findMaximizedCapital(int k, int w, int[] profits, int[] capital) {
        PriorityQueue<Integer> minCapital = new PriorityQueue<>((a, b) -> 
            Integer.compare(capital[a], capital[b]));
        PriorityQueue<Integer> maxProfit = new PriorityQueue<>((a, b) -> 
            Integer.compare(profits[b], profits[a]));

        for (int i = 0; i < capital.length; i++) {
            minCapital.add(i);
        }

        int value = w;
        for (int i = 0; i < k; i++) {
            while (!minCapital.isEmpty() && capital[minCapital.peek()] <= value) {
                maxProfit.add(minCapital.poll());
            }

            if (maxProfit.isEmpty()) {
                return value;
            }

            value += profits[maxProfit.poll()];
        }
        return value;
    }
```
注意我们创建了两个优先队列，minCapital用于找可启动的项目，maxProfit在这些项目里找到利润最大的。

## 数据流中位数
```text
实现寻找数据流中的中位数的功能，数据流可动态添加新的数据
```

要寻找可增长数据流的中位数，就需要动态记录数据流中间的两个数，即位置在`n/2-1`和`n/2`的两个数，n为数据流长度。  
我们可以用两个优先队列，一个大根堆记录前半段，一个小根堆记录后半段，这样刚好可以取到中间的两个数。  
添加数据后需要维护两个优先队列，保证长度为偶数时，队列长度一致，  
为奇数时，取长度较大的优先队列。

```java
class MedianFinder {
// https://leetcode.cn/problems/find-median-from-data-stream/submissions/610249246
    private PriorityQueue<Integer> minPQ, maxPQ;

    public MedianFinder() {
        minPQ = new PriorityQueue<>();
        maxPQ = new PriorityQueue<>(Comparator.reverseOrder());
    }
    
    public void addNum(int num) {
        if (minPQ.size() == 0 || num >= minPQ.peek()) {
            minPQ.add(num);
        } else {
            maxPQ.add(num);
        }

        int diff = (int)Math.abs(maxPQ.size() - minPQ.size());
        while (diff > 1) {
            if (maxPQ.size() > minPQ.size()) {
                minPQ.add(maxPQ.poll());
                diff = maxPQ.size() - minPQ.size();
            } else {
                maxPQ.add(minPQ.poll());
                diff = minPQ.size() - maxPQ.size();
            }
        }
    }
    
    public double findMedian() {
        int len = minPQ.size() + maxPQ.size();
        return len % 2 == 0 ? (minPQ.peek() + maxPQ.peek()) / 2d
            : (minPQ.size() > maxPQ.size() ? minPQ.peek() : maxPQ.peek());
    }
}
```
