---
title:  "算法漫谈-位运算"
date: 2025-02-17 11:50:00 +0800
categories: algorithm bit-manipulation 算法 位运算
---
二进制是计算机科学的基石，而位运算可以说是其中的"奇技淫巧"，合理使用位运算可以提高程序的运行效率。  
首先一起来看一些实用的位运算技巧吧。

## 实用操作
### 最高位一
```java
    public static int highestOneBit(int i) {
        i |= (i >>  1);
        i |= (i >>  2);
        i |= (i >>  4);
        i |= (i >>  8);
        i |= (i >> 16);
        return i - (i >>> 1);
    }
```

以8位表示的数字65为例，最高位1代表的数字是64

<script defer type="text/tikz">
\definecolor{ashgrey}{rgb}{0.7, 0.75, 0.71}
\definecolor{aliceblue}{rgb}{0.94, 0.97, 1.0}
\begin{tikzpicture}[
every node/.style={node font=\large\bfseries, line width=1.5pt, minimum size=12mm},
grey node/.style={fill=ashgrey},
blue node/.style={fill=aliceblue},
]

\foreach \x/\v in {0/0,1/1,2/0,3/0,4/0,5/0,6/0,7/1} {
\pgfmathsetmacro{\next}{int(\x+1)};
\draw (\x,0) rectangle node (a\x) {\v} (\next,1);
}

\node at (-2,-1.5) {$i \mid= (i >> 1)$};

\foreach \x/\v/\type in {0/0/,1/1/grey node,2/1/grey node,3/0/,4/0/,5/0/,6/0/,7/1/} {
\pgfmathsetmacro{\next}{int(\x+1)};
\draw[\type] (\x,-2) rectangle node (a\x) {\v} (\next,-1);
}

\node at (-2,-3.5) {$i \mid= (i >> 2)$};

\foreach \x/\v/\type in {0/0/,1/1/grey node,2/1/grey node,3/1/grey node,4/1/grey node,5/0/,6/0/,7/1/} {
\pgfmathsetmacro{\next}{int(\x+1)};
\draw[\type] (\x,-4) rectangle node (c\x) {\v} (\next,-3);
}

\node at (-2,-5.5) {$i \mid= (i >> 4)$};

\foreach \x/\v/\type in {0/0/,1/1/grey node,2/1/grey node,3/1/grey node,4/1/grey node,5/1/grey node,6/1/grey node,7/1/grey node} {
\pgfmathsetmacro{\next}{int(\x+1)};
\draw[\type] (\x,-6) rectangle node (d\x) {\v} (\next,-5);
}

\node at (-2,-7.5) {$i - (i >>> 1)$};

\foreach \x/\v/\type in {0/0/,1/1/grey node,2/0/blue node,3/0/blue node,4/0/blue node,5/0/blue node,6/0/blue node,7/0/blue node} {
\pgfmathsetmacro{\next}{int(\x+1)};
\draw[\type] (\x,-8) rectangle node (d\x) {\v} (\next,-7);
}

\end{tikzpicture}
</script>

这种方法是通过倍增的方式将最高位1复制到后续每一位，然后减法去掉非最高位的一。

### 最低位一
```java
    public static int lowestOneBit(int i) {
        return i & -i;
    }
```

-i即是i取反加一，取反会把最低位一变成最低位零，后续都是一，加一会把最低位零变成一，后续都是零，  
这样最低位一和后续位i和-i是一样的，而前面都是相反的，与操作后就保留了最低位一和后续的零。
以八位表示的8举例。

<script defer type="text/tikz">
\definecolor{ashgrey}{rgb}{0.7, 0.75, 0.71}
\definecolor{aliceblue}{rgb}{0.94, 0.97, 1.0}
\begin{tikzpicture}[
every node/.style={node font=\large\bfseries, line width=1.5pt, minimum size=12mm},
grey node/.style={fill=ashgrey},
blue node/.style={fill=aliceblue},
]

