---
title:  "字符串第零讲"
date: 2025-02-17 05:50:00 +0800
categories: algorithm string 算法 字符串
---
本章关注字符串的排序和匹配。字符串本质只是一个字符数组，字符范围由字母表规定。  
字母表可以是小写字母，即`a-z`，或标准ascii码，共128个字符，又或者是Unicode，共65536个字符。  
`字典序`就是字符串相互比较的依据。

## 字典序
`字典序`本质上就是将两个字符串长度对齐(末尾补充最小字符，可以理解为数域中的零)，  
这样字符串就变成了一个整数值，再比较这个整数值得到顺序。  
以小写字母`a-z`举例，比较`ab`和`aad`。  
以0表示最小字符，则字母表总共有27个字符，相当于27进制。  
补齐后`ab0`的值为$$1*26^{2}+2*26=728$$，  
`aad`值为$$1*26^{2}+1*26+4=706$$，显然`ab>aad`。  
这种方式可用于短字符串、小字符集的排序，对于较长字符串，对应的数值过大，计算会耗费大量时间，不如采用按位对比的方式，  
但这种思路有助于我们理解`字典序`。
下面采用这种方式求解下面的问题。

```text
给定字符串数组words和一个字符串pref  
返回words中以pref作为前缀的字符串数目
```
这题不排序也可以解决，这里只是演示字符串的排序

```java
// https://leetcode.cn/problems/counting-words-with-a-given-prefix/submissions/605677782
    public void sort(String[] words) {
        int maxLen = 0;
        for (String s : words) {
            maxLen = Math.max(maxLen, s.length());
        }
        Map<String, BigInteger> map = new HashMap<>();
        for (String s : words) {
            if (!map.containsKey(s)) {
                map.put(s, getValue(s, maxLen));
            }
        }
        Arrays.sort(words, (a, b) -> map.get(a).compareTo(map.get(b)));
    }
    
    private BigInteger getValue(String s, int len) {
        int i = 0;
        BigInteger value = BigInteger.ZERO;
        while (i != len) {
            if (i < s.length()) {
                value = value.multiply(BigInteger.valueOf(26)).add(BigInteger.valueOf(s.charAt(i) - 'a'));
            } else {
                value = value.multiply(BigInteger.valueOf(26));
            }
            i++;
        }
        return value;
    }
    
    public int prefixCount(String[] words, String pref) {
        sort(words);
        int startIdx = binarySearch(words, s -> s.compareTo(pref) >= 0);
        int endIdx = binarySearch(words, s -> s.compareTo(pref) > 0 && !s.startsWith(pref));
        return endIdx - startIdx;
    }
    
    private int binarySearch(String[] words, Predicate<String> predicate) {
        int l = 0, r = words.length;
        while (l != r) {
            int mid = l + (r - l) / 2;
            String s = words[mid];
            if (predicate.test(s)) {
                r = mid;
            } else {
                l = mid + 1;
            }
        }
        return l;
    }
```
第一个二分查找找到指定前缀字符串开始出现的位置，第二个找到指定前缀字符串不再出现的位置，两者之差即为结果。  
`时间复杂度`: 假设字符串数组长度为N，字符集大小为R，字符串最大长度为W，平均长度为w，则排序复杂度为$$N(W+log_{2}N)$$，`NW`为求字符串对应值的时间，  
二分查找复杂度为$$wlog_{2}N$$，因为字符串比较时间和平均长度成正比。

## 排序
字符串排序一般采用快排+字典序的方式，时间复杂度为$$wNlog_{2}N$$，w为字符串平均长度。  
下面介绍三向字符串快速排序，假设数组为["bc", "a", "dq", "bm"]  
如图我们每次将数组分为三组，以第一个元素的第一个字符划分，为空则以最小字符表示

