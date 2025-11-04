---
title:  "microps启航篇"
date: 2025-11-04 22:55:00 +0800
permalink: /microps-remade/start-up
categories: [TCP/IP, C, network]
---

[microps](https://github.com/pandax381/microps)是一个非常适合新手学习的TCP/IP协议栈，使用C+Make开发，搭配一套非常详细的ppt教程，让我们能渐进式地彻底了解TCP/IP协议栈。  
本文记录和梳理第一章ppt中的重点内容

## 架构
![design.PNG](../assets/img/microps/design.PNG)

如上图所示，microps并不是内核态中的协议栈，而是用户态中的协议栈，通过虚拟设备完成数据的收发。
