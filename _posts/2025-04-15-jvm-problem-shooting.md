---
title:  "JVM问题排查"
date: 2025-04-15 16:39:00 +0800
permalink: /jvm-in-depth/jvm-trouble-shooting
categories: jvm trouble-shooting
---

jvm相关的问题通常是很难遇到的，因此积累排查问题的经验并不容易，但是我们可以借鉴他人的排查案例，来总结排查的流程和方法。

## 问题分类
首先是最关键的一点，问题究竟是不是和jvm有关？和jvm相关的问题一般有如下几个特征
+ gc变得频繁，导致吞吐量变小
+ 单次gc时间变长，容易引发接口超时
+ 新生代或老年代(或永久代、元空间)占有率异常，比之前要大，从而引发gc
+ 栈空间不足，通常引发stack overflow
+ 堆外空间申请过多，也会触发oom

总结起来，就是空间不足(可能是代码bug导致使用了过量对象)或者空间分配不合理(比如新生代和老年代、eden和survivor)。  
如果问题没有显现类似特征，我们有理由相信是问题是其他原因引发的。

## OOM类型
+ 堆内存不足，`java.lang.OutOfMemoryError: Java heap space`
+ 1.7及之前，永久代不足，`java.lang.OutOfMemoryError: PermGen space`
+ 1.8及之后，元空间不足，`java.lang.OutOfMemoryError: Metaspace`
+ 栈空间不足，`java.lang.StackOverflowError`
+ 直接内存不足，`java.lang.OutOfMemoryError: Direct buffer memory`

## 常见场景
### 查询大对象
大对象经常是引发频繁GC的元凶，在CMS和G1中，过多的大对象容易引发内部碎片，导致oom。  
这里我们设置一个场景，设定最大堆内存为500MB，循环申请32MB数组(不释放)，显然循环到第16次时，会发生oom。  
代码见测试类`ObjectAddressTest`的`test_big_object`方法。  
对应到服务端，就会出现服务宕机的情况，排查过程如下

+ 首先查看监控上的gc频率、暂停时间、各个分代大小，可以看到老年代占用率过高(大对象在G1中直接分配到老年代)
+ 在k8s上配置vm options
```text
-XX:+HeapDumpOnOutOfMemoryError // 导出堆快照
-XX:HeapDumpPath=<file-path> // 导出路径
-Xlog:gc* (针对JVM 9及以上，打印详细gc信息)
-XX:+PrintGCDetails -Xloggc:<file-path> (针对JVM 8及以下)
```
+ 分析日志，G1日志显示的是清理前后已使用的区域个数，以eden举例，清理前是3个，清理了3个，可以看到大对象区域占用最多
```text
[0.144s][info][gc,heap      ] GC(0) Eden regions: 3->0(124)
[0.144s][info][gc,heap      ] GC(0) Survivor regions: 0->1(3)
[0.144s][info][gc,heap      ] GC(0) Old regions: 0->0
[0.144s][info][gc,heap      ] GC(0) Humongous regions: 99->99
[0.144s][info][gc,metaspace ] GC(0) Metaspace: 4788K(5120K)->4788K(5120K) NonClass: 4394K(4608K)->4394K(4608K) Class: 393K(512K)->393K(512K)
```
+ 下载mat解析堆快照，注意版本不超过1.11(支持jdk8)
+ 编辑文件 MemoryAnalyzer.ini 添加 -vmargs – Xmx4g，保证能解析几个G的堆快照
+ 由于程序比较简单，可以看到占用内存最大的就是我们申请的byte[]，真实程序的分析更加复杂，需要结合不同分代的占用率和代码变更来看
  ![](/assets/img/gc/mat-histogram.png)

原因：最常见的原因是数据库查询时未加`limit`限制 

### 缓存未释放
业务中常用的本地缓存如guava，一般是通过静态Map实现的，如果不设置上限，内存占用率会一直累积。  
首先会逐步填满新生代，导致频繁的minor GC，之后填满老年代，引发full GC。  
我们用静态Map不断插入新对象来，设置最大堆内存200MB，见方法`test_static_map`。  
从GC日志可以看到，每次minor GC都会使老年代占用率变高，然后逐渐引发full GC。

```text
[0.131s][info][gc,start     ] GC(0) Pause Young (Normal) (G1 Evacuation Pause)
[0.139s][info][gc,heap      ] GC(0) Eden regions: 24->0(13)
[0.139s][info][gc,heap      ] GC(0) Survivor regions: 0->3(3)
[0.139s][info][gc,heap      ] GC(0) Old regions: 0->20
[0.139s][info][gc,heap      ] GC(0) Humongous regions: 0->0
[0.139s][info][gc,metaspace ] GC(0) Metaspace: 3690K(4864K)->3690K(4864K) NonClass: 3374K(4352K)->3374K(4352K) Class: 316K(512K)->316K(512K)
[0.139s][info][gc           ] GC(0) Pause Young (Normal) (G1 Evacuation Pause) 24M->22M(200M) 7.537ms

[0.165s][info][gc,start     ] GC(3) Pause Young (Normal) (G1 Evacuation Pause)
[0.171s][info][gc,heap      ] GC(3) Eden regions: 25->0(25)
[0.171s][info][gc,heap      ] GC(3) Survivor regions: 4->4(4)
[0.171s][info][gc,heap      ] GC(3) Old regions: 59->85
[0.171s][info][gc,heap      ] GC(3) Humongous regions: 0->0
[0.171s][info][gc,metaspace ] GC(3) Metaspace: 3690K(4864K)->3690K(4864K) NonClass: 3374K(4352K)->3374K(4352K) Class: 316K(512K)->316K(512K)
[0.171s][info][gc           ] GC(3) Pause Young (Normal) (G1 Evacuation Pause) 88M->88M(200M) 6.339ms

[0.354s][info][gc,start       ] GC(45) Pause Full (G1 Evacuation Pause)
[0.359s][info][gc,heap        ] GC(45) Eden regions: 0->0(10)
[0.359s][info][gc,heap        ] GC(45) Survivor regions: 0->0(2)
[0.359s][info][gc,heap        ] GC(45) Old regions: 200->200
[0.359s][info][gc,heap        ] GC(45) Humongous regions: 0->0
[0.359s][info][gc,metaspace   ] GC(45) Metaspace: 3693K(4864K)->3693K(4864K) NonClass: 3376K(4352K)->3376K(4352K) Class: 316K(512K)->316K(512K)
[0.359s][info][gc             ] GC(45) Pause Full (G1 Evacuation Pause) 198M->198M(200M) 4.601ms
```
`pause young`即minor GC，可以看到old regions在变大，`pause full`即full GC，可以看到old regions已经满了(这里每个region是1MB)。

### 直接内存未释放
java生态中一般用到直接内存的地方有NIO和netty，如果申请超过上限`MaxDirectMemorySize`也会报oom，提示是`Direct buffer memory`，所以这种问题相对好定位。  
测试方法为`test_direct_buffer`，通过ByteBuffer申请直接内存直到报错。  
直接内存不足导致的宕机并不会留下堆快照。