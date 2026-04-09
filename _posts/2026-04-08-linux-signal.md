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
height="980px"
scrolling="no"
src="https://onecompiler.com/embed/c/44jrvwn5z?hideLanguageSelection=true&hideNew=true&hideNewFileOption=true&disableCopyPaste=true&disableAutoComplete=true&hideStdin=true&hideEditorOptions=true"
width="100%">
</iframe>

**代码说明**：
2. 使用 `sigaction()` 注册信号处理函数，设置 `SA_SIGINFO` 标志以启用扩展信息
2. 信号处理函数签名为 `void handler(int sig, siginfo_t *info, void *context)`，其中 `info->si_value` 包含发送的数据
3. 主进程通过 `sigqueue()` 发送两次信号`SIGRTMIN`给子进程，注意，只有实时信号可以携带数据
4. 子进程接收到信号后，从 `siginfo_t` 结构中提取数据并打印，第一次打印数字，第二次打印传递的指针数据

## 信号阻塞和队列
同种信号多次发送时，我们看一看两类信号的表现

<iframe
frameBorder="0"
height="500px"
scrolling="no"
src="https://onecompiler.com/embed/c/44jumtr9s?hideLanguageSelection=true&hideNew=true&hideNewFileOption=true&disableCopyPaste=true&disableAutoComplete=true&hideStdin=true&hideEditorOptions=true"
width="100%">
</iframe>

可以看到，两类信号都会按顺序被处理  
为了屏蔽或延迟信号的处理，我们可以使用`sigprocmask`或`pthread_sigmask`来阻塞信号

<iframe
frameBorder="0"
height="450px"
scrolling="no"
src="https://onecompiler.com/embed/c/44jung893?hideLanguageSelection=true&hideNew=true&hideNewFileOption=true&disableCopyPaste=true&disableAutoComplete=true&hideStdin=true&hideEditorOptions=true"
width="100%">
</iframe>

**代码说明**：
1. sigset_t是存储阻塞信号集合的结构，可以理解为一个bitmap，每位代表一种信号，通过`sigemptyset`、`sigaddset`等方法来操作
2. `sigprocmask`可以设置当前进程的阻塞信号集合，`SIG_BLOCK`表示在原有阻塞信号中加入新的信号，`SIG_UNBLOCK`表示解除阻塞，`SIG_SETMASK`表示设置新的阻塞信号集合
3. 可以看到，`SIGUSR1`在解除阻塞后才开始执行

如果多个同种信号在阻塞过程中被发送，那么信号会被怎样处理呢？

<iframe
frameBorder="0"
height="800px"
scrolling="no"
src="https://onecompiler.com/embed/c/44juq4nbe?hideLanguageSelection=true&hideNew=true&hideNewFileOption=true&disableCopyPaste=true&disableAutoComplete=true&hideStdin=true&hideEditorOptions=true"
width="100%">
</iframe>

标准信号在阻塞期间多次接收，只会保留最后一个信号，所以只处理了一次  
而实时信号会按照顺序处理，所以会打印3次  
如果两种信号同时解除阻塞，谁会优先执行呢？根据man手册，我们得到如下解释
1. 如果两类信号同时发送，Linux系统中一般优先处理标准信号
2. 如果多种标准信号同时发送，处理顺序标准中没有指定
3. 如果多种实时信号同时发送，处理顺序是按照数字小的优先级高

在多线程中，子线程会继承父线程的sigmask，发送给进程的信号会选择任意一个没有阻塞信号的线程。  
通常，我们使用如下方式在多线程中处理信号

<iframe
frameBorder="0"
height="1200px"
scrolling="no"
src="https://onecompiler.com/embed/c/44jusa4jq?hideLanguageSelection=true&hideNew=true&hideNewFileOption=true&disableCopyPaste=true&disableAutoComplete=true&hideStdin=true&hideEditorOptions=true"
width="100%">
</iframe>

**代码说明**：
1. **主线程设置信号掩码**：在创建子线程前，使用 `pthread_sigmask()` 阻塞 `SIGUSR1` 和 `SIGUSR2`，这样子线程会继承这个阻塞状态
2. **pthread_barrier**：用来同步主子线程，确保子线程启动后才发送信号，避免信号丢失
2. **专用信号处理线程**：`signal_handler_thread` 函数使用 `sigwait()` 同步等待信号，这是一种线程安全的信号处理方式
4. **信号发送**：主线程使用 `kill()` 向整个进程发送信号，由于只有信号处理线程未阻塞这些信号，所以由它来接收和处理
5. **sigwait() 的优势**：相比异步信号处理函数，`sigwait()` 是同步的，可以在普通代码中安全调用，避免了信号处理函数的诸多限制（如不能调用非异步信号安全的函数）

## 信号处理


