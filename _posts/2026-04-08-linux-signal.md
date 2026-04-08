---
title:  "Linux信号机制"
date: 2026-04-08 20:55:00 +0800
permalink: /linux-intro/signal
categories: [linux, signal]
---

信号（Signal）是 Linux 系统中最古老、最基础的进程间通信机制之一，也是理解 Unix/Linux 系统编程的核心概念。作为一种异步通知机制，信号允许内核或一个进程向另一个进程发送简短的通知，告知其某个特定事件的发生——无论是用户按下 Ctrl+C 中断程序，还是子进程终止通知父进程，亦或是定时器到期提醒应用程序。

掌握信号机制对于深入理解 Linux 系统至关重要：它不仅是进程管理和控制的基础，更是编写健壮、可靠的系统级程序的必备知识。本文将带你从零开始，系统地探索 Linux 信号的方方面面。

## 信号触发
首先，信号分为两类
+ standard signal，较早实现的传统信号，范围是1~31，通常有默认的处理机制，如关闭程序、忽略信号。
+ real-time signal，实时信号是后来扩展的信号类型，范围与系统实现有关，宏定义是`SIGRTMIN`到`SIGRTMAX`，默认处理机制是关闭程序。

触发信号的方式有很多种，我们列举如下几种常用的方式

### 进程给自己发送信号

<iframe
frameBorder="0"
height="300px"
scrolling="no"
src="https://onecompiler.com/embed/c/44jrszjej?hideLanguageSelection=true&hideNew=true&hideNewFileOption=true&disableCopyPaste=true&disableAutoComplete=true&hideStdin=true&hideEditorOptions=true"
width="100%">
</iframe>

我们使用`raise`发送了SIGKILL信号给当前进程，程序会直接退出，所以只打印了`before SIGKILL`
### 给其他进程发送信号
<iframe
frameBorder="0"
height="300px"
scrolling="no"
src="https://onecompiler.com/embed/c/44jrtufs4?hideLanguageSelection=true&hideNew=true&hideNewFileOption=true&disableCopyPaste=true&disableAutoComplete=true&hideStdin=true&hideEditorOptions=true"
width="100%">
</iframe>

使用`kill`指定PID发送信号，还可以发送给所有有权限发信号的进程，也可以发送给进程组，后两种情况请参考手册

### 给线程发送信号

<iframe
frameBorder="0"
height="750px"
scrolling="no"
src="https://onecompiler.com/embed/c/44jrudkze?hideLanguageSelection=true&hideNew=true&hideNewFileOption=true&disableCopyPaste=true&disableAutoComplete=true&hideStdin=true&hideEditorOptions=true"
width="100%">
</iframe>

线程的信号处理方式与进程的信号处理方式类似，使用`pthread_kill`发送信号给当前进程中的线程，使得子线程被关闭，代码的主要流程为
1. 主线程注册了信号处理函数，被子线程继承
2. 子线程使用`pause`阻塞等待信号到达
3. 主线程发送信号给子线程，然后使用`pthread_join`等待子线程结束

### 信号携带数据
<iframe
frameBorder="0"
height="850px"
scrolling="no"
src="https://onecompiler.com/embed/c/44jrvwn5z?hideLanguageSelection=true&hideNew=true&hideNewFileOption=true&disableCopyPaste=true&disableAutoComplete=true&hideStdin=true&hideEditorOptions=true"
width="100%">
</iframe>

**代码说明**：
2. 使用 `sigaction()` 注册信号处理函数，设置 `SA_SIGINFO` 标志以启用扩展信息
2. 信号处理函数签名为 `void handler(int sig, siginfo_t *info, void *context)`，其中 `info->si_value` 包含发送的数据
3. 主进程通过 `sigqueue()` 发送两个不同的整数值给子进程
4. 子进程接收到信号后，从 `siginfo_t` 结构中提取数据并打印

需要注意的是，仅实时信号支持携带数据，标准信号不支持，而且携带的数据可以是整数，还可以是指针，指向信号处理函数能访问到的数据

## 信号阻塞和队列


## 信号处理


