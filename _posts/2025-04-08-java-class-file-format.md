---
title:  "JVM类文件格式"
date: 2025-04-05 19:45:00 +0800
permalink: /jvm-in-depth/class-file-format
categories: jvm class-file
---

要深入了解jvm类和对象的加载、内存分配，前提就是清楚java中的类文件的结构是怎样的。  
类文件本身只是一个二进制文件，我们通过插件解析就行理清它的结构。

## 环境准备
+ 克隆项目`https://github.com/cafewang/playground.git`
+ 打开`jvm-in-depth`模块，相关类都在模块下
+ 使用gradle build构建模块
+ 安装`jclasslib`插件，点击`View->Show Bytecode with jclasslib`查看类文件

## 整体结构
首先看一下用到的类

```java
public class Animal {
    protected String name;

    public void run() {
        System.out.println("running");
    }
}

public interface SuperInterface {
    int doSomething(int param1);
}

public class Dog extends Animal implements  SuperInterface {
    private static final int LEGS = 4;
    private Dog[] kids;
    private String name = "Brian";

    public Dog() {
    }

    @Override
    public int doSomething(int param1) {
        return 100;
    }

    public void bark() {
        System.out.println("dog barking");
    }
}
```
只有3个类，Dog类继承了Animal类，实现了SuperInterface接口，有自己的方法和字段。  
下图就是类文件的整体结构，其中最重要的就是常量池(constant pool)，下面将详细展开。  
![](/assets/img/class-file-format/overview.png)

先看一般信息  
![](/assets/img/class-file-format/info.png)  
统计了类的基本信息。

## 常量池
常量池存储了类用到的各种常量数据，让我们分类展示一下。

### 数值常量
很简单，就是代码或者初始化用到的数值字面量，Dog类中包含
+ 静态常量LEGS的初始值 4

注意doSomething方法中的常量 100不在其中，而是直接保存在代码里。  

![](/assets/img/class-file-format/constant_int.png)
### 字符串常量
![](/assets/img/class-file-format/constant_string.png)
代码和初始值中的字符串常量都会保存在常量池中(注意，这里是文件常量池，而不是运行中常量池)
+ bark中的常量"dog barking"
+ 字段name的初始值"Brian"

字符串在运行时jvm的存储我们会单独讲，敬请期待。

### 类常量
![](/assets/img/class-file-format/constant_class.png)
所有涉及的类都会保存在常量中，分为以下几类，都会保存全限定类名
+ 自身的类名(全限定名)，这里就是`org.wangyang.Dog`
+ 直接继承的类`Animal`和实现的接口`SuperInterface`
+ 字段的类，这里有Dog和String
  + Dog类已经生成过
  + String类比较特殊，没有生成类常量
+ 代码中局部变量的类
+ 代码中引用的类，这里有`java.lang.System`和`java/io/PrintStream`，后者是静态变量out的类型

### 字段引用
![](/assets/img/class-file-format/constant_field_ref.png)
字段引用就是字节码中引用到的字段，包括类自身的和其他类的
+ 初始化方法init中给字段name赋值，所以有name的引用
+ bark方法中引用了静态变量out

### 方法引用
![](/assets/img/class-file-format/constant_method_ref.png)
同理，方法引用就是字节码中引用的方法，也包括自身的方法、超类中的方法、其他类的方法
+ 初始化方法init中隐式调用了超类Animal的构造方法
+ bark方法中调用了println方法

### 名称和类型
![](/assets/img/class-file-format/constant_name_and_type.png)
上述两种引用的名称和类型信息，所以共四个，字段则是字段描述符，方法就是方法签名
+ out字段描述符为`Ljava/io/PrintStream;`
+ println方法签名为`(Ljava/lang/String;)V`，括号中为参数，V表示返回值是void

### UTF8
![](/assets/img/class-file-format/constant_utf8.png)
所有字符串类型最底层的存储结构，包括上面说的字符串常量也是引用了UTF8常量，还有类名、字段名、方法签名等等

## 接口
![](/assets/img/class-file-format/interface.png)
这部分很简单，直接实现了几个接口，就有几项，每项引用对应的类常量。

## 字段
![](/assets/img/class-file-format/field.png)
记录了类中声明的字段，包括静态的，有默认值的话也会引用，注意，不会包含超类或接口中的字段

## 方法
![](/assets/img/class-file-format/method.png)
这部分也非常重要，记录了类中声明的静态和成员方法，不包括超类或接口中的方法  
![](/assets/img/class-file-format/method_info.png)  
+ 包含字节码，也就是方法体
+ 包含MAX_LOCALS和MAX_STACK，表示方法的最大局部变量数 和 最大操作数栈深度

## 属性
这部分是类中非核心的一些属性，主要保存一些用于Debug或者特定用途的数据。

## 总结
本章展示了java类的文件结构，当然这里忽略了一些更复杂的结构，比如内部类、method handle等，但是足够给我们一个java类格式比较完整的印象。  
以此为基础，我们可以继续讨论jvm的启动、类和对象的加载、jvm的内存管理等等问题，敬请期待！
