---
title:  "枚举第零讲-排列组合"
date: 2025-02-17 12:50:00 +0800
categories: algorithm enumeration permutation combination 算法 排列组合
---

本章要讲的是NP问题，也就是无法在多项式时间内解决的问题，先从经典的排列组合说起。

## 组合
组合即是从一个集合中取出n个元素，0 <= n <= N，N为集合元素个数，不限制数量，所有可能的结果就称为幂集。
### 子集
```text
给定整数数组nums，其中元素各不相同，返回该数组的幂集
可以按任意顺序返回

输入：nums = [1,2,3]
输出：[[],[1],[2],[1,2],[3],[1,3],[2,3],[1,2,3]]
```

**思路一**  
从空集开始，每次添加一个新元素，并将添加了新元素的集合与原来不包含新元素的集合合并，这样就能构成整个幂集。  
以[1,2]为例
1. 空集[]添加1，得到[1]，合并得到[[], [1]]
2. 添加2，得到[[2], [1,2]]，合并得到[[], [1], [2], [1,2]]

```java
// https://leetcode.cn/problems/TVdhkn/submissions/609604035
    public List<List<Integer>> subsets(int[] nums) {
        List<List<Integer>> result = new ArrayList<>();
        result.add(new ArrayList<>());
        for (int n : nums) {
            int size = result.size();
            for (int i = 0; i < size; i++) {
                List<Integer> list = new ArrayList(result.get(i));
                list.add(n);
                result.add(list);
            }
        }
        return result;
    }
```

**思路二**
幂集就是0-1背包问题，每个元素都可以选或者不选，这样也能构成幂集。

```java
// https://leetcode.cn/problems/TVdhkn/submissions/609617517
    public List<List<Integer>> subsets(int[] nums) {
        List<List<Integer>> result = new ArrayList<>();
        select(0, new ArrayList<>(), nums, result);
        return result;
    }

    private void select(int i, List<Integer> buf, int[] nums, List<List<Integer>> result) {
        if (i == nums.length) {
            result.add(new ArrayList<>(buf));
            return;
        }

        buf.add(nums[i]);
        select(i + 1, buf, nums, result);
        buf.remove(buf.size() - 1);
        select(i + 1, buf, nums, result);
    }
```

**思路三**
确立一个规则，每次有两种选择
1. 选择一个元素，只能选最后选的元素的后续元素，设最后选的元素下标为lastIdx，初始为-1
2. 不选择元素，直接结束
重复此操作直到选完或结束，这样也能保证每个元素被选择或不被选，且没有重复方案

```java
// https://leetcode.cn/problems/TVdhkn/submissions/609635607
    public List<List<Integer>> subsets(int[] nums) {
        List<List<Integer>> result = new ArrayList<>();
        select(-1, new ArrayList<>(), nums, result);
        return result;
    }

    private void select(int lastIdx, List<Integer> buf, int[] nums, List<List<Integer>> result) {
        result.add(new ArrayList<>(buf));
        if (lastIdx == nums.length - 1) {
            return;
        }

        for (int i = lastIdx + 1; i < nums.length; i++) {
            buf.add(nums[i]);
            select(i, buf, nums, result);
            buf.remove(buf.size() - 1);
        }
    }
```

### 组合
```text
给定整数n和k，返回1...n中所有可能的k个数的组合
```

和求幂集类似，只是限定子集大小为k，用上题思路二和三均可解决

```java
// https://leetcode.cn/problems/uUsW3B/submissions/609640035
    public List<List<Integer>> combine(int n, int k) {
        List<List<Integer>> result = new ArrayList<>();
        select(n, new ArrayList<>(), k, result);
        return result;
    }
    
    private void select(int i, List<Integer> buf, int count, List<List<Integer>> result) {
        if (count == 0) {
            result.add(new ArrayList<>(buf));
            return;
        }
        if (i == 0) {
            return;
        }
    
        if (i < count) {
            return;
        }
    
        buf.add(i);
        select(i - 1, buf, count - 1, result);
        buf.remove(buf.size() - 1);
        select(i - 1, buf, count, result);
    }
```
注意select函数中`i < count`时退出的剪枝操作，即剩下的数不够选时直接退出。

### 组合总数
```text
给定无重复元素的正整数数组candidates和正整数target，找出使用candidates中的数字组成target的组合总数。
candidates中的数字可以无限制重复选取
```

这个问题是典型的背包问题，想要得到不重复的解，我们可以使用前缀的思想，  
将一个解表示成每个元素数量的数组。举个例子candidates=[2,3,6,7]，target=7，  
有两个解[7]，可以表示成[0,0,0,1]，[2,2,3]可以表示成[2,1,0,0]，所以每个解都是可以唯一标识的。  
那我们从左到右选择元素，即构成了唯一前缀，所以得到的解也是唯一的。

