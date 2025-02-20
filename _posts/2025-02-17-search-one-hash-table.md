---
title:  "查找第零讲-哈希表"
date: 2025-02-17 01:50:00 +0800
categories: algorithm hash-table 算法 哈希表
---
哈希表应该是我们日常使用最频繁的数据结构之一了，本章我们介绍一下它的几种实现和应用。

## 实现
### 数组实现
对于可枚举的数据类型，比如整型和字符，我们使用数组即可表示最简单的哈希表。  
```java
    Integer[] map = new Integer[100]; // 键的范围是0~99
    map[0] = 10; // put(0, 10)
    int a = map[0]; // a = get(0)
    map[0] = null; // remove(0)
```
这种方式效率是极高的，但是存在如下问题
+ 空间浪费极为严重，特别是键的范围非常大时
+ 数组的key只能是整型，不能是对象、字符串这些类型

### 拉链法实现
对于对象这类复杂类型，我们需要先用hashCode()得到哈希值，但如果哈希值相同，就需要处理冲突。  
先介绍拉链法，即将哈希冲突的元素编成链表，后插入元素放在链表尾部

<script defer type="text/tikz">
\begin{tikzpicture}[
every node/.style={circle, draw, node font=\large\bfseries, line width=1.5pt, minimum size=12mm},
graynode/.style={fill=teal!20, draw=teal!80},
yellownode/.style={fill=violet!20, draw=violet!80},
blacknode/.style={fill=black!20, draw=black!80},
]
\foreach \x/\content/\type[count=\i from 0] in {0/A:0/,2/C:1/,4/F:2/}
  \draw (\x,8) node[\type] (a\i) {\content};

\foreach \from in {0,...,1} {
  \pgfmathsetmacro{\next}{int(\from+1)};
  \path[->] (a\from) edge (a\next);
}

\foreach \x/\content/\type[count=\i from 0] in {0/E:5/,2/G:3/}
  \draw (\x,6) node[\type] (b\i) {\content};

\foreach \from in {0} {
  \pgfmathsetmacro{\next}{int(\from+1)};
  \path[->] (b\from) edge (b\next);
}

\draw (-3,7) rectangle (-2,8) node[midway,draw=none] (c0) {0};
\draw (-3,6) rectangle (-2,7) node[midway,draw=none] (c1) {1};
\draw (-3,5) rectangle (-2,6) node[midway,draw=none] (c2) {2};
\path[->] (c0) edge (a0) (c1) edge (b0); 
\end{tikzpicture}
</script>

如上图，A、C、F（哈希值为1）以及E、G都发生了哈希冲突，而表中还没有哈希值为2的元素  
设拉链数组大小为M，总的键值对的数量为N，则性能分析如下

<style type="text/css">
.tg  {border-collapse:collapse;border-spacing:0;}
.tg td{border-color:black;border-style:solid;border-width:1px;font-family:Arial, sans-serif;font-size:14px;
  overflow:hidden;padding:10px 5px;word-break:normal;}
.tg th{border-color:black;border-style:solid;border-width:1px;font-family:Arial, sans-serif;font-size:14px;
  font-weight:normal;overflow:hidden;padding:10px 5px;word-break:normal;}
