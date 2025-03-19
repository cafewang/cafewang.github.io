---
title:  "字符串第一讲"
date: 2025-02-17 06:50:00 +0800
categories: algorithm string 算法 字符串
---

## 旋转
```text
给定字符串s1和s2，检查s2是否是由s1旋转而成

输入：s1 = "waterbottle", s2 = "erbottlewat"
输出：True
```

常规做法是查找s2首字母在s1中的位置，然后作比较。  
以输入为例，e在s1中有3和10两个位置
+ 位置3将s2分为"erbottle"和"wat"，s1分为"wat"和"erbottle"，两者相等所以是true
+ 位置10将s2分为"e"和"rbottlewat"，s1分为"waterbottl"和"e"，两者不相等

下面介绍一种巧妙的解法，将s1和s1自身拼接，得到"waterbottlewaterbottle"，  
这个字符串中长度为s1长度的子串都是s1旋转后得到的字符串，检查是否包含s2即可。  
也可以拼接s1和s1.substring(0,s1.length() - 1)，是一样的。

```java
// https://leetcode.cn/problems/string-rotation-lcci/submissions/606085299/
    public boolean isFlipedString(String s1, String s2) {
        if (s1.length() != s2.length()) {
            return false;
        }
        return s1.length() == 0 ? true : (s1 + s1.substring(0, s1.length() - 1)).contains(s2);
    }
```

## 回文
```text
给定一个字符串s，统计字符串中回文子串的个数
```

通过动态规划求解回文子串的数量是比较简单的，创建二维数组boolean palindrome[s.length() + 1][s.length() + 1]

$$
\begin{align*}
palindrome[i][i]&=true \\
palindrome[i][i+1]&=true \\
palindrome[i][j]&=palindrome[i+1][j-1]\;\&\&\;str[i]==str[j-1]
\end{align*}
$$

递推规则很简单
+ 空串是回文串
+ 长度为一的串也是回文串
+ 回文串两端添加相同字符组成新的回文串

```java
// https://leetcode.cn/problems/palindromic-substrings/submissions/606206086/
    public int countSubstrings(String s) {
        int count = 0;
        boolean[][] palindrome = new boolean[s.length() + 1][s.length() + 1];
    
        for (int i = s.length(); i >= 0; i--) {
            for (int j = i; j <= s.length(); j++) {
                if (j == i) {
                    palindrome[i][j] = true;
                } else if (j == i + 1) {
                    count++;
                    palindrome[i][j] = true;
                } else {
                    palindrome[i][j] = s.charAt(i) == s.charAt(j - 1) && palindrome[i + 1][j - 1];
                    count += palindrome[i][j] ? 1 : 0;
                }
            }
        }
    
        return count;
    }
```

## 压缩
java中一个char需要2个字节即16位来保存，即使只用到基础ascii码(共128个字符)，也需要7位，下面介绍用哈夫曼树压缩存储字节流。  
哈夫曼树可以将字符转换成前缀码（即不互为前缀的二进制数组）表示，举个例子

<script defer type="text/tikz">
\begin{tikzpicture}[
level 1/.style = {sibling distance= 120pt},
level/.style={level distance=70pt, sibling distance=80pt},
every node/.style={circle, draw, node font=\large\bfseries, line width=1.5pt, minimum size=12mm},
]
\node (a) {} [line width=1pt] 
    child { node (b) {a} edge from parent node[draw=none, left] {0} } 
    child {
        node (c) {} 
        child { node (d) {c} edge from parent node[draw=none, left] {0} }
        child { node (e) {d} edge from parent node[draw=none, right] {1} }
        edge from parent node[draw=none, right] {1}
    }
;
\end{tikzpicture}
</script>