\foreach \x/\v in {0/0,1/0,2/0,3/0,4/1,5/0,6/0,7/0} {
\pgfmathsetmacro{\next}{int(\x+1)};
\draw (\x,0) rectangle node (a\x) {\v} (\next,1);
}

\node at (-2,-1.5) {$-i$};

\foreach \x/\v/\type in {0/1/,1/1/,2/1/,3/1/,4/1/,5/0/,6/0/,7/0/} {
\pgfmathsetmacro{\next}{int(\x+1)};
\draw[\type] (\x,-2) rectangle node (a\x) {\v} (\next,-1);
}

\node at (-2,-3.5) {$i\;\&\;-1$};

\foreach \x/\v/\type in {0/0/grey node,1/0/grey node,2/0/grey node,3/0/grey node,4/1/blue node,5/0/blue node,6/0/blue node,7/0/blue node} {
\pgfmathsetmacro{\next}{int(\x+1)};
\draw[\type] (\x,-4) rectangle node (c\x) {\v} (\next,-3);
}

\end{tikzpicture}
</script>


### 前导零个数
```java
public static int numberOfLeadingZeros(int i) {
        if (i == 0)
            return 32;
        int n = 1;
        if (i >>> 16 == 0) { n += 16; i <<= 16; }
        if (i >>> 24 == 0) { n +=  8; i <<=  8; }
        if (i >>> 28 == 0) { n +=  4; i <<=  4; }
        if (i >>> 30 == 0) { n +=  2; i <<=  2; }
        n -= i >>> 31;
        return n;
    }
```

### 一的个数
```java
    public static int bitCount(int i) {
        i = i - ((i >>> 1) & 0x55555555);
        i = (i & 0x33333333) + ((i >>> 2) & 0x33333333);
        i = (i + (i >>> 4)) & 0x0f0f0f0f;
        i = i + (i >>> 8);
        i = i + (i >>> 16);
        return i & 0x3f;
    }
```

是不是看起来一头雾水？让我们用八位表示的27(11011)举例  
首先是`(i >>> 1) & 0x55555555`，5用二进制表示就是`0101`，整句的意思就是将二进制每两位分组，保留第二位。

<script defer type="text/tikz">
\definecolor{ashgrey}{rgb}{0.7, 0.75, 0.71}
\definecolor{aliceblue}{rgb}{0.94, 0.97, 1.0}
\begin{tikzpicture}[
every node/.style={node font=\large\bfseries, line width=1.5pt, minimum size=12mm},
grey node/.style={fill=ashgrey},
blue node/.style={fill=aliceblue},
]
\node at (-2,0.5) {$i >>> 1$};

\foreach \x/\v/\type in {0/0/,1/0/grey node,2/0/,3/0/grey node,4/1/,5/1/grey node,6/0/,7/1/grey node} {
\pgfmathsetmacro{\next}{int(\x+1)};
\draw[\type] (\x,0) rectangle node (a\x) {\v} (\next,1);
}

\node at (-2,-1.5) {$0x55$};

\foreach \x/\v/\type in {0/0/,1/1/,2/0/,3/1/,4/0/,5/1/,6/0/,7/1/} {
\pgfmathsetmacro{\next}{int(\x+1)};
\draw[\type] (\x,-2) rectangle node (a\x) {\v} (\next,-1);
}

\node at (-2,-3.5) {$(i >>> 1)\;\&\;0x55$};

\foreach \x/\v/\type in {0/0/,1/0/grey node,2/0/,3/0/grey node,4/0/,5/1/grey node,6/0/,7/1/grey node} {
\pgfmathsetmacro{\next}{int(\x+1)};
\draw[\type] (\x,-4) rectangle node (c\x) {\v} (\next,-3);
}

\end{tikzpicture}
</script>

那么`i - ((i >>> 1) & 0x55555555)`又是什么意思呢？可以按照下图理解

|        i       | 00 | 01 | 10 | 11 |
|:--------------:|:--:|:--:|:--:|:--:|
| (i &gt;&gt;&gt; 1) & 01 | 00 | 00 | 00 | 01 |
|      相减      | 00 | 01 | 01 | 10 |

