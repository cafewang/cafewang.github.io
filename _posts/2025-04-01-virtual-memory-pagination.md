---
title:  "虚拟内存-分页管理"
date: 2025-04-01 19:45:00 +0800
permalink: /os/pagination
categories: os virtual-memory pagination
---

想理解操作系统的内存管理，就必须搞清楚虚拟内存的概念。以32位机器为例，物理内存最大为4GB，但是每个进程都能有4GB甚至更大的地址空间，即虚拟内存，这是怎么实现的呢？请跟随我的脚步往下看。
## base & bound
先克隆项目`https://github.com/cafewang/playground` ，使用IDEA打开，运行`os-related`模块中的测试类。  
我们用字节数组表示物理内存，对应`PhysicalMemory`类，虚拟内存为`VirtualMemory`抽象类的实现类。  
首先看最简单的虚拟内存实现方式，base and bound，即通过给CPU添加两个寄存器，base和bound，表示给正在运行的进程分配的内存区域，  
虚拟内存范围为[0, bound)，而对应物理内存为[base, base + bound)，bound即为虚拟内存大小。  
举一个例子，物理内存只有8B，虚拟内存为4B，设置base=2, bound=4，虚拟内存在物理内存中的映射如下图所示。

<script defer type="text/tikz">
\definecolor{ashgrey}{rgb}{0.7, 0.75, 0.71}
\definecolor{aliceblue}{rgb}{0.94, 0.97, 1.0}
\begin{tikzpicture}[
every node/.style={node font=\large\bfseries, line width=1.5pt, minimum size=12mm},
green node/.style={draw=none, fill=green!30, fill opacity=0.2},
gray node/.style={draw=none, fill=gray!30, fill opacity=0.2},
]

\draw (0,0) rectangle (3,8);
\foreach \x in {0,...,7} {
  \pgfmathsetmacro{\next}{int(\x+1)};
  \draw (0,\x) rectangle  node[left, xshift=-35] (a\x) {\x}  (3,\next);
}

\foreach \x in {2,...,5} {
  \pgfmathsetmacro{\next}{int(\x+1)};
  \draw[fill=ashgrey] (0,\x) rectangle (3,\next);
}
\end{tikzpicture}
</script>

base & bound的问题在于粒度太粗，将虚拟内存一整块分配给进程，会在虚拟内存内部留下大量未使用的部分，称为内部碎片(internal fragmentation)。

### 测试
测试类`BaseAndBoundTest`验证了如下几种情况
+ 虚拟内存范围映射到了物理内存之外，抛出异常
+ 访问虚拟内存地址为负 或 超过bound大小，抛出异常
+ 正常读写虚拟内存

## 分段
如果把虚拟内存分成多个部分，内存管理的灵活性就能增加。通过这个思路，产生出分段的管理方式。  
即将进程的虚拟内存分为三块，code段、heap段、stack段，用三个base bound寄存器分别管理。  
如下图，物理内存为16B，分为code占4B，heap占4B，stack占8B的三部分。  

<script defer type="text/tikz" data-tikz-libraries="positioning">
\definecolor{ashgrey}{rgb}{0.7, 0.75, 0.71}
\definecolor{airforceblue}{rgb}{0.36, 0.54, 0.66}
\definecolor{almond}{rgb}{0.94, 0.87, 0.8}
\definecolor{arylideyellow}{rgb}{0.91, 0.84, 0.42}
\begin{tikzpicture}[
every node/.style={node font=\large\bfseries, line width=1.5pt, minimum size=12mm},
green node/.style={draw=none, fill=green!30, fill opacity=0.2},
gray node/.style={draw=none, fill=gray!30, fill opacity=0.2},
]

\draw (0,0) rectangle (3,16);
\foreach \x in {0,...,15} {
  \pgfmathsetmacro{\next}{int(\x+1)};
  \draw (0,\x) rectangle  node[left, xshift=-35] (a\x) {\x}  (3,\next);
}

\foreach \x in {0,...,3} {
  \pgfmathsetmacro{\next}{int(\x+1)};
  \draw[fill=ashgrey] (0,\x) rectangle (3,\next);
}

\foreach \x in {4,...,7} {
  \pgfmathsetmacro{\next}{int(\x+1)};
  \draw[fill=airforceblue] (0,\x) rectangle (3,\next);
}

\foreach \x in {8,...,15} {
  \pgfmathsetmacro{\next}{int(\x+1)};
  \draw[fill=arylideyellow] (0,\x) rectangle (3,\next);
}

\node[right=-10pt of a2] {code segment};
\node[right=-10pt of a6] {heap segment};
\node[right=-10pt of a12] {stack segment};
\end{tikzpicture}
</script>

这样虽然粒度较base and bound有提高，并不能根本提升分配的灵活度。
### 测试
在`SegmentTest`类中，仅验证了代码段非法访问和正常读写的场景。