<script defer type="text/tikz">
\begin{tikzpicture}[
every node/.style={node font=\large\bfseries, line width=1.5pt, minimum size=12mm},
]
\node at (0,3) (a) {bc};
\node at (0,1.5) (b) {a};
\node at (0,0) (c) {dq};
\node at (0,-1.5) (d) {bm};
\node[draw,inner sep=0pt,thick,rectangle,fit=(a) (b) (c) (d)] {};

\node[draw, rectangle, thick] at (2,3) (e) {a};
\node at (2,1.5) (f) {bc};
\node at (2,0) (g) {bm};
\node[draw, rectangle, thick] at (2,-1.5) (h) {dq};
\node[draw,inner sep=0pt,thick,rectangle,fit=(f) (g)] {};
\end{tikzpicture}
</script>

上图中按字符`b`分为三组，第一组和第三组如果长度大于一还需要继续递归，  
第二组首字符相同，所以以第二个字符比较继续递归。  

```java
// https://leetcode.cn/problems/counting-words-with-a-given-prefix/submissions/605578266
    public void sort(String[] words, int lo, int hi, int idx) {
        if (lo + 1 >= hi) {
            return;
        }
        Character pivotal = getChar(words[lo], idx);
        int ltEnd = lo, eqEnd = lo + 1, gtStart = hi; 
        while (eqEnd != gtStart) {
            Character c = getChar(words[eqEnd], idx);
            if (compare(c, pivotal) == 0) {
                eqEnd++;
            } else if (compare(c, pivotal) < 0) {
                swap(words, ltEnd, eqEnd);
                ltEnd++;
                eqEnd++;
            } else {
                swap(words, gtStart - 1, eqEnd);
                gtStart--;
            }
        }

        sort(words, lo, ltEnd, idx);
        if (pivotal != null) {
            sort(words, ltEnd, eqEnd, idx + 1);
        }
        
        sort(words, gtStart, hi, idx);
    }

    public void swap(String[] words, int i, int j) {
        String tmp = words[i];
        words[i] = words[j];
        words[j] = tmp;
    }

    private Character getChar(String s, int i) {
        return i < s.length() ? s.charAt(i) : null;
    }

    private int compare(Character a, Character b) {
        return a == b ? 0 : (a == null || b == null ? (a == null ? -1 : 1) : 
            Character.compare(a, b));
    }
```
注意
+ 字符串到达末尾时，取字符得到null，而null在比较中是最小的
+ ltEnd指向首字符小于指定字符的结束位置(不包含)
+ eqEnd指向首字符等于指定字符的结束位置(不包含)
+ gtStart指向首字符大于指定字符的开始位置
+ 遍历结束时，eqEnd和gtStart重合