可以看到每两位恰好变为表示这两位上1的个数。  
继续看`(i & 0x33333333) + ((i >>> 2) & 0x33333333)`

<script defer type="text/tikz">
\definecolor{ashgrey}{rgb}{0.7, 0.75, 0.71}
\definecolor{aliceblue}{rgb}{0.94, 0.97, 1.0}
\definecolor{almond}{rgb}{0.94, 0.87, 0.8}
\definecolor{antiquebrass}{rgb}{0.8, 0.58, 0.46}
\definecolor{babyblueeyes}{rgb}{0.63, 0.79, 0.95}
\begin{tikzpicture}[
every node/.style={node font=\large\bfseries, line width=1.5pt, minimum size=12mm},
grey node/.style={fill=ashgrey},
blue node/.style={fill=aliceblue},
gold node/.style={fill=babyblueeyes},
brass node/.style={fill=almond},
]
\node at (-2,0.5) {$i$};

\foreach \x/\v/\type in {0/0/grey node,1/0/grey node,2/0/blue node,3/1/blue node,4/0/grey node,5/1/grey node,6/1/blue node,7/0/blue node} {
\pgfmathsetmacro{\next}{int(\x+1)};
\draw[\type] (\x,0) rectangle node (a\x) {\v} (\next,1);
}

\node at (-2,-1.5) {$i\;\&\;0x33$};

\foreach \x/\v/\type in {0/0/,1/0/,2/0/blue node,3/1/blue node,4/0/,5/0/,6/1/blue node,7/0/blue node} {
\pgfmathsetmacro{\next}{int(\x+1)};
\draw[\type] (\x,-2) rectangle node (a\x) {\v} (\next,-1);
}

\node at (-2,-3.5) {$(i >>> 2)\;\&\;0x33$};

\foreach \x/\v/\type in {0/0/,1/0/,2/0/grey node,3/0/grey node,4/0/,5/0/,6/0/grey node,7/1/grey node} {
\pgfmathsetmacro{\next}{int(\x+1)};
\draw[\type] (\x,-4) rectangle node (c\x) {\v} (\next,-3);
}

\node at (-2,-5.5) {$+$};

\foreach \x/\v/\type in {0/0/brass node,1/0/brass node,2/0/brass node,3/1/brass node,4/0/gold node,5/0/gold node,6/1/gold node,7/1/gold node} {
\pgfmathsetmacro{\next}{int(\x+1)};
\draw[\type] (\x,-6) rectangle node (c\x) {\v} (\next,-5);
}

\end{tikzpicture}
</script>

结果就是将每两位的一的个数相加成每四位的一的个数。  
`(i + (i >>> 4)) & 0x0f0f0f0f`就是将每四位的一的个数相加成每八位一的个数，接下来就是相加成十六位和三十二位。  
最后`i & 0x3f`就是保留最后6位，因为最多32个一，二进制最多6位。可以看到最终得到的4就是27(11011)中一的个数。

<script defer type="text/tikz">
\definecolor{ashgrey}{rgb}{0.7, 0.75, 0.71}
\definecolor{aliceblue}{rgb}{0.94, 0.97, 1.0}
\definecolor{satinsheengold}{rgb}{0.8, 0.63, 0.21}
\begin{tikzpicture}[
every node/.style={node font=\large\bfseries, line width=1.5pt, minimum size=12mm},
grey node/.style={fill=ashgrey},
blue node/.style={fill=aliceblue},
gold node/.style={fill=satinsheengold},
]
\node at (-2.5,0.5) {$i + (i >>> 4)$};

\foreach \x/\v/\type in {0/0/,1/0/,2/0/,3/1/,4/0/blue node,5/1/blue node,6/0/blue node,7/0/blue node} {
\pgfmathsetmacro{\next}{int(\x+1)};
\draw[\type] (\x,0) rectangle node (a\x) {\v} (\next,1);
}

