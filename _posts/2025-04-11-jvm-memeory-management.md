---
title:  "JVM内存管理"
date: 2025-04-11 08:39:00 +0800
permalink: /jvm-in-depth/jvm-memory-management
categories: jvm memory-management
---
要深入理解jvm内存管理，我们需要从两方面来看，一是jvm规范中对内存管理的定义，二是hotspot对jvm规范的具体实现。

## jvm运行时区域
先看两张总览图
java1.7  
![](/assets/img/java-runtime-data-areas-jdk1.7.png)
java1.8  
![](/assets/img/java-runtime-data-areas-jdk1.8.png)  

jvm运行时区域分为两部分：
+ 线程共享区域
  + 堆(heap)，就是绝大部分对象所处的位置，因为java1.7默认开启了逃逸分析，没有被外部引用的对象可以在栈上分配，而后续的`垃圾收集器`的讨论也主要是围绕堆进行
  + 方法区(method area)，运行时类信息存储的位置，包含运行时常量池(加载类文件中的常量池)、字段和方法信息、字节码信息等。
+ 线程独有区域
  + pc寄存器(program counter register)，类似CPU中的pc，记录字节码的运行位置
  + 虚拟机栈(virtual machine stack)，java方法运行产生的栈，栈帧将在后面详细讨论
  + 本地方法栈(native method stack)，native方法运行产生的栈

版本区别：1.7中，方法区的实现是永久代(permGeneration)，存在于java运行时区域中。  
1.8中，方法区的实现是元空间(metaSpace)，在本地内存中，所以运行时常量池也在元空间中。

### 栈帧
+ 局部变量表(local variables)，即方法中定义的参数、局部变量，值得注意的是返回地址也在局部变量表中
+ 操作数栈(operand stacks)，保存字节码执行过程中的中间结果，最大深度在`编译期间`就确定了
+ 动态链接(dynamic linking),当前方法的符号引用解析成的动态链接，简单来说就是方法在运行时区域中的位置

运行时区域的划分介绍完了，下面开始详细介绍jvm的内存管理工具-垃圾收集器。

## 垃圾收集器
垃圾收集器(garbage collector)的命名其实有些歧义，更准确的说法应该是内存管理器(memory maneger)，因为垃圾收集器的职责不仅是回收不可达对象，还负责堆空间的划分和管理、堆内存的申请和回收。  
垃圾收集器也是有代际划分的，我们重点介绍1.7和1.7之后推荐使用的垃圾收集器。后文简称收集器。
首先介绍一下分代收集(generational collection)，收集器中除了ZGC都是分代收集的。
+ 新生代(young generation)，短期存活对象所处的区域，分为如下两块
  + eden，大部分对象最开始都分配在eden区，相当于年龄为0
  + survivor，分为两块，from区和to区，to区平时为空，仅在进行minor GC或full GC时，保存eden和from区的存活对象，然后from区和to区交换
+ 老年代(old generation)，保存年龄超过阈值（阈值由算法动态计算，或手动指定）

可以这样理解，对象按年龄(即对象被移动的次数，因为一般情况下，无论minor GC或full GC都会移动存活对象，CMS除外)分为3个区域，刚创建的对象在eden，`中年对象`在survivor，最后进入老年代。  
一般来说，新生代满的时候会触发minor GC，使用指定的新生代收集算法清理，完成后eden区会清空，部分对象会晋升到老年代。  
老年代或永久代(1.7及之前版本的方法区)满时，会触发full GC，一般会先用新生代收集算法进行minor GC，然后用老年代收集算法清理老年代和永久代。  
如果涉及压缩，每一代会单独进行。
如果minor GC晋升的对象无法被老年代容纳，会以老年代收集算法清理整个堆(CMS除外，它只能清理老生代)。

### Serial
serial收集器可以收集新生代和老年代，以`stop-the-world`的方式进行，即暂停所有工作线程。

#### 新生代收集
![](/assets/img/collector/serial-young-generation.png)  
+ eden区对象被移到to区，除了部分较大对象直接移到老年代
+ from区对象根据年龄移到to区或老年代
+ to区满时，后续eden和from区对象都移到老年代

#### 老年代收集
![](/assets/img/collector/serial-old.png)  
老年代收集算法称为`mark-sweep-compact`
+ mark即标记存活对象，时长和存活对象数量有关
  + jvm从GC root向下扫描出所有存活对象，典型的GC root有
    + 当前方法的参数和局部变量
    + 活跃线程
    + 已加载类的字段
    + JNI引用
