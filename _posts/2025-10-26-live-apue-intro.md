---
title:  "LiveAPUE入门篇"
date: 2025-10-26 13:55:00 +0800
permalink: /live-apue/intro
categories: [APUE, intro, linux]
---

APUE(Advanced Programming in the UNIX Environment)，即UNIX环境高级编程，由Richard Stevens和Stephen A Rigo合著，
是一本优秀的unix/linux系统编程书籍。  
而本系列叫做Live APUE，是通过博客提供交互式的学习体验，呈现原著可运行的部分。  
声明，本系列博文:
+ 基于APUE第三版
+ 通过在线编译器运行书中的代码
+ 通过图文讲解书中部分重要的概念  

本系列博文不会:
+ 全篇翻译书中的内容

# Unix系统概览
## basic ls
如下代码块会打印根目录下的全部文件(及目录)，`apue.h`和`apue.c`中引用了常用的系统库、定义了错误记录和日志记录函数，在后续每个示例中都会使用。

<iframe
  frameBorder="0"
  height="350px"
  src="https://onecompiler.com/embed/c/442s2ysw8?hideLanguageSelection=true&hideNew=true&hideNewFileOption=true&disableCopyPaste=true&disableAutoComplete=true&hideStdin=true&hideEditorOptions=true"
  width="100%">
</iframe>

可以看到输出中打印了根目录下的所有文件及目录，试试将`path`改成不存在的目录，看看会输出什么。

## copy
如下片段实现将`stdio`输出到`stdout`

<iframe
  frameBorder="0"
  height="350px"
  src="https://onecompiler.com/embed/c/442sm6u95?hideLanguageSelection=true&hideNew=true&hideNewFileOption=true&disableCopyPaste=true&disableAutoComplete=true&hideStdin=false&hideEditorOptions=true"
  width="100%" >
</iframe>

可以试试修改stdin中的内容并运行。  
上方片段使用的是`read`和`write`函数，需要自己管理缓冲区，而使用`getc`和`putc`则不需要，由系统管理。

<iframe
  frameBorder="0"
  height="320px"
  src="https://onecompiler.com/embed/c/442sqenw5?hideLanguageSelection=true&hideNew=true&hideNewFileOption=true&disableCopyPaste=true&disableAutoComplete=true&hideStdin=false&hideEditorOptions=true"
  width="100%">
</iframe>

## 进程
如下程序会打印进程id，每次运行输出的进程id会不同。

<iframe
frameBorder="0"
height="200px"
src="https://onecompiler.com/embed/c/442ss6skn?hideLanguageSelection=true&hideNew=true&hideNewFileOption=true&disableCopyPaste=true&disableAutoComplete=true&hideStdin=true&hideEditorOptions=true"
width="100%">
</iframe>