```java
// https://leetcode.cn/problems/Ygoe9J/submissions/609646380
    public List<List<Integer>> combinationSum(int[] candidates, int target) {
        List<List<Integer>> result = new ArrayList<>();
        Arrays.sort(candidates);
        select(0, new ArrayList<>(), target, candidates, result);
        return result;
    }

    private void select(int i, List<Integer> buf, int target, int[] candidates, List<List<Integer>> result) {
        if (target == 0) {
            result.add(new ArrayList<>(buf));
            return;
        }
        if (i == candidates.length) {
            return;
        }

        int count = target / candidates[i];
        if (count == 0) {
            return;
        }
        for (int j = 0; j <= count; j++) {
            for (int k = 0; k < j; k++) {
                buf.add(candidates[i]);
            }
            select(i + 1, buf, target - j * candidates[i], candidates, result);
            for (int k = 0; k < j; k++) {
                buf.remove(buf.size() - 1);
            }
        }
    }
```

写法二：参考上一节的思路三，每次从两种操作中选一个
1. 不做选择，直接退出
2. 从最后选的元素之后选一个元素，选取若干次

```java
// https://leetcode.cn/problems/combination-sum/submissions/609921454
    public List<List<Integer>> combinationSum(int[] candidates, int target) {
        List<List<Integer>> result = new ArrayList<>();
        select(-1, new ArrayList<>(), target, candidates, result);
        return result;
    }

    private void select(int lastIdx, List<Integer> buf, int target, int[] candidates, List<List<Integer>> result) {
        if (target == 0) {
            result.add(new ArrayList<>(buf));
            return;
        }

        for (int i = lastIdx + 1; i < candidates.length; i++) {
            int count = target / candidates[i];
            for (int j = 1; j <= count; j++) {
                buf.add(candidates[i]);
                select(i, buf, target - j * candidates[i], candidates, result);
            }
            for (int j = 1; j <= count; j++) {
                buf.remove(buf.size() - 1);
            }
        }
    }
```

写法三：仍然从左到右选择元素，每次执行两种操作之一：
1. 余额足够，消费当前元素
2. 开始消费下一个元素

这种写法本质和第一种是一样的，只是相对简洁一点，但是递归深度会更大

```java
// https://leetcode.cn/problems/Ygoe9J/submissions/609935139/
    public List<List<Integer>> combinationSum(int[] candidates, int target) {
        List<List<Integer>> result = new ArrayList<>();
        Arrays.sort(candidates);
        select(0, new ArrayList<>(), target, candidates, result);
        return result;
    }

    private void select(int i, List<Integer> buf, int target, int[] candidates, List<List<Integer>> result) {
        if (target == 0) {
            result.add(new ArrayList<>(buf));
            return;
        }
        if (i == candidates.length) {
            return;
        }
        if (target >= candidates[i]) {
            buf.add(candidates[i]);
            select(i, buf, target - candidates[i], candidates, result);
            buf.remove(buf.size() - 1);
        }
        select(i + 1, buf, target, candidates, result);
    }
```

### 有重复组合
```text
给定可能包含重复数字的整数数组candidates和target，找出所有组合
candidates中的数字每个只能使用一次

输入：candidates = [2,5,2,1,2], target = 5
输出：[[1,2,2], [5]]
```

与多数之和问题类似，先进行排序，将相同元素按顺序编码，[2,5,2,1,2]->[1,2<sub>0</sub>,2<sub>1</sub>,2<sub>2</sub>,5]，  
取到重复元素时，优先取序号最小的，这样就能保证不重复

```java
// https://leetcode.cn/problems/4sjJUc/submissions/609672449
    public List<List<Integer>> combinationSum2(int[] candidates, int target) {
        Arrays.sort(candidates);
        List<List<Integer>> result = new ArrayList<>();
        search(0, -1, new ArrayList<>(), target, candidates, result);
        return result;
    }

    private void search(int i, int lastIdx, List<Integer> buf, int target, int[] candidates, List<List<Integer>> result) {
        if (target == 0) {
            result.add(new ArrayList<>(buf));
            return;
        }
        if (i == candidates.length) {
            return;
        }
        if (target < candidates[i]) {
            return;
        }
        if (i == 0 || candidates[i - 1] != candidates[i] || lastIdx + 1 == i) {
            buf.add(candidates[i]);
            search(i + 1, i, buf, target - candidates[i], candidates, result);
            buf.remove(buf.size() - 1);
        }
        search(i + 1, lastIdx, buf, target, candidates, result);
    }
```