+ sweep即清理垃圾对象，实际上jvm并不执行`清理内存`的工作，只是在不同代中标记出垃圾对象
+ compact即将存活对象移动到老年代(永久代类似)的一端，方便内存分配

Serial收集器主要用于运行在客户端且对pause time要求不高的场景，一般不会用在服务端。

### Parallel
parallel收集器又被称为throughput(吞吐量)收集器，注意在收集器中parallel和concurrent的区别，parallel是指多个回收线程同时执行，而concurrent是指回收线程和工作线程同时执行。  

#### 新生代收集
![](/assets/img/collector/serial-old.png)
仍使用和serial相同的新生代收集算法，只是使用多线程执行`stop-the-world`的操作，减少pause time，从而增加throughput。

#### 老年代收集
默认仍使用serial收集，需要设置`-XX:+UseParallelGC`执行parallel老年代收集。收集分为3步，首先将老年代(永久代)分为固定大小的区域。
+ marking阶段，给每个回收线程分配一些初始的可达对象，并行查找所有的可达对象，并分区域记录可达对象的信息。
+ summary阶段，单线程执行，将区域从左到右扫描，从中间一分为二，左边的区域包含大量可达对象，所以不做清理，称为dense prefix，右侧区域会执行清理，记录清理后的地址区间，如图中的区域3和4，对应下方的绿色区间
+ compaction阶段，多线程移动summary时记录的区域，最终压缩为左端填满对象，右端为空的结构。

<script defer type="text/tikz" data-tikz-libraries="positioning, decorations.pathreplacing">
\definecolor{ashgrey}{rgb}{0.7, 0.75, 0.71}
\definecolor{inchworm}{rgb}{0.7, 0.93, 0.36}
\begin{tikzpicture}[
every node/.style={node font=\large\bfseries, line width=1.5pt, minimum size=12mm},
gray node/.style={fill=ashgrey},
worm node/.style={fill=inchworm},
]

\foreach \x/\t in {0/gray node,1/gray node,2/gray node,3/gray node,4/gray node,5/,6/,7/} {
  \pgfmathsetmacro{\next}{\x+1};
  \draw[\t] (\x,0) rectangle (\next,1) node[midway] (a\x) {};
  \node[anchor=south east, font=\small, minimum size=0] at (\next,0) {\x};
}

\draw [decorate, decoration = {brace,mirror}, thick] (0,-.2) --  (3,-.2) 
node[pos=0.5, anchor=north] {dense prefix};

\foreach \x/\t in {0/gray node,1/gray node,2/gray node,3/,4/,5/,6/,7/} {
  \pgfmathsetmacro{\next}{\x+1};
  \draw[\t] (\x,-3) rectangle (\next,-2) node[midway] (b\x) {};
  \node[anchor=south east, font=\small, minimum size=0] at (\next,-3) {\x};
}

\draw [decorate, decoration = {brace,mirror}, thick] (0,-3.2) --  (3,-3.2) 
node[pos=0.5, anchor=north] {dense prefix};

\draw[worm node] (3,-3) rectangle (3.3,-2) node[midway] (c0) {};
\draw[worm node] (3.3,-3) rectangle (3.5,-2) node[midway] (c1) {};

\draw[->] (a3) -- (c0);
\draw[->] (a4) -- (c1);
\end{tikzpicture}
</script>

parallel收集器适用于多核且对吞吐量要求高的场景。

### CMS(Concurrent Mark Sweep)
CMS，即`并发标记清除`收集器，又称为low latency(低延迟)收集器，是为解决老年代长暂停(long pause)设计的收集器。  

#### 新生代收集
同parallel

#### 老年代收集
![](/assets/img/collector/cms-old.png)
如名称所示，CMS包含concurrent mark和concurrent sweep两个并发阶段，还有initial mark和remark两个`stop-the-world`阶段
+ initial mark，单线程标记应用代码直接可达的对象
+ concurrent mark，在代码运行的同时，标记间接可达的对象
+ remark，并行标记concurrent mark期间修改的对象，完成最终标记
+ concurrent sweep，CMS在代码运行同时清理垃圾，但是不执行compact，而是使用free-list管理