下图为不同字符串排序算法的比较
<style type="text/css">
.tg  {border-collapse:collapse;border-color:#ccc;border-spacing:0;}
.tg td{background-color:#fff;border-color:#ccc;border-style:solid;border-width:1px;color:#333;
  font-family:Arial, sans-serif;font-size:14px;overflow:hidden;padding:10px 5px;word-break:normal;}
.tg th{background-color:#f0f0f0;border-color:#ccc;border-style:solid;border-width:1px;color:#333;
  font-family:Arial, sans-serif;font-size:14px;font-weight:normal;overflow:hidden;padding:10px 5px;word-break:normal;}
.tg .tg-9wq8{border-color:inherit;text-align:center;vertical-align:middle}
.tg .tg-ted4{border-color:#333333;text-align:center;vertical-align:middle}
</style>
<table class="tg"><thead>
  <tr>
    <th class="tg-9wq8">算法</th>
    <th class="tg-9wq8">稳定性</th>
    <th class="tg-ted4">原地排序</th>
    <th class="tg-ted4">调用charAt的数量级</th>
  </tr></thead>
<tbody>
  <tr>
    <td class="tg-9wq8">快速排序</td>
    <td class="tg-9wq8">否</td>
    <td class="tg-ted4">是</td>
    <td class="tg-ted4">$$Nlog^{2}N$$</td>
  </tr>
  <tr>
    <td class="tg-9wq8">归并排序</td>
    <td class="tg-9wq8">是</td>
    <td class="tg-ted4">否</td>
    <td class="tg-ted4">$$Nlog^{2}N$$</td>
  </tr>
  <tr>
    <td class="tg-ted4">三向字符串快速排序</td>
    <td class="tg-ted4">否</td>
    <td class="tg-ted4">是</td>
    <td class="tg-ted4">$$N\sim Nw$$</td>
  </tr>
</tbody>
</table>

## 匹配
所谓匹配就是查找模式串pattern在字符串s中出现的所有位置。  
采用直接搜索的方式，时间复杂度为$$MN-M^2$$，M为模式串长度，N为s长度，  
一般N远大于M，所以复杂度约为$$MN$$，下面介绍一种线性匹配算法KMP。  
第一步就是求匹配串的最长公共真前后缀(真前后缀不包含字符串本身)  
以匹配串`ABABDABABAE`为例

<script defer type="text/tikz">
\begin{tikzpicture}[
every node/.style={node font=\large\bfseries, line width=1.5pt, minimum size=12mm},
]

\foreach \x/\v in {0/A,1/B,2/A,3/B,4/D,5/A,6/B,7/A,8/B,9/A,10/E} {
  \pgfmathsetmacro{\next}{\x+1};
  \draw (\x,0) rectangle (\next,1) node[midway] (a\x) {$\v_{\x}$};
}

\foreach \x/\v in {0/0,1/0,2/0,3/1,4/2,5/0,6/1,7/2,8/3,9/4,10/3} {
  \pgfmathsetmacro{\next}{\x+1};
  \draw (\x,-1) rectangle (\next,0) node[midway] (b\x) {$\v$};
}
\end{tikzpicture}
</script>

下方的数组称为next数组，举个例子，当匹配串匹配到下标4，也就是字符D失败时，  
next[4]=2，由于`ABAB`有相同的真前后缀`AB`，匹配串下标变为2即可，而不用变为0。  
注意next[4]表示的是下标4之前字符串的最长真前后缀，**不包含**下标4的字符。  
下面看next数组的求法，假设前面的位置都已求出，如何求next[8]

<script defer type="text/tikz">
\begin{tikzpicture}[
every node/.style={node font=\large\bfseries, line width=1.5pt, minimum size=12mm},
gray node/.style={fill=gray!20},
blue node/.style={fill=blue!20},
]

\foreach \x/\v/\type in {0/A/gray node,1/B/gray node,2/A/blue node,3/B/,4/D/,5/A/gray node,6/B/gray node,7/A/blue node,8/B/,9/A/,10/E/} {
  \pgfmathsetmacro{\next}{\x+1};
  \draw[\type] (\x,0) rectangle (\next,1) node[midway] (a\x) {$\v_{\x}$};
}

\foreach \x/\v in {0/0,1/0,2/0,3/1,4/2,5/0,6/1,7/2,8/?,9/,10/} {
  \pgfmathsetmacro{\next}{\x+1};
  \draw (\x,-1) rectangle (\next,0) node[midway] (b\x) {$\v$};
}
\end{tikzpicture}
</script>

已知next[7]=2，即`ABABDAB`的最长真前后缀为`AB`，比较str[7]和str[next[7]]相等，  
即"ABABDABA"的真前后缀为"ABA"，由于next[8]最多比next[7]大一，所以next[8]=next[7]+1=3。  
相等的情况已经明确，那么不相等呢？假设我们要求next[10]  

<script defer type="text/tikz">
\begin{tikzpicture}[
every node/.style={node font=\large\bfseries, line width=1.5pt, minimum size=12mm},
gray node/.style={fill=gray!20},
blue node/.style={fill=blue!20},
]

\foreach \x/\v/\type in {0/A/gray node,1/B/gray node,2/A/gray node,3/B/gray node,4/D/blue node,5/A/gray node,6/B/gray node,7/A/gray node,8/B/gray node,9/A/blue node,10/E/} {
  \pgfmathsetmacro{\next}{\x+1};
  \draw[\type] (\x,0) rectangle (\next,1) node[midway] (a\x) {$\v_{\x}$};
}

\foreach \x/\v in {0/0,1/0,2/0,3/1,4/2,5/0,6/1,7/2,8/3,9/4,10/?} {
  \pgfmathsetmacro{\next}{\x+1};
  \draw (\x,-1) rectangle (\next,0) node[midway] (b\x) {$\v$};
}
\end{tikzpicture}
</script>

显然str[next[9]]=D和str[9]=A不匹配，这时就需要找`ABABDABAB`比`ABAB`更短的前后缀，  
可以发现，`ABAB`的前后缀`AB`也是`ABABDABAB`的前后缀，所以可以比较  
str[next[next[9]]]=str[next[4]]=str[2]=A和str[7]=A，两者相等，所以next[10]=next[4]+1=3

<script defer type="text/tikz">
\begin{tikzpicture}[
every node/.style={node font=\large\bfseries, line width=1.5pt, minimum size=12mm},
gray node/.style={fill=gray!20},
blue node/.style={fill=blue!20},
green node/.style={fill=green!20},
]

\foreach \x/\v/\type in {0/A/green node,1/B/green node,2/A/gray node,3/B/gray node,4/D/blue node,5/A/gray node,6/B/gray node,7/A/green node,8/B/green node,9/A/blue node,10/E/} {
  \pgfmathsetmacro{\next}{\x+1};
  \draw[\type] (\x,0) rectangle (\next,1) node[midway] (a\x) {$\v_{\x}$};
}

\foreach \x/\v in {0/0,1/0,2/0,3/1,4/2,5/0,6/1,7/2,8/3,9/4,10/?} {
  \pgfmathsetmacro{\next}{\x+1};
  \draw (\x,-1) rectangle (\next,0) node[midway] (b\x) {$\v$};
}
\end{tikzpicture}
</script>

```java
    private int[] getNext(String pattern) {
        int[] next = new int[pattern.length() + 1];
        next[0] = 0;
        if (pattern.length() >= 1) {
            next[1] = 0;
        }

        for (int i = 2; i <= pattern.length(); i++) {
            int len = next[i - 1];
            while (len != 0 && pattern.charAt(len) != pattern.charAt(i - 1)) {
                len = next[len];
            }
            next[i] = pattern.charAt(len) != pattern.charAt(i - 1) ? 0 : len + 1;
        }

        return next;
    }
```
注意`len != 0`的判断，没有这个条件，while有可能无限循环。
有了next数组，实现KMP字符串匹配就很简单了。
```text
给定字符串haystack和needle，needle作为模式串，
找出haystack中第一个needle匹配项的下标，没有则返回-1
```

```java
// https://leetcode.cn/problems/find-the-index-of-the-first-occurrence-in-a-string/submissions/605953541
    public int match(String haystack, String needle) {
        int[] next = getNext(needle);
        for (int i = 0, j = 0; i != haystack.length();) {
            char a = haystack.charAt(i), b = needle.charAt(j);
            if (a == b) {
                i++;
                j++;
                if (j == needle.length()) {
                    return i - needle.length();
                }
            } else {
                if (j == 0) {
                    i++;
                } else {
                    j = next[j];
                }
            }
        }
        return -1;
    }

    public int strStr(String haystack, String needle) {
        return match(haystack, needle);
    }
```
原字符串和模式串字符不匹配时，有如下两种情况
+ 比较的是匹配串的第一个字符，即`j == 0`，则i后移一位
+ 否则j移动到next[j]的位置，i不动

`时间复杂度`：设模式串长度为M，原字符串长度为N，则构建next数组复杂度为$$O(M)$$，  
由于`next[len] < len`(最长公共真前后缀长度小于字符串总长)，for中while循环一次，len就会至少减一，  
又由于len每次for循环最多加一，复杂度和匹配串总长成正比，而匹配会遍历原字符串一遍，  
合计复杂度为$$O(M+N)$$，为线性算法。