## 排列
排列就是带顺序的组合，所以排列的个数是组合个数乘以元素个数的阶乘（元素各不相同）。
### 下一个排列
```text
整数数组nums元素任意交换位置都视作它的排列，下一个排列是指字典序刚好比它大的排列

输入：nums = [1,2,3]
输出：[1,3,2]

输入：nums = [3,2,1]
输出：[1,2,3]
```

这里直接给出算法， 原理不深入讨论。
1. 以[2,3,1]为例，首先找出以最后一个元素结尾的最长的非递增子数组，即[3,1]
2. 如果子数组之前没有元素，则子数组是最大的排列，将其反转后返回即可
3. 找出子数组中第一个大于子数组前一个元素的元素，[2,3,1]中是3
4. 将两个元素交换，得到[3,2,1]
5. 将子数组反转，得到[3,1,2]，即为下一个排列
算法适用于包含重复元素的数组

```java
// https://leetcode.cn/problems/next-permutation/submissions/609738719/
    public void nextPermutation(int[] nums) {
        int fstIdx = nums.length - 1;
        while (fstIdx != 0 && nums[fstIdx] <= nums[fstIdx - 1]) {
            fstIdx--;
        }
        if (fstIdx == 0) {
            reverse(nums, 0, nums.length);
            return;
        }
        int target = nums[fstIdx - 1];
        int l = fstIdx, r = nums.length;
        while (l < r) {
            int mid = l + (r - l) / 2;
            if (nums[mid] <= target) {
                r = mid;
            } else {
                l = mid + 1;
            }
        }
        swap(nums, fstIdx - 1, l - 1);
        reverse(nums, fstIdx, nums.length);
    }

    private void reverse(int[] nums, int i, int j) {
        for (int k = i; k < (i + j) / 2; k++) {
            swap(nums, k, j - 1 - (k - i));
        }
    }

    private void swap(int[] nums, int i, int j) {
        int tmp = nums[i];
        nums[i] = nums[j];
        nums[j] = tmp;
    }
```

### 不重复全排列
```text
给定不含重复元素的整数数组nums，返回所有可能的全排列

输入：nums = [1,2,3]
输出：[[1,2,3],[1,3,2],[2,1,3],[2,3,1],[3,1,2],[3,2,1]]
```

使用boolean picked[]记录元素是否已被选择，每次选择一个未被选中的元素即可

```java
// https://leetcode.cn/problems/VvJkup/submissions/609743156
    public List<List<Integer>> permute(int[] nums) {
        List<List<Integer>> result = new ArrayList<>();
        boolean[] picked = new boolean[nums.length];
        select(new ArrayList<>(), picked, nums, result);
        return result;
    }

    private void select(List<Integer> buf, boolean[] picked, int[] nums, List<List<Integer>> result) {
        if (buf.size() == picked.length) {
            result.add(new ArrayList<>(buf));
            return;
        }

        for (int i = 0; i < picked.length; i++) {
            if (picked[i]) {
                continue;
            }
            picked[i] = true;
            buf.add(nums[i]);
            select(buf, picked, nums, result);
            buf.remove(buf.size() - 1);
            picked[i] = false;
        }
    }
```

### 可重复全排列

```text
给定一个可能包含重复元素的整数集合nums，按任意顺序返回所有不重复的全排列

输入：nums = [1,1,2]
输出：[[1,1,2], [1,2,1], [2,1,1]]
```

和处理组合中的重复元素一样，排序后优先取位置靠前的重复元素即可。

```java
// https://leetcode.cn/problems/7p8L0Z/submissions/609748318
    public List<List<Integer>> permuteUnique(int[] nums) {
        List<List<Integer>> result = new ArrayList<>();
        Arrays.sort(nums);
        boolean[] picked = new boolean[nums.length];
        select(new ArrayList<>(), picked, nums, result);
        return result;
    }

    private void select(List<Integer> buf, boolean[] picked, int[] nums, List<List<Integer>> result) {
        if (buf.size() == nums.length) {
            result.add(new ArrayList<>(buf));
            return;
        }
        for (int i = 0; i < nums.length; i++) {
            if (picked[i] || (i != 0 && nums[i] == nums[i - 1] && !picked[i - 1])) {
                continue;
            }
            buf.add(nums[i]);
            picked[i] = true;
            select(buf, picked, nums, result);
            picked[i] = false;
            buf.remove(buf.size() - 1);
        }
    }
```
注意选择下一个元素时的过滤条件`picked[i] || (i != 0 && nums[i] == nums[i - 1] && !picked[i - 1])`，  
重复元素会优先选择最靠前的，保证不产生重复