CMS的老年代收集`并不`在老年代满时触发
+ CMS根据垃圾收集的统计数据`定时`触发老年代收集
+ CMS根据设定的老年代空间占用阈值触发收集
+ 如果老年代确实满了，CMS会回退使用`mark-sweep-compact`的`stop-the-world`算法，这样会更耗时

#### 优缺点
CMS是更适用于服务端的收集器，能带来更低的pause time，但是：
+ 由于没有compact，CMS中申请内存需要在free-list中查找，使得minor GC时间变长，因为minor GC对象进入老年代需要申请内存
+ 没有compact带来了内部碎片，CMS需要按需合并或拆分空闲区域
+ CMS虽然保证标记所有垃圾对象，但是部分垃圾对象在下次收集才会清除，这些对象称为悬浮垃圾(floating garbage)

### G1
G1收集器在1.7引入，1.9作为默认收集器，适用于多核大内存的场景，能够在尽力满足暂停时间目标的情况下保持高吞吐量。

#### 内存布局
![](/assets/img/collector/g1-heap-layout.png)
G1也是分代收集器，和其他收集器的不同点是，G1将内存划为大小相等的区域。
+ 灰色区域表示未分配，不属于哪一代
+ 蓝色区域属于老年代，红色属于新生代
+ 新生代中S表示survivor，其他的表示eden
+ 比较特殊的是H标记(humongous)的老年代区域，由多个区域组合而成，用于放置大对象

大部分对象初始分配在eden，大对象直接分配在H区。

#### 收集循环
![](/assets/img/collector/g1-phrase.png)
G1循环执行young-only和space-reclamation两个阶段。
+ young-only阶段执行若干次minor GC，填充老年代直到达到阈值，此时G1执行concurrent start阶段
  + concurrent start分为三个阶段外加一次minor GC
    + 先执行concurrent marking，标记出在space-reclamation阶段保留的老年代对象，minor GC可以在marking结束前执行
    + remark(stop-the-world)类似于CMS，处理全局引用信息、回收全空的区域
    + remark和cleanup之间还会计算老年代收集用到的信息，和工作线程同时执行
    + cleanup(stop-the-world)确认后续是否执行space-reclamation，是的话会跟一次Prepare mixed minor GC。
+ space-reclamation，如图中粉红点所示，执行多次mixed GC，包含新生代收集，以及部分老生代区域收集，直到G1判断释放的空间抵不上收集的代价，就会重启young-only。
+ full GC，当收集GC信息过程中内存耗尽，G1会执行in place的stop the world full GC。

#### 对象移动
一般对象移动时：
+ 新生代对象根据年龄移动到survivor或老年代
+ 老年代对象移动到新区域中

大对象只会在不可达时被回收，不会移动。

<script defer type="text/tikz" data-tikz-libraries="positioning">
\definecolor{ashgrey}{rgb}{0.7, 0.75, 0.71}
\definecolor{inchworm}{rgb}{0.7, 0.93, 0.36}
\begin{tikzpicture}[
every node/.style={node font=\large\bfseries, line width=1.5pt, minimum size=12mm},
gray node/.style={fill=ashgrey},
worm node/.style={fill=inchworm},
]
\node at (-2,0.5) {young generation};
\foreach \x/\v/\t in {0/E/,1/F/,2/T/} {
  \pgfmathsetmacro{\next}{\x+1};
  \draw[\t] (\x,0) rectangle (\next,1) node[midway] (a\x) {\v};
}

\draw[->] (a0.north) .. controls ([yshift=15pt]a1.north) .. (a2.north);
\draw[->] (a1.south) .. controls ([yshift=-10pt]a1.south east) .. (a2.south);

\node at (-2,-1.5) {old generation};

\foreach \x/\l/\v/\t in {0/1//,1/1//,2/2/H/} {
  \pgfmathsetmacro{\next}{\x+\l};
  \draw[\t] (\x,-2) rectangle (\next,-1) node[midway] (b\x) {\v};
}

\draw[->] (a1) -- (b1);
\draw[->] (b0.north) .. controls ([yshift=5pt]b0.north east) .. ([xshift=-5pt]b1.north);
\end{tikzpicture}
</script>

#### 回收集合
回收集合(Collection set)就是G1选出的需要回收的区域集合
+ young-only时，只有新生代和老年代的大对象区域会被选中
+ space-reclamation时，新生代、大对象区域和部分老年代区域会被选中