\node at (-2.5,-1.5) {$0x0f$};

\foreach \x/\v/\type in {0/0/,1/0/,2/0/,3/0/,4/1/grey node,5/1/grey node,6/1/grey node,7/1/grey node} {
\pgfmathsetmacro{\next}{int(\x+1)};
\draw[\type] (\x,-2) rectangle node (a\x) {\v} (\next,-1);
}

\node at (-2.5,-3.5) {$(i + (i >>> 4)) \;\&\; 0x0f$};

\foreach \x/\v/\type in {0/0/,1/0/,2/0/,3/0/,4/0/gold node,5/1/gold node,6/0/gold node,7/0/gold node} {
\pgfmathsetmacro{\next}{int(\x+1)};
\draw[\type] (\x,-4) rectangle node (c\x) {\v} (\next,-3);
}

\end{tikzpicture}
</script>

### 反转
```java
 public static int reverse(int i) {
        i = (i & 0x55555555) << 1 | (i >>> 1) & 0x55555555;
        i = (i & 0x33333333) << 2 | (i >>> 2) & 0x33333333;
        i = (i & 0x0f0f0f0f) << 4 | (i >>> 4) & 0x0f0f0f0f;
        i = (i << 24) | ((i & 0xff00) << 8) |
            ((i >>> 8) & 0xff00) | (i >>> 24);
        return i;
    }
```

相信从`一的个数`看到这里，反转的算法就很容易理解了。以四位二进制表示7(0111)，  
`(i & 0x5) << 1`就是将每两位的低位移到高位，而`(i >>> 1) & 0x5`就是将每两位的高位移到低位，  
或操作之后就是将每两位的高低位互换，后续就是将每四位的前后两位互换，然后将每八位的前后四位互换，  
整体结果就是每八位被分别反转，最后再将四个八位反转，就完成了三十二位的反转。

<script defer type="text/tikz">
\definecolor{ashgrey}{rgb}{0.7, 0.75, 0.71}
\definecolor{aliceblue}{rgb}{0.94, 0.97, 1.0}
\definecolor{amber}{rgb}{1.0, 0.75, 0.0}
\begin{tikzpicture}[
every node/.style={node font=\large\bfseries, line width=1.5pt, minimum size=12mm},
grey node/.style={fill=ashgrey},
blue node/.style={fill=aliceblue},
gold node/.style={fill=amber},
]
\node at (-2.5,0.5) {$i$};

\foreach \x/\v/\type in {0/0/grey node,1/1/gold node,2/1/grey node,3/1/gold node} {
\pgfmathsetmacro{\next}{int(\x+1)};
\draw[\type] (\x,0) rectangle node (a\x) {\v} (\next,1);
}

\node at (-2.5,-1.5) {$(i \;\&\; 0x5) << 1$};

\foreach \x/\v/\type in {0/1/gold node,1/0/,2/1/gold node,3/0/} {
\pgfmathsetmacro{\next}{int(\x+1)};
\draw[\type] (\x,-2) rectangle node (a\x) {\v} (\next,-1);
}

\node at (-2.5,-3.5) {$(i >>> 1) \;\&\; 0x5$};

\foreach \x/\v/\type in {0/0/,1/0/grey node,2/0/,3/1/grey node} {
\pgfmathsetmacro{\next}{int(\x+1)};
\draw[\type] (\x,-4) rectangle node (c\x) {\v} (\next,-3);
}

\node at (-2.5,-5.5) {$\mid$};

\foreach \x/\v/\type in {0/1/gold node,1/1/grey node,2/0/gold node,3/1/grey node} {
\pgfmathsetmacro{\next}{int(\x+1)};
\draw[\type] (\x,-6) rectangle node (c\x) {\v} (\next,-5);
}

\end{tikzpicture}
</script>

## 应用
### 只出现一次的数字
```text
给定非空整数数组nums，除了某个元素只出现一次，其他元素均出现两次，求出只出现一次的元素。

输入：nums = [2,2,1]
输出：1
```