.tg .tg-yj5y{background-color:#efefef;border-color:inherit;text-align:center;vertical-align:top}
.tg .tg-c3ow{border-color:inherit;text-align:center;vertical-align:top}
</style>
<table class="tg"><thead>
  <tr>
    <th class="tg-yj5y" colspan="2">最坏情况下的运行时间<br>增长数量级</th>
    <th class="tg-yj5y" colspan="2">平均情况下的运行时间<br>增长数量级</th>
  </tr></thead>
<tbody>
  <tr>
    <td class="tg-yj5y">查找</td>
    <td class="tg-yj5y">插入</td>
    <td class="tg-yj5y">查找命中</td>
    <td class="tg-yj5y">插入</td>
  </tr>
  <tr>
    <td class="tg-c3ow">$$&lt;log_{2}n$$</td>
    <td class="tg-c3ow">$$&lt;log_{2}n$$</td>
    <td class="tg-c3ow">$$N/2M$$</td>
    <td class="tg-c3ow">$$N/M$$</td>
  </tr>
</tbody>
</table>

可见拉链法需保证`N/M`不能太大，在HashMap实现中这个值设为了0.75，我们可以根据这个进行扩容  
让我们解决一个简单问题，顺便实现哈希表

```text
给定一个整数数组nums，如果某个值出现至少两次，返回true，否则返回false
```

```java
// https://leetcode.cn/problems/contains-duplicate/submissions/600457930/
    private static class ZipMap<K, V> {
        private static class Node<Key, Value> {
            Key key;
            Value value;
            Node<Key, Value> next;

            public Node() {}

            public Node(Key key, Value value) {
                this.key = key;
                this.value = value;
            }

            public Value get(Key key) {
                Node<Key, Value> current = this;
                while (current != null && !current.key.equals(key)) {
                    current = current.next;
                }
                return current == null ? null : current.value;
            }

            public boolean put(Key key, Value value) {
                Node current = this, prev = null;
                while (current != null && !current.key.equals(key)) {
                    prev = current;
                    current = current.next;
                }
                if (current != null) {
                    current.value = value;
                    return false;
                }
                prev.next = new Node(key, value);
                return true;
            }

            public void add(Node<Key, Value> node) {
                Node current = this;
                while (current.next != null) {
                    current = current.next;
                }
                current.next = node;
            }
        }

        static final double FACTOR = 0.75d;
        int M;
        int N;
        Node<K, V>[] bucket;

        public ZipMap() {
            M = 64;
            bucket = new Node[M];
            N = 0;
        }

        private int hash(K key, int size) {
            return (key.hashCode() & 0x7fffffff) % size;
        }

        public V get(K key) {
            int hash = hash(key, M);
            return bucket[hash] == null ? null : bucket[hash].get(key);
        }

        public boolean put(K key, V value) {
            if (N / (double)M >= FACTOR) {
                resize(M << 2);
            }
            int hash = hash(key, M);
            if (bucket[hash] == null) {
                bucket[hash] = new Node(key, value);
                N++;
                return true;            
            } else {
                boolean inserted = bucket[hash].put(key, value);
                N += inserted ? 1 : 0;
                return inserted;
            }
        }

        public void resize(int newSize) {
            if (newSize <= M) {
                return;
            }

            Node<K, V>[] newBucket = new Node[newSize];
            for (int hash = 0; hash < M; hash++) {
                if (bucket[hash] == null) {
                    continue;
                }
                Node<K, V> current = bucket[hash];
                while (current != null) {
                    int newHash = hash(bucket[hash].key, newSize);
                    Node<K, V> next = current.next;
                    current.next = null;
                    if (newBucket[newHash] == null) {
                        newBucket[newHash] = current;
                    } else {
                        newBucket[newHash].add(current);
                    }
                    current = next;
                } 
                bucket[hash] = null;
            }
            bucket = newBucket;
            M = newSize;
        }
    }

    public boolean containsDuplicate(int[] nums) {
        ZipMap<Integer, Boolean> zipMap = new ZipMap<>();
        for (int num : nums) {
            if (zipMap.get(num) == null) {
                zipMap.put(num, true);
            } else {
                return true;
            }
        }
        return false;
    }
```
+ hash实现中`key.hashCode() & 0x7fffffff`是处理负数的情况
+ 扩容时每个Node都要求新的哈希值，并放到新的bucket中，注意原链表的拆分

### 线性探测法
遇到哈希冲突，将冲突的元素放到数组后续的空位上，这就是线性探测法。  
还是用图说明，数组长度M=3，插入1和4

<script defer type="text/tikz">
\begin{tikzpicture}[
every node/.style={node font=\large\bfseries, line width=1.5pt, minimum size=12mm},
graynode/.style={fill=teal!20, draw=teal!80},
yellownode/.style={fill=violet!20, draw=violet!80},
blacknode/.style={fill=black!20, draw=black!80},
]
\foreach \x/\content/\type[count=\i from 0] in {0//,1/1/,2//} {
    \pgfmathsetmacro{\next}{int(\x+1)};
    \draw (\x,0) rectangle (\next,1) node[midway] (a\i) {$\content$};
    \draw[draw=none] (a\i.north west) -- (a\i.south east) node[near end, font=\small] {\i};
}

\foreach \x/\content/\type[count=\i from 0] in {0//,1/1/,2/4/} {
    \pgfmathsetmacro{\next}{int(\x+1)};
    \draw (\x,-2) rectangle (\next,-1) node[midway] (b\i) {$\content$};
    \draw[draw=none] (b\i.north west) -- (b\i.south east) node[near end, font=\small] {\i};
}

\node at (-1,0.5) {put(1)};
\node at (-1,-1.5) {put(4)};

\end{tikzpicture}
</script>

可以看到1和4的哈希值都为1，所以1落在下标1，而4由于哈希冲突落在后一个空位下标2  
下面看删除1，并不是清空下标1就可以了，这样会导致元素4查询不到  
还需要将后续直到下一个空位之前的元素都重新插入

<script defer type="text/tikz">
\begin{tikzpicture}[
every node/.style={node font=\large\bfseries, line width=1.5pt, minimum size=12mm},
graynode/.style={fill=teal!20, draw=teal!80},
yellownode/.style={fill=violet!20, draw=violet!80},
blacknode/.style={fill=black!20, draw=black!80},
]
\foreach \x/\content/\type[count=\i from 0] in {0//,1/4/,2//} {
    \pgfmathsetmacro{\next}{int(\x+1)};
    \draw (\x,0) rectangle (\next,1) node[midway] (a\i) {$\content$};
    \draw[draw=none] (a\i.north west) -- (a\i.south east) node[near end, font=\small] {\i};
}


\node at (-1,0.5) {delete(1)};

\end{tikzpicture}
</script>

可以看到重新插入后，4到了下标1的位置

```java
// https://leetcode.cn/problems/contains-duplicate/submissions/600613248/
    private static class HashTable<K, V> {
        int M;
        int N;
        K[] keys;
        V[] values;
    
        public HashTable() {
            M = 64;
            N = 0;
            keys = (K[])new Object[M];
            values = (V[])new Object[M];
        }
    
        private int hash(K key, int size) {
            return (key.hashCode() & 0x7fffffff) % size;
        }
    
        public V get(K key) {
            int hash = hash(key, M);
            while (keys[hash] != null && !keys[hash].equals(key)) {
                hash = (hash + 1) % M;
            }
            return keys[hash] == null ? null : values[hash];
        }
    
        public boolean put(K key, V value) {
            if (N + N >= M) {
                resize(M + M);
            }
            boolean inserted = put(key, value, keys, values);
            N += inserted ? 1 : 0;
            return inserted;
        }
    
        private boolean put(K key, V value, K[] keys, V[] values) {
            int hash = hash(key, keys.length);
            while (keys[hash] != null && !keys[hash].equals(key)) {
                hash = (hash + 1) % M;
            }
            if (keys[hash] == null) {
                keys[hash] = key;
                values[hash] = value;
                return true;
            } else {
                values[hash] = value;
                return false;
            }
        }
    
        public void resize(int newSize) {
            if (newSize <= M) {
                return;
            }
            K[] newKeys = (K[])new Object[newSize];
            V[] newValues = (V[])new Object[newSize];
            for (int i = 0; i < M; i++) {
                if (keys[i] != null) {
                    put(keys[i], values[i], newKeys, newValues);
                }
            }
            M = newSize;
            keys = newKeys;
            values = newValues;
        }
    
        public boolean remove(K key) {
            int hash = hash(key, M);
            while (keys[hash] != null && !keys[hash].equals(key)) {
                hash = (hash + 1) % M;
            }
            if (keys[hash] == null) {
                return false;
            }
            keys[hash] = null;
            values[hash] = null;
            N--;
            hash = (hash + 1) % M;
            while (keys[hash] != null) {
                K keyToMove = keys[hash];
                V valueToMove = values[hash];
                keys[hash] = null;
                values[hash] = null;
                put(keyToMove, valueToMove, keys, values);
                hash = (hash + 1) % M;
            }
            return true;
        }
    }
```

下面看一下线性探测法的性能分析  
可以看到，在保持`N/M <= 0.5`时，查找和插入性能平均为常数级别
<style type="text/css">
.tg  {border-collapse:collapse;border-spacing:0;}
.tg td{border-color:black;border-style:solid;border-width:1px;font-family:Arial, sans-serif;font-size:14px;
  overflow:hidden;padding:10px 5px;word-break:normal;}
.tg th{border-color:black;border-style:solid;border-width:1px;font-family:Arial, sans-serif;font-size:14px;
  font-weight:normal;overflow:hidden;padding:10px 5px;word-break:normal;}
.tg .tg-yj5y{background-color:#efefef;border-color:inherit;text-align:center;vertical-align:top}
.tg .tg-c3ow{border-color:inherit;text-align:center;vertical-align:top}
</style>
<table class="tg"><thead>
  <tr>
    <th class="tg-yj5y" colspan="2">最坏情况下的运行时间<br>增长数量级</th>
    <th class="tg-yj5y" colspan="2">平均情况下的运行时间<br>增长数量级</th>
  </tr></thead>
<tbody>
  <tr>
    <td class="tg-yj5y">查找</td>
    <td class="tg-yj5y">插入</td>
    <td class="tg-yj5y">查找命中</td>
    <td class="tg-yj5y">插入</td>
  </tr>
  <tr>
    <td class="tg-c3ow">$$&lt;clog_{2}n$$</td>
    <td class="tg-c3ow">$$&lt;clog_{2}n$$</td>
    <td class="tg-c3ow">$$&lt;1.5$$</td>
    <td class="tg-c3ow">$$&lt;2.5$$</td>
  </tr>
</tbody>
</table>

## 应用
### 重复元素最小距离
```text
给定整数数组和一个整数k，判断是否存在重复元素的间距abs(下标之差) <= k
```
从前往后遍历，记录每个数的最近下标，和上一个下标对比就得到最小距离
```java
// https://leetcode.cn/problems/contains-duplicate-ii/submissions/537684764/
    public boolean containsNearbyDuplicate(int[] nums, int k) {
        int minDist = nums.length;
        Map<Integer, Integer> valueToIdx = new HashMap<>();
        for (int i = 0; i < nums.length; i++) {
            if (!valueToIdx.containsKey(nums[i])) {
                valueToIdx.put(nums[i], i);
            } else {
                minDist = Math.min(minDist, i - valueToIdx.get(nums[i]));
                valueToIdx.put(nums[i], i);
            }
        }
        return minDist == nums.length ? false : minDist <= k;
    }
```

### 最小时间差
```text
给定24小时制的时间列表(HH:MM表示小时和分钟)，找出任意两个时间最小的时间差，以分钟表示

输入: timePoints = ["23:59","00,00"]
输出: 1 （"00,00"为第二天时，和第一天的"23:59"相差一分钟最小）
```
这个问题和上一题非常类似，最小时间差出在排序后两个相邻时间之间  
区别在于时间是按天无限循环的，以输入为["00:00","06:00"]为例

<script defer type="text/tikz">
\begin{tikzpicture}[
every node/.style={node font=\large\bfseries, line width=1.5pt, minimum size=12mm},
]
\draw[thick,->] (0,0) -- (8,0) node[anchor=west] {x};
\foreach \x in {1,...,7} {
    \pgfmathsetmacro{\time}{int(mod(\x*6,24))};
    \draw (\x,0.05) -- (\x,-0.05) node[anchor=north] {$\time$};
}
\draw (0,0) -- (0,0.15);
\draw (1,0) -- (1,0.15);
\draw (4,0) -- (4,0.15);
\draw (5,0) -- (5,0.15);
\node[anchor=north east] at (0,0) {0};
\node[anchor=south] at (0,0) {day0};
\node[anchor=south] at (4,0) {day1};
\draw[<->] (0.1,0.25) -- (0.9,0.25);
\draw[<->] (1.1,0.25) -- (3.9,0.25);
\draw[<->] (4.1,0.25) -- (4.9,0.25);

\end{tikzpicture}
</script>

在day0的最后一个时刻和day1的第一个时刻遍历完之后，后续又开始了新一轮循环  
所以我们从day0开始遍历到day1的第一个时刻即可

```java
// https://leetcode.cn/problems/minimum-time-difference/submissions/600736825/
    public int findMinDifference(List<String> timePoints) {
        int[] minutes = new int[timePoints.size()];
        for (int i = 0; i < timePoints.size(); i++) {
            String[] strArr = timePoints.get(i).split(":");
            minutes[i] = Integer.parseInt(strArr[0]) * 60 + Integer.parseInt(strArr[1]);
        }
        Arrays.sort(minutes);
        int minDiff = Integer.MAX_VALUE;
        for (int i = 0; i < minutes.length; i++) {
            minDiff = Math.min(minDiff, (i == minutes.length - 1 ? minutes[0] + 1440 : minutes[i + 1]) - minutes[i]);
            if (minDiff == 0) {
                return 0;
            }
        }
        return minDiff;
    }
```
还可以创建一个大小为`24*60`的数组对时间进行计数，同一个时间个数不小于2结果为0，否则还是按上述方式统计最小时间差

### 同构字符串
```text
给定两个字符串s和t，长度相同
对于每个同一位置的字符，s上相同的字符映射到t上都是同一个，且s上不同的字符不会映射到t上的同一个字符，则s和t同构
判断s和t是否同构

输入: s = "egg", t = "add"
输出: true (e -> a, g -> d)

输入: s = "aba", t = "bac"
输出: false (a -> b 又有 a -> c，不是同一字符)
```

哈希表实际上就是一种键域到值域的单向映射关系，而这一题需要双向映射  
所以我们判断s到t和t到s的映射都成立即可

```java
// https://leetcode.cn/problems/isomorphic-strings/submissions/600925670
    public boolean isIsomorphic(String s, String t) {
        return unidirectional(s, t) && unidirectional(t, s);
    }
    
    private boolean unidirectional(String s, String t) {
        int[] map = new int[128];
    
        for (int i = 0; i < s.length(); i++) {
            char a = s.charAt(i), b = t.charAt(i);
            if (map[a] == 0) {
                map[a] = b;
            } else {
                if (map[a] != b) {
                    return false;
                }
            }
        }
        return true;
    }
```
题中使用数组作为哈希表，0表示没有映射

### 最长连续序列
```text
给定未排序的整数数组，找出数字连续的最长序列(在数组中不需要位置连续)的长度

输入: nums = [100,4,200,1,3,2]
输出: 4 序列为[1,2,3,4]
```
使用哈希表记录每个数字是否出现，遍历数组，仅在当前元素前一个数字不存在时(即元素为序列的首项)，  
查找整个序列的长度，比较得出最大长度
```java
// https://leetcode.cn/problems/longest-consecutive-sequence/submissions/601088228
    public int longestConsecutive(int[] nums) {
        int max = 0;
        Set<Integer> set = new HashSet<>();
        for (int n : nums) {
            set.add(n);
        }
        for (int n : set) {
            if (set.contains(n - 1)) {
                continue;
            }
    
            int current = n + 1, count = 1;
            while (set.contains(current)) {
                count++;
                current++;
            }
            if (max > nums.length >> 1) {
                return max;
            }
            max = Math.max(max, count);
        }
        return max;
    }
```
需要注意的是
第二次循环遍历的是set，可以合并重复元素  
最后的剪枝操作，当序列长度超过数组的一半时，不会找到更大的序列了

### 字母异位词分组
```text
给定一个字符串数组，请将 字母异位词 组合在一起，可按任意顺序返回
字母异位词 是将原字符串打乱后组成的字符串

输入: strs = ["eat", "tea", "tan", "ate", "nat", "bat"]
输出: [["bat"],["nat","tan"],["ate","eat","tea"]]
```
我们统计每个字符串所有字母的数量，再按字母表顺序以字母数量作比较排序  
这样 字母异位词 会排到一起
```java
// https://leetcode.cn/problems/group-anagrams/submissions/600723652
    public List<List<String>> groupAnagrams(String[] strs) {
        Integer[] idxArr = new Integer[strs.length];
        for (int i = 0; i < strs.length; i++) {
            idxArr[i] = i;
        }
        int[][] count = new int[strs.length][26];
        for (int i = 0; i < strs.length; i++) {
            String str = strs[i];
            for (int j = 0; j < str.length(); j++) {
                count[i][str.charAt(j) - 'a']++;
            }
        }
    
        Arrays.sort(idxArr, (a, b) -> compare(a, b, count));
        List<List<String>> result = new ArrayList<>();
        List<String> group = new ArrayList<>();
        for (int i = 0; i < idxArr.length; i++) {
            if (i == 0 || compare(idxArr[i], idxArr[i - 1], count) == 0) {
                group.add(strs[idxArr[i]]);
            } else {
                result.add(group);
                group = new ArrayList<>();
                group.add(strs[idxArr[i]]);
            }
        }
        result.add(group);
        return result;
    }
    
    private int compare(int i, int j, int[][] count) {
        if (i == j) {
            return 0;
        }
        for (int k = 0; k < 26; k++) {
            if (count[i][k] == count[j][k]) {
                continue;
            }
            return count[i][k] < count[j][k] ? -1 : 1;
        }
        return 0;
    }
```
算法的核心在compare方法之中

## 结语
无序的哈希表查询和插入性能都达到优秀的常数级别，唯独无法实现按键排序的能力，下一节我们就来看看支持查询和排序的结构。