## 分页
假设我们将物理内存均分，每一份称为一页，每页标识一个页码，这样进程按需申请若干页，动态伸缩也更方便。  
由于若干进程共享物理内存，每个进程有自己的虚拟空间，也有自己的虚拟页和页码，每个虚拟页映射到一个物理页，管理每个进程页映射的结构就称为`页表`。
我们将虚拟页码称为VFN(virtual frame number)，物理页码成为PFN(physical frame number)。  
假设物理内存有5位，页大小为8B，则8位虚拟内存页码有2位，即4个，映射如下表。

| **VFN** | **PFN** |
|:-------:|:-------:|
| 0       | 1       |
| 1       | 2       |
| 2       | 0       |
| 3       | 3       |

<script defer type="text/tikz" data-tikz-libraries="positioning, decorations.pathreplacing">
\definecolor{ashgrey}{rgb}{0.7, 0.75, 0.71}
\definecolor{airforceblue}{rgb}{0.36, 0.54, 0.66}
\definecolor{almond}{rgb}{0.94, 0.87, 0.8}
\definecolor{arylideyellow}{rgb}{0.91, 0.84, 0.42}
\begin{tikzpicture}[
every node/.style={node font=\large\bfseries, line width=1.5pt, minimum size=12mm},
green node/.style={draw=none, fill=green!30, fill opacity=0.2},
gray node/.style={fill=ashgrey},
]

\foreach \x/\v/\t in {0//, 1//, 2//, 3//, 4//} {
  \pgfmathsetmacro{\next}{int(\x+1)};
  \draw[\t] (\x,0) rectangle node (a\x) {\v} (\next, 1);
}

\node at (2.5, 1.5) {physical address};

\draw [decorate, decoration = {brace,mirror}, thick] (0,-.2) --  (3,-.2) 
node[pos=0.5, anchor=north] {PFN};

\draw [decorate, decoration = {brace,mirror}, thick] (3.2,-.2) --  (5,-.2) 
node[pos=0.5, anchor=north] {page};

\foreach \x/\v/\t in {0//, 1//, 2//, 3//, 4//} {
  \pgfmathsetmacro{\next}{int(\x+1)};
  \draw[\t] (\x,-3) rectangle node (b\x) {\v} (\next, -2);
}

\node at (2.5, -1.5) {virtual address};

\draw [decorate, decoration = {brace,mirror}, thick] (0,-3.2) --  (3,-3.2) 
node[pos=0.5, anchor=north] {VFN};

\draw [decorate, decoration = {brace,mirror}, thick] (3.2,-3.2) --  (5,-3.2) 
node[pos=0.5, anchor=north] {page};

\end{tikzpicture}
</script>

上图为物理地址与虚拟地址的位数分配。  
下图为物理内存中对应的虚拟页。

<script defer type="text/tikz" data-tikz-libraries="positioning">
\definecolor{ashgrey}{rgb}{0.7, 0.75, 0.71}
\definecolor{airforceblue}{rgb}{0.36, 0.54, 0.66}
\definecolor{almond}{rgb}{0.94, 0.87, 0.8}
\definecolor{arylideyellow}{rgb}{0.91, 0.84, 0.42}
\begin{tikzpicture}[
every node/.style={node font=\large\bfseries, line width=1.5pt, minimum size=12mm},
green node/.style={draw=none, fill=green!30, fill opacity=0.2},
gray node/.style={fill=ashgrey},
]

\draw (0,0) rectangle (3,3);

\foreach \x/\v/\t in {0/2/gray node,1/0/,2/1/gray node,3/3/} {
  \pgfmathsetmacro{\next}{int(\x+1)};
  \draw[\t] (0,\x) rectangle node (b\x) {\v} (3,\next);
}

\foreach \x/\v in {0/0,1/0x8,2/0x10,3/0x18} {
  \pgfmathsetmacro{\next}{int(\x+1)};
  \draw (0,\x) node[left] (a\x) {\v} rectangle  (3,\next);
}
\end{tikzpicture}
</script>

每个页表项至少需要包含PFN和valid标识，valid标识页表是否申请，我们可以将页表数组放在内存中，基址由操作系统提供，称为page table base。  
页表分配和管理由操作系统完成，需要单独划分内存区域管理页表数组，每个进程一个。

### 问题
分页管理存在如下两个问题
1. 假设页表项为4B，页大小为4KB，虚拟内存为32位，则共$$2^{20}$$页，页表数组大小为4MB，如果有100个进程，则需要400MB，尽管实际使用的页数很少，仍占据了大量空间。  
2. 通过虚拟页访问内存，需要先访问页表数组，获得物理页码，再在物理页上完成读写，多了一次内存访问，相当于比一般内存访问慢一倍