异或运算可以消除相同元素，比如`a ^ b ^ a = b`，将数组整体异或就能找到出现一次的元素。

```java
// https://leetcode.cn/problems/single-number/submissions/575150252
    public int singleNumber(int[] nums) {
        if (nums.length == 1) {
            return nums[0];
        }

        int result = nums[0];
        for (int i = 1; i < nums.length; i++) {
            result = result ^ nums[i];
        }

        return result;
    }
```

### 其他元素出现三次
```text
给定整数数组nums，除某元素出现一次，其他元素均出现三次，求只出现一次的元素

输入：nums = [2,2,3,2]
输出：3
```

我们可以统计每一位一的个数，如果是三的倍数，唯一的元素在这一位就是零，否则就是一。

```java
// https://leetcode.cn/problems/WGki4K/submissions/611278711
    public int singleNumber(int[] nums) {
        int reuslt = 0;
        for (int i = 31; i >= 0; i--) {
            int count = 0, mask = 1 << i;
            reuslt <<= 1;
            for (int n : nums) {
                count += (n & mask) != 0 ? 1 : 0;
            }
            reuslt += count % 3 == 0 ? 0 : 1;
        }
        return reuslt;
    }
```

### 数字范围按位与
```text
给定两个整数left和right，表示区间[left,right]，返回区间内所有数字 按位与 的结果。

输入：left = 5, right = 7
输出：4
```

<script defer type="text/tikz">
\definecolor{ashgrey}{rgb}{0.7, 0.75, 0.71}
\definecolor{aliceblue}{rgb}{0.94, 0.97, 1.0}
\definecolor{amber}{rgb}{1.0, 0.75, 0.0}
\begin{tikzpicture}[
every node/.style={node font=\large\bfseries, line width=1.5pt, minimum size=12mm},
grey node/.style={fill=lightgray},
blue node/.style={fill=aliceblue},
gold node/.style={fill=amber},
]
\node at (-2.5,0.5) {$5$};

\foreach \x/\v/\type in {0/0/blue node,1/1/blue node,2/0/,3/1/} {
\pgfmathsetmacro{\next}{int(\x+1)};
\draw[\type] (\x,0) rectangle node (a\x) {\v} (\next,1);
}

\node at (-2.5,-1.5) {$7$};

\foreach \x/\v/\type in {0/0/blue node,1/1/blue node,2/1/,3/1/} {
\pgfmathsetmacro{\next}{int(\x+1)};
\draw[\type] (\x,-2) rectangle node (a\x) {\v} (\next,-1);
}

\node at (-2.5,-3.5) {$5\mid 6 \mid 7$};

\foreach \x/\v/\type in {0/0/blue node,1/1/blue node,2/0/grey node,3/0/grey node} {
\pgfmathsetmacro{\next}{int(\x+1)};
\draw[\type] (\x,-4) rectangle node (c\x) {\v} (\next,-3);
}

\end{tikzpicture}
</script>

这里不加证明地说，[left,right]的范围按位与，就是left和right二进制公共前缀拼接上零组成的，  
比如[5,7]按位与就是前缀`01`拼接两个0，组成了`0100`就是4。  
除了按位处理，还可以使用运算`i & (i - 1)`消除i最低位的1，  
由于公共前缀`prefix <= left`且是由right消除若干个最低位1得到的，可以采用如下方法。

```java
    public int rangeBitwiseAnd(int left, int right) {
        while (right > left) {
            right = right & (right - 1);
        }
        return right;
    }
```

### 最大异或值
```text
给定整数数组nums，返回nums[i] XOR nums[j]的最大结果，i和j可以相同

输入：nums = [3,10,5,25,2,8]
输出：28 (最大运算结果是 5 XOR 25 = 28)

输入：nums = [0]
输出：0 (0 XOR 0)
```