Remark阶段，G1会选中低占用率(空闲空间大)的区域。在Cleanup阶段前，会并发收集这些区域的GC信息。  
Cleanup时，根据efficiency(垃圾对象含量)排序，结合`占用率`和`efficiency`两个指标选择回收区域。

#### 大小调节
+ G1可以和其他收集器一样，设置最小和最大堆内存，还可以设置最小和最大空闲比例，以动态调节堆内存
+ 新生代大小可以设置最小和最大比例(新生代和老年代占比)，也可以直接设置最大最小值，G1会根据设置的最大pause time和pause time间隔在范围内调整

#### 老年代回收细节
space-reclamation被分为多个mixed GC，每次都会从回收集合中选择三部分的区域结合来收集
+ minimum set，即最少要回收的区域集合，大小为`回收集合的区域数量/mixed GC的设定次数`，显然设定次数越大，space-reclamation的时间越长
+ 额外集合，当G1预测最少集合执行完还有剩余时间时，会添加额外集合，直到预测到80%的时间会被消耗时停止添加
+ 可选集合，当最少集合和额外集合都清理完，剩余时间会添加可选集合来回收。

<script defer type="text/tikz" data-tikz-libraries="positioning,decorations.pathreplacing">
\definecolor{ashgrey}{rgb}{0.7, 0.75, 0.71}
\definecolor{inchworm}{rgb}{0.7, 0.93, 0.36}
\begin{tikzpicture}[
every node/.style={node font=\large\bfseries, line width=1.5pt, minimum size=12mm},
gray node/.style={fill=ashgrey},
worm node/.style={fill=inchworm},
]
\node at (-2,0.5) {old generation};
\foreach \x/\l/\v/\t in {0/6/min set/,6/2/addt set/,8/2/opt set/} {
  \pgfmathsetmacro{\next}{\x+\l};
  \draw[\t] (\x,0) rectangle (\next,1) node[midway] (a\x) {\v};
}

\draw [decorate, decoration = {brace}, thick] (0,1.2) --  (8,1.2) node[pos=0.5, anchor=south] {80\%};

\end{tikzpicture}
</script>

#### 标记
G1的标记算法称为Snapshot-At-The-Beginning，望文生义，保存堆的所有可达对象的镜像，在后续收集中不会清除。  
由于对象在收集过程中可能变为垃圾，这些对象只能在后一轮收集中被清除。

#### 大对象
大对象就是大小不小于区域的一半的对象，区域大小可以手动设置。
+ 大对象会分配在老年代的连续区域中，左对齐区域头部，尾部剩余空间不会再分配
+ 大对象一般只在cleanup阶段或full GC时被回收。原始类型数组的大对象除外，会在每种GC时被回收。
+ 大对象分配会导致超过老年代回收阈值，触发concurrent-start。
+ 大对象永远不会被移动，过多的大对象会导致内部碎片增多，严重时会引发full GC或内存不足。

### ZGC
ZGC是可伸缩的低延迟收集器。为了达到低延迟，ZGC将耗时的GC操作和工作线程同时执行，当然同时会降低吞吐量。  
ZGC适用于追求低延迟的场景。pause time和内存大小无关，ZGC支持8MB到16TB内存。  
由于ZGC不是服务端场景的重点，我们只介绍几个重要的调优点
+ ZGC必须设置最大堆内存，因为类似CMS，concurrent收集过程中，工作线程还会申请新内存，需要保证有足够空闲空间
+ GC线程数量需要设置适中，过大会占用太多吞吐量，过小收集速度太慢，会增大暂停时间

### 测试
我们来简单测试一下，对象gc前后地址变化，测试类在`ObjectAddressTest`
+ 用`jol-core`包获取对象地址(虚拟地址)
+ 通过`System.gc()`手动触发GC

### 对比
吞吐量和暂停时间是衡量收集器的两个重要指标
+ serial收集器适用于客户端小内存，对吞吐量和暂停时间要求不高的场景
+ parallel收集器为高吞吐量设计，适用于多核场景
+ CMS和G1都是适用于服务端多核大内存的应用，1.7及之后的版本推荐使用G1
  + G1粒度更细，每次清理部分老年代空间，而CMS是清理整个空间(老年代和永久代)
  + G1的算法复杂度和对区域的管理会引入更多的CPU占用和内存消耗，压缩了吞吐量
+ ZGC为极致的暂停时间设计，进一步占用了吞吐量