### 测试
测试类`PageTableTest`规则如下
+ 同一个PFN不能分配给多个VFN
+ 未申请的虚拟页不能进行读写
+ 初始状态进程的所有虚拟页都是invalid
+ 申请后的虚拟页可以读写

## 多级分页
本节我们试图解决分页管理页表过大的问题，页表本身就是相当于将内存空间分组，每组大小为页大小。  
如果再将页分组，每组称为一个页目录(page directory)，初始状态下就不用申请整个页表空间了，只需要申请`页目录个数 * 页目录项大小`的空间。  
为方便管理，每个页目录包含一页的页表项，即每个页目录中有`页大小 / 页表项大小`个子页。  
以物理空间8位，虚拟空间8位，页大小16B，页表项4B，则每个页目录包含4个子页，一共4个页目录。  
虚拟地址位数分配如下：

<script defer type="text/tikz" data-tikz-libraries="positioning, decorations.pathreplacing">
\definecolor{ashgrey}{rgb}{0.7, 0.75, 0.71}
\begin{tikzpicture}[
every node/.style={node font=\large\bfseries, line width=1.5pt, minimum size=12mm},
]
\foreach \x in {0,...,7} {
  \pgfmathsetmacro{\next}{int(\x+1)};
  \draw (\x,0) rectangle node (b\x) {} (\next, 1);
}

\node at (4, 1.5) {virtual address};

\draw [decorate, decoration = {brace,mirror}, thick] (0,-.2) --  (1.9,-.2) 
node[pos=0.5, anchor=north] {dirNo};

\draw [decorate, decoration = {brace,mirror}, thick] (2.1,-.2) --  (3.9,-.2) 
node[pos=0.5, anchor=north] {pageNo};

\draw [decorate, decoration = {brace,mirror}, thick] (4.1,-.2) --  (7.9,-.2) 
node[pos=0.5, anchor=north] {pageOffset};

\end{tikzpicture}
</script>

假设申请了如下页面

| **dirNo** | **dirNo.PFN** | **VFN** | **PFN** |
|:---------:|:-------------:|:-------:|:-------:|
| 0         | 3             | 0       | 1       |
| 1         | 2             | 3       | 5       |
| 2         | 7             | 2       | 0       |


则物理内存对应虚拟页面如下

<script defer type="text/tikz" data-tikz-libraries="positioning">
\definecolor{ashgrey}{rgb}{0.7, 0.75, 0.71}
\definecolor{airforceblue}{rgb}{0.36, 0.54, 0.66}
\definecolor{almond}{rgb}{0.94, 0.87, 0.8}
\definecolor{arylideyellow}{rgb}{0.91, 0.84, 0.42}
\begin{tikzpicture}[
every node/.style={node font=\large\bfseries, line width=1.5pt, minimum size=12mm},
green node/.style={draw=none, fill=green!30, fill opacity=0.2},
yellow node/.style={fill=arylideyellow},
blue node/.style={fill=airforceblue},
]

\foreach \x in {0,...,15} {
  \pgfmathsetmacro{\next}{int(\x+1)};

  \draw (0,\x) rectangle node (b\x) {} (4,\next);
}

\foreach \x in {0,...,15} {
  \pgfmathsetmacro{\next}{int(\x+1)};
  \pgfmathsetmacro{\v}{int(\x*16)};
  \pgfmathsetmacro{\h}{Hex(\v)};
  \draw (0,\x) node[left] (a\x) {0x\h} rectangle  (4,\next);
}

\def\PFNONE{dirNo:0 VFN:0}
\def\PFNFIVE{dirNo:1 VFN:3}
\def\PFNZERO{dirNo:2 VFN:2}
\foreach \x/\v/\t in {0/\PFNZERO/yellow node,1/\PFNONE/yellow node,2/PFN of dir1/blue node,3/PFN of dir0/blue node,5/\PFNFIVE/yellow node,7/PFN of dir2/blue node} {
  \pgfmathsetmacro{\next}{int(\x+1)};
  \draw[\t] (0,\x) rectangle node (c\x) {\v} (4,\next);
}
\end{tikzpicture}
</script>

页目录项中的valid表示的是一整个目录中是否存在已申请的子页，valid = 0表示整个目录都未申请，这种情况下只需要存一条记录，而普通页表则需要为每页都生成一条无效的页表项(valid = 0)。  
但是访问内存时，二级页表需要先查页目录项的PFN，再找到子页的PFN，最后才能访问到真正的物理地址，比普通页表还多一次内存访问。

### 测试
在测试类``中，验证了如下场景：
+ 初始状态下所有页目录项都为invalid
+ 无法访问页目录项为invalid的页
+ 无法访问页目录为valid，但是为invalid的子页。
+ 可以正常读写页目录中valid的子页。

## 总结
本章详细描述了虚拟内存的工作原理，分页管理在粒度上由于分段或者base and bound的方式，但是仍存在额外的内存访问成本，让我们在下一章尝试解决。