要获得最大的异或值，二进制高位就需要尽量大，也就是尽量找到高位为一的结果。  
所以我们可以从最高位(第32位)开始，查找是否有异或结果为1的两个数，有则设定该位为1，否则为0，再看下一位。  
以四位二进制的[5,7,3]为例。  
首先找最高位是否有一个零和一个一，这样异或结果就是一，显然没找到，这一位只能设为零。

<script defer type="text/tikz">
\definecolor{ashgrey}{rgb}{0.7, 0.75, 0.71}
\definecolor{aliceblue}{rgb}{0.94, 0.97, 1.0}
\definecolor{amber}{rgb}{1.0, 0.75, 0.0}
\begin{tikzpicture}[
every node/.style={node font=\large\bfseries, line width=1.5pt, minimum size=12mm},
grey node/.style={fill=lightgray},
blue node/.style={fill=aliceblue},
gold node/.style={fill=amber},
]
\node at (-2.5,0.5) {$5$};

\foreach \x/\v/\type in {0/0/blue node,1/1/,2/0/,3/1/} {
\pgfmathsetmacro{\next}{int(\x+1)};
\draw[\type] (\x,0) rectangle node (a\x) {\v} (\next,1);
}

\node at (-2.5,-0.5) {$7$};

\foreach \x/\v/\type in {0/0/blue node,1/1/,2/1/,3/1/} {
\pgfmathsetmacro{\next}{int(\x+1)};
\draw[\type] (\x,-1) rectangle node (a\x) {\v} (\next,0);
}

\node at (-2.5,-1.5) {$3$};

\foreach \x/\v/\type in {0/0/blue node,1/0/,2/1/,3/1/} {
\pgfmathsetmacro{\next}{int(\x+1)};
\draw[\type] (\x,-2) rectangle node (c\x) {\v} (\next,-1);
}

\end{tikzpicture}
</script>

再找是否有两个数的最高两位异或结果为`01`，比如`00`和`01`，显然存在这样的数，所以前两位设置为`01`。

<script defer type="text/tikz">
\definecolor{ashgrey}{rgb}{0.7, 0.75, 0.71}
\definecolor{aliceblue}{rgb}{0.94, 0.97, 1.0}
\definecolor{amber}{rgb}{1.0, 0.75, 0.0}
\definecolor{ceil}{rgb}{0.57, 0.63, 0.81}
\begin{tikzpicture}[
every node/.style={node font=\large\bfseries, line width=1.5pt, minimum size=12mm},
grey node/.style={fill=lightgray},
blue node/.style={fill=aliceblue},
gold node/.style={fill=amber},
]
\node at (-2.5,0.5) {$5$};

\foreach \x/\v/\type in {0/0/blue node,1/1/blue node,2/0/,3/1/} {
\pgfmathsetmacro{\next}{int(\x+1)};
\draw[\type] (\x,0) rectangle node (a\x) {\v} (\next,1);
}

\node at (-2.5,-0.5) {$7$};

\foreach \x/\v/\type in {0/0/blue node,1/1/blue node,2/1/,3/1/} {
\pgfmathsetmacro{\next}{int(\x+1)};
\draw[\type] (\x,-1) rectangle node (a\x) {\v} (\next,0);
}

\node at (-2.5,-1.5) {$3$};

\foreach \x/\v/\type in {0/0/blue node,1/0/blue node,2/1/,3/1/} {
\pgfmathsetmacro{\next}{int(\x+1)};
\draw[\type] (\x,-2) rectangle node (c\x) {\v} (\next,-1);
}

\draw[ceil, line width=2pt] (0,0) rectangle (2,1);
\draw[ceil, line width=2pt] (0,-2) rectangle (2,-1);

\end{tikzpicture}
</script>

接下来找最高三位异或结果为`011`的两个数，也能找到，结果的最高三位设为`011`。

