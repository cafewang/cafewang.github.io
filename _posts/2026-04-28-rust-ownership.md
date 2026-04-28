---
title:  "RustLiveExample-所有权"
date: 2026-04-28 22:55:00 +0800
layout: comment_n_toc
permalink: /rust-live-example/ownership-explained
categories: [rust, ownership]
---

所有权是Rust语言的核心概念，也是Rust语言的难点，正确理解所有权，是读懂和写好Rust代码的必要条件。  
文章主要参考了`Programming Rust`一书，需要更细致地解读请参考该书。

## 无所不在的所有权
所有权，简单来说，就是同一个值(在堆或栈中)赋值给多个变量，这些变量会如何处理这个值。  
以一段C代码来举例

<script src="https://gist.github.com/cafewang/6ff4386626d5bba5097f5466d38ab5df.js"></script>
<iframe
frameBorder="0"
height="350px"
scrolling="no"
src="https://onecompiler.com/embed/c/44mq8gcx7?hideLanguageSelection=true&hideNew=true&hideNewFileOption=true&disableCopyPaste=true&disableAutoComplete=true&hideStdin=true&hideEditorOptions=true"
width="100%">
</iframe>

## Move

## Copy

## Reference Counter




