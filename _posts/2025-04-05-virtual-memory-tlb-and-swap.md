---
title:  "虚拟内存-TLB和swap"
date: 2025-04-05 19:45:00 +0800
permalink: /os/tlb_and_swap_space
categories: os virtual-memory tlb swap-space
---
[上一章](/os/pagination)我们讲过通过多级分页解决虚拟内存管理占用空间过大的问题，但是访问效率的问题还没有解决。关于效率的问题一般都可以通过空间来换时间，也就是使用缓存。用于分页的缓存硬件就称为TLB(Translation Lookaside Buffer)。

## TLB
TLB就是用于VFN到PFN转换的缓存，配合CPU加速内存的访问。对于多级缓存，TLB存储dirNo+VFN到PFN的转换。  
除了PFN，TLB还会存储valid及其他必要字段。TLB一般能记录64、128或者更多条映射，TLB满之后就需要应用缓存置换策略来更新。  
加上TLB之后，访问内存变为如下步骤:
+ 查询TLB是否包含dirNo_VFN的映射
  + 存在，校验是否为valid
    + 是，则获得PFN访问内存
    + 否，则抛出segmentation fault的异常
  + 不存在，则通过多级页表查询到PFN和其他字段，回写TLB，然后重新访问

TLB查询不到称为TLB miss，每次TLB miss的成本是很高的，提高TLB的命中率和缓存置换策略息息相关，这个我们在下一节具体说。

## swap space
我们之前举的例子中，虚拟空间都不大于物理空间，但实际上是可以大于的，那多的部分存在哪里呢？  
没错，就放在磁盘中，以下图举例，内存总共分为4页，运行了3个进程。

<script defer type="text/tikz" data-tikz-libraries="positioning">
\definecolor{ashgrey}{rgb}{0.7, 0.75, 0.71}
\definecolor{aliceblue}{rgb}{0.94, 0.97, 1.0}
\definecolor{coolgrey}{rgb}{0.55, 0.57, 0.67}
\definecolor{arylideyellow}{rgb}{0.91, 0.84, 0.42}
\begin{tikzpicture}[
every node/.style={node font=\large\bfseries, line width=1.5pt, minimum size=12mm},
grey node/.style={fill=coolgrey},
ash node/.style={fill=ashgrey},
black node/.style={fill=gray},
yellow node/.style={fill=arylideyellow},
]

\foreach \x/\v/\t in {0/Proc 0 VPN 0/ash node,2/Proc 1 VPN 0/grey node,4/Proc 1 VPN 1/grey node,6/Proc 2 VPN 0/yellow node} {
  \pgfmathsetmacro{\next}{int{\x+2}};
  \draw[\t] (\x,0) rectangle node[text width=2cm, align=center] (a\x) {\v} (\next,2);
}

\foreach \x/\v in {0/PFN0,2/PFN1,4/PFN2,6/PFN3} {
  \node[above=1pt of a\x] {\v};
}

\node[text width=2cm, align=center] at (-1,1) {Physical Memory};

\foreach \x/\v/\t in {0/Proc 0 VPN 1/ash node,2/Proc 0 VPN 2/ash node,4/Free/,6/Proc 3 VPN 0/black node} {
  \pgfmathsetmacro{\next}{int{\x+2}};
  \draw[\t] (\x,-3) rectangle node[text width=2cm, align=center] (b\x) {\v} (\next,-1);
}

\node[text width=2cm, align=center] at (-1,-2) {Swap Space};

\foreach \x/\v in {0/BLOCK0,2/BLOCK1,4/BLOCK2,6/BLOCK3} {
  \node[above=1pt of b\x] {\v};
}

\end{tikzpicture}
</script>

如上图，swap space在磁盘中，由4块组成，每块大小等于一页。  
Proc0一页在内存中，两页在磁盘中；Proc1两页都在内存中；Proc2一页在内存中；Proc3全部在磁盘中，显然没有正在运行。

## 页面置换策略
我们在页表中添加标志present，表示页面是否在内存中。如果读写时发现不在，就会触发page fault中断，然后中断处理器会找到一个空页，将页面从磁盘中加载到内存里，再重新读写。  
系统一般会启动后台线程，检查内存是否大于某临界值，是的话，就会将部分页存储到swap space，也就是磁盘中，判断哪些页面被置换的策略就称为`页面置换策略`。  
常见策略有
+ FIFO，即先进先出，置换最早被使用的页面
+ random，随机置换
+ LRU，置换最近未被使用的页面
+ LFU，置换最少被使用的页面

一般LRU的缓存命中率是比较高的，但是纯硬件实现过于复杂，下面介绍一种approximating LRU。  
在页表中加入3个字段
+ present，表示页面在内存(1)还是磁盘中(0)
+ blockNo，如果在磁盘中，表示在磁盘中的起始位置
+ use，在读写页面时被置为1

这样寻找将被替换的内存页
+ 遍历页表中present为1的页
  + 如果use=1，将use置为0
  + 如果use=0，将该页和磁盘中要加载的页交换

### 测试
克隆`https://github.com/cafewang/playground.git` 项目，运行测试类`ApproximatingLRUTest`。  
测试以字节数组代替物理内存和磁盘，假设物理内存为4页，磁盘为8页，测试场景如下
+ 申请12个页面后，无法再申请新的页面，因为内存和磁盘都满了
+ 申请4个页面后，再申请一个页面，查看页表中有一个页面在磁盘中(present=0)
+ 申请5个页面，读取磁盘中的页面，检查页表确认该页面已经加载到内存中