<script defer type="text/tikz">
\definecolor{ashgrey}{rgb}{0.7, 0.75, 0.71}
\definecolor{aliceblue}{rgb}{0.94, 0.97, 1.0}
\definecolor{amber}{rgb}{1.0, 0.75, 0.0}
\definecolor{ceil}{rgb}{0.57, 0.63, 0.81}
\begin{tikzpicture}[
every node/.style={node font=\large\bfseries, line width=1.5pt, minimum size=12mm},
grey node/.style={fill=lightgray},
blue node/.style={fill=aliceblue},
gold node/.style={fill=amber},
]
\node at (-2.5,0.5) {$5$};

\foreach \x/\v/\type in {0/0/blue node,1/1/blue node,2/0/blue node,3/1/} {
\pgfmathsetmacro{\next}{int(\x+1)};
\draw[\type] (\x,0) rectangle node (a\x) {\v} (\next,1);
}

\node at (-2.5,-0.5) {$7$};

\foreach \x/\v/\type in {0/0/blue node,1/1/blue node,2/1/blue node,3/1/} {
\pgfmathsetmacro{\next}{int(\x+1)};
\draw[\type] (\x,-1) rectangle node (a\x) {\v} (\next,0);
}

\node at (-2.5,-1.5) {$3$};

\foreach \x/\v/\type in {0/0/blue node,1/0/blue node,2/1/blue node,3/1/} {
\pgfmathsetmacro{\next}{int(\x+1)};
\draw[\type] (\x,-2) rectangle node (c\x) {\v} (\next,-1);
}

\draw[ceil, line width=2pt] (0,0) rectangle (3,1);
\draw[ceil, line width=2pt] (0,-2) rectangle (3,-1);
\end{tikzpicture}
</script>

最后找异或结果为`0111`的两个数，找不到这样的数，所以最终结果为`0110`，即6。

<script defer type="text/tikz">
\definecolor{ashgrey}{rgb}{0.7, 0.75, 0.71}
\definecolor{aliceblue}{rgb}{0.94, 0.97, 1.0}
\definecolor{amber}{rgb}{1.0, 0.75, 0.0}
\definecolor{ceil}{rgb}{0.57, 0.63, 0.81}
\begin{tikzpicture}[
every node/.style={node font=\large\bfseries, line width=1.5pt, minimum size=12mm},
grey node/.style={fill=lightgray},
blue node/.style={fill=aliceblue},
gold node/.style={fill=amber},
]
\node at (-2.5,0.5) {$5$};

\foreach \x/\v/\type in {0/0/blue node,1/1/blue node,2/0/blue node,3/1/blue node} {
\pgfmathsetmacro{\next}{int(\x+1)};
\draw[\type] (\x,0) rectangle node (a\x) {\v} (\next,1);
}

\node at (-2.5,-0.5) {$7$};

\foreach \x/\v/\type in {0/0/blue node,1/1/blue node,2/1/blue node,3/1/blue node} {
\pgfmathsetmacro{\next}{int(\x+1)};
\draw[\type] (\x,-1) rectangle node (a\x) {\v} (\next,0);
}

\node at (-2.5,-1.5) {$3$};

\foreach \x/\v/\type in {0/0/blue node,1/0/blue node,2/1/blue node,3/1/blue node} {
\pgfmathsetmacro{\next}{int(\x+1)};
\draw[\type] (\x,-2) rectangle node (c\x) {\v} (\next,-1);
}

\draw[ceil, line width=2pt] (0,0) rectangle (4,1);
\draw[ceil, line width=2pt] (0,-2) rectangle (4,-1);
\end{tikzpicture}
</script>

```java
// https://leetcode.cn/problems/ms70jA/submissions/611441385
    public int findMaximumXOR(int[] nums) {
    int result = 0;
    Set<Integer> seen = new HashSet<>();

    for (int i = 31; i >= 0; i--) {
        result <<= 1;
        int target = result + 1;
        seen.clear();
        for (int n : nums) {
            if (seen.isEmpty()) {
                seen.add(n >> i);
            } else {
                if (seen.contains((n >> i) ^ target)) {
                    result += 1;
                    break;
                } else {
                    seen.add(n >> i);
                }
            }
        }
    }

    return result;
}
```