上图即是一个哈夫曼树，编码为`a=0,c=10,d=11`，显然这三个编码的前缀都互不重合。  
事实上，如上图将一个二叉树的左右路径编码为0和1，通往叶子节点的路径组成的编码就是前缀码，  
因为只有非叶子节点的编码才是叶子结点编码的前缀。  
哈夫曼树是能构建最优前缀码的一种算法，以字符串"aabbbccddeeeee"举例。  
首先统计词频，比较简单就不赘述了。  
接下来构建哈夫曼树，先看看树节点  
```java
    private static class Node implements Comparable<Node> {
        char c;
        int freq;
        Node left, right;

        public Node(Node left, Node right, char c, int freq) {
            this.left = left;
            this.right = right;
            this.c = c;
            this.freq = freq;
        }

        public int compareTo(Node that) {
            return Integer.compare(this.freq, that.freq);
        }
    }
```
其实就是二叉树节点带上一个字符c和词频freq，非根节点c设为'\0'。  
重点来了，构建哈夫曼树过程如下
+ 创建所有叶子节点，写入字符c和词频freq，放入一个优先队列pq(小根堆)
+ 优先队列长度大于一时，取出词频最小的两个节点，创建非叶子节点作为两个节点的父节点，词频设置为两者之和，将父节点入队
+ 优先队列只剩一个节点时，将该节点作为哈夫曼树的根节点

<script defer type="text/tikz" data-tikz-libraries="positioning">
\begin{tikzpicture}[
level 1/.style = {sibling distance= 120pt},
level/.style={level distance=70pt, sibling distance=80pt},
every node/.style={circle, draw, node font=\large\bfseries, line width=1.5pt, minimum size=12mm},
]
\foreach \x/\v/\freq/\type in {0/a/2/,2/b/3/,4/c/2/,6/d/2/,8/e/5/} {
  \node at (\x, 0) (a\x) {$\v_{\freq}$};
}

\node[below=1 of a0] (b0) {$0_4$} [line width=1pt] 
    child { node {$a_2$} edge from parent node[draw=none, left] {0} } 
    child { node {$c_2$} edge from parent node[draw=none, right] {1} }
;

\node[right=5 of b0] (b1) {$0_5$} [line width=1pt] 
    child { node {$b_3$} edge from parent node[draw=none, left] {0} } 
    child { node {$d_2$} edge from parent node[draw=none, right] {1} }
;

\node[right=5 of b1] (b2) {$e_5$};

\node[below=3 of b0] (c0) {$0_9$} [line width=1pt] 
    child { node {$0_4$} 
        child { node {$a_2$} edge from parent node[draw=none, left] {0} } 
        child { node {$c_2$} edge from parent node[draw=none, right] {1} }
        edge from parent node[draw=none, left] {0}
    }
    child { node {$e_5$} edge from parent node[draw=none, right] {1} }
;

\node[right=5 of c0] (c1) {$0_5$} [line width=1pt] 
    child { node {$b_3$} edge from parent node[draw=none, left] {0} } 
    child { node {$d_2$} edge from parent node[draw=none, right] {1} }
;

\node[below=6 of c0] (d0) {$0_{14}$} [line width=1pt] 
    child { node {$0_9$} 
        child { node {$0_4$}
            child { node {$a_2$} edge from parent node[draw=none, left] {0} } 
            child { node {$c_2$} edge from parent node[draw=none, right] {1} }
            edge from parent node[draw=none, left] {0}
        }
        child { node {$e_5$} edge from parent node[draw=none, right] {1} }
        edge from parent node[draw=none, left] {0}
    }
    child { node {$0_5$}
        child { node {$b_3$} edge from parent node[draw=none, left] {0} } 
        child { node {$d_2$} edge from parent node[draw=none, right] {1} }
        edge from parent node[draw=none, right] {1}
    }
;
\end{tikzpicture}
</script>

由此可得到全部前缀码，`a=000,b=10,c=001,d=11,e=01`，原字符串`aabbbccddeeeee`就可以编码成  
`00000010101000100111110101010101`，长度为32，相较于7*14=98压缩了一半还多。  
下面列出完整的解码和编码的方法。

```java
    private static class Huffman {
        private static final int R = 128;
        private static class Node implements Comparable<Node> {
            char c;
            int freq;
            Node left, right;

            public Node(Node left, Node right, char c, int freq) {
                this.left = left;
                this.right = right;
                this.c = c;
                this.freq = freq;
            }

            public int compareTo(Node that) {
                return Integer.compare(this.freq, that.freq);
            }
        }

        Node root;
        String[] code;
        String encoded;
        String s;

        public Huffman(String s) {
            this.s = s;
            int[] freqArr = new int[R];
            for (int i = 0; i < s.length(); i++) {
                freqArr[s.charAt(i)]++;
            }
            PriorityQueue<Node> pq = new PriorityQueue<>();
            for (int i = 0; i < R; i++) {
                if (freqArr[i] != 0) {
                    pq.add(new Node(null, null, (char)i, freqArr[i]));
                }
            }
            while (pq.size() > 1) {
                Node x = pq.poll();
                Node y = pq.poll();
                Node parent = new Node(x, y, '\0', x.freq + y.freq);
                pq.add(parent);
            }
            root = pq.poll();
            buildCode(root);
            encoded = encode();
        }

        public String getEncoded() {
            return encoded;
        }

        private void buildCode(Node node) {
            code = new String[R];
            buildCode(code, node, "");
        }

        private void buildCode(String[] code, Node node, String s) {
            if (node.left == null && node.right == null) {
                code[node.c] = s;
                return;
            }
            buildCode(code, node.left, s + '0');
            buildCode(code, node.right, s + '1');
        }

        public String encode() {
            StringBuilder builder = new StringBuilder();
            for (int i = 0; i < s.length(); i++) {
                builder.append(code[s.charAt(i)]);
            }
            return builder.toString();
        }

        public String decode(String binaryStream) {
            StringBuilder builder = new StringBuilder();
            Node current = null;
            for (int i = 0; i < binaryStream.length(); i++) {
                char c = binaryStream.charAt(i);
                current = current == null ? root : current;
                current = c == '0' ? current.left : current.right;
                if (current.c != '\0') {
                    builder.append(current.c);
                    current = null;
                }
            }
            return builder.toString();
        }
    }
```
R指定字符集大小，这里128表示基础ascii码，注意Node实现了词频的比较器，在优先队列中会被用到。

## 后缀数组
先看这个问题
```text
给定字符串s，求出任意一个最长的重复子串(子串在字符串中出现至少2次，子串可以相互重叠)
如果不含重复子串，返回空串

输入：s = "banana"
输出："ana"
```

这题乍一看复杂度很高，列举子串需要$$O(N^2)$$，匹配每个子串平均需要N次比较，  
复杂度达到$$O(N^3)$$，效率是不可接受的，下面考察一下后缀数组，以"banana"举例，  
`["banana","anana","nana","ana","na","a"]`就是后缀数组，  
s的每个子串都是后缀数组中某些后缀的前缀，比如"an"是"anana"和"ana"的前缀，  
所以当我们将后缀数组排序，前缀相同的后缀会相邻，逐对检查即可找出最长重复子串  
["a","<font color="lightblue">ana</font>","<font color="lightblue">ana</font>na","banana","na","nana"]

```java
    public String longestDupSubstring(String s) {
        Integer[] idxArr = new Integer[s.length()];
        for (int i = 0; i < idxArr.length; i++) {
            idxArr[i] = i;
        }
        Arrays.sort(idxArr, (a, b) -> s.substring(a).compareTo(s.substring(b)));
        String dup = null;
        StringBuilder builder = new StringBuilder();
        for (int i = 0; i < idxArr.length - 1; i++) {
            String a = s.substring(idxArr[i]), b = s.substring(idxArr[i + 1]);
            int j = 0;
            while (j < a.length() && j < b.length() && a.charAt(j) == b.charAt(j)) {
                j++;
            }
            if (dup == null || j > dup.length()) {
                dup = a.substring(0, j);
            }
        }
        return dup == null ? "" : dup;
    }
```
上述代码使用索引数组表示真正的后缀数组，可以节省存储全部后缀的空间，字符串较长时，后缀所占空间会很大  
`时间复杂度`: 主要耗时在排序上，为$$O(N^2log_{2}N)$$，即原本排序耗时乘以字符串比较的耗时，  
算法还可以优化到$$O(Nlog_{2}^{2}N)$$甚至$$O(N)$$，这类算法比较复杂，不在本章展开。
