---
title:  "JVM启动流程"
date: 2025-04-05 19:45:00 +0800
permalink: /jvm-in-depth/jvm-start-up
categories: jvm
---

简单来说，jvm的启动始于执行main方法，并在执行过程中触发入口类和相关类的加载、链接、初始化，最终所有非守护线程执行完毕，jvm关闭。  
本文将详细讲解其中重要的步骤，我们一起往下看。

### 加载(loading)
类加载就是类A的方法在运行时，字节码中有类B的符号引用（简单来说就是类名，和直接引用，就是内存中的地址区别开），  
发现类B还没有加载，于是从文件系统(或者网络、甚至直接生成)中找到B的类文件，加载到方法区中并生成类对象的过程。  

#### 谁来加载
ClassLoader承担了加载的职责，首先介绍一下类加载委派机制(class-loading delegate mechanism)。  
java系统中的ClassLoader构成一个层级，不同层级的类负责不同类型、不同路径类的加载，下层的类加载时会先委托给上层的类，无法加载时才会回退到用下层类加载。  

java9之前，是如下的结构

| **加载器**               | **加载路径**  | **类型**                    |
|:---------------------:|:---------:|:-------------------------:|
| BootStrap ClassLoader | rt.jar    | java系统最核心的类，如java.lang包下的 |
| Extension ClassLoader | lib/ext   | java维护的非核心类               |
| App ClassLoader       | classpath | 非系统编写的应用类                 |

由于java9加入模块(jigsaw)的概念，类加载器层级也有变化

| **加载器**               | **类型**                  |
|:---------------------:|:-----------------------:|
| BootStrap ClassLoader | 定义核心Java SE和JDK模块。      |
| Platform ClassLoader  | 定义部分Java SE和JDK模块       |
| App ClassLoader       | 定义CLASSPATH上的类和模块路径中的模块 |

BootStrap ClassLoader完全由jvm实现，在java层不可见。  
App ClassLoader调用`loadClass(String className, boolean resolve)`来加载，简化实现如下

```java
    protected Class<?> loadClassOrNull(String cn, boolean resolve) {
        synchronized (getClassLoadingLock(cn)) {
            // check if already loaded
            Class<?> c = findLoadedClass(cn);
    
            if (c == null) {
                // check parent
                if (parent != null) {
                    c = parent.loadClassOrNull(cn);
                }

                // check class path
                if (c == null && hasClassPath()) {
                    c = findClassOnClassPathOrNull(cn);
                }
            }
    
            if (resolve && c != null)
                resolveClass(c);
    
            return c;
        }
    }
```
+ 首先加锁防止并发加载，每个类名一个锁
+ parent不为空先委托给它来加载
+ 为空的话在classpath中搜索类文件加载，找不到抛出`ClassNotFoundException`
+ 如果有resolve标识，进行链接，这个名字有误导


#### 触发条件
前面说过，类A在运行期间用到类B的符号引用时，会触发类B的加载，另外一种情况就是反射调用B的方法。  
类A触发了类B的加载，则由创建类A的ClassLoader发起类B的加载(不一定直接创建，可能委托给上层加载器)，  
数组类是个例外，直接由bootstrap classloader创建，但是需要用到类A的ClassLoader。

#### 具体流程
有了类加载器和类文件，后续的加载流程如下
+ 检查是否已加载，未加载则继续
+ 解析类文件，检查格式、版本号、类名是否合法，否则报错
+ 解析直接接口
+ 解析超类（解析过程见后续内容）
+ 执行完毕，jvm将ClassLoader记为类对象的加载器，可通过`getClassLoader()`方法获取

可以看到，类加载是一个递归的过程，中间会触发其他类的加载和链接(解析为链接的最后一步)

#### 类对象
补充一下，类对象的唯一标识不只是它的类名，还有它的类加载器，两者一起组成类的唯一标识。

#### 测试
测试在`https://github.com/cafewang/playground` 项目的`jvm-in-depth`模块，可以克隆下来用Idea打开。  
我们在AppClassLoader的loadClass方法处打断点，查看如下类触发类加载的顺序。

```java
public class SuperClass {}

public interface SuperInterface0 {}

public interface SuperInterface1 {}

public class InitialClass extends SuperClass implements SuperInterface0, SuperInterface1 {
    public static void main(String[] args) {
    }
}
```
测试类为`JVMStartUpTest`的`test_load`方法，可以看到加载顺序为
+ 启动类InitialClass
+ 直接接口SuperInterface0
+ Object
+ 直接接口SuperInterface1
+ 超类SuperClass

用树表示就是一个dfs的过程

<script defer type="text/tikz">
\begin{tikzpicture}[
level 1/.style = {sibling distance= 120pt},
level/.style={level distance=70pt, sibling distance=70pt},
every node/.style={rectangle, draw, node font=\large\bfseries, line width=1.5pt, minimum size=12mm},
]
\node {InitialClass} [line width=1pt]
    child { node {SuperInterface0}
        child { node {java.lang.Object}}
    }  
    child { node {SuperInterface1} }
    child { node {SuperClass} }
;
\end{tikzpicture}
</script>

### 链接(linking)
链接分为三步，验证和准备是必须的，而解析是可选的，因为jvm规范如下
+ 类或者接口在链接之前必须完全加载
+ 类或接口在初始化之前必须完全验证和准备

#### 验证(verifying)
验证阶段主要确认加载的类或接口的结构是正确的，包含字节码指令、类型检查、类型推断等的校验。  
这部分比较硬核不做展开。

#### 准备(preparing)
准备阶段就是为类或接口创建`静态变量和常量`(申请空间)并清空，数值类型会清空成0，引用类型会成`null`，这里不涉及初始化，它将在之后执行。

#### 解析(resolving)
解析就是将类中引用的其他类或接口及其字段、方法的`符号引用`替换成`直接引用`的过程
前面提到过，类加载时，会主动解析直接接口和直接超类（当然先会加载、验证、准备），但是代码中引用的类、接口、字段和方法都不会立即解析，而是在运行到这段字节码时才会解析

##### 类和接口
如果类A中的符号引用是类B或接口B，解析过程如下
+ 使用类A的类加载器来加载类B或接口B
+ 检查类A是否有类B或接口B的`访问权限`

##### 字段
解析字段前必须先解析所属的类，然后执行字段查找
+ 先在当前类中找字段定义
+ 在直接接口中查找字段定义，递归执行
+ 在直接超类中查找字段定义，递归执行
+ 找到字段定义，检查是否有访问权限

##### 方法
方法解析前也必须先解析所属的类，具体过程比较复杂，不做展开。

### 初始化(initializing)
初始化就是执行类或接口的初始化方法的过程。

#### 触发
常见的类初始化时机有
+ 类对象的创建
+ 静态方法的执行
+ 静态变量的引用(读取静态常量除外)
+ 反射调用方法
+ 类的初始化会触发超类和有default方法的超接口的初始化，超类和超接口的初始化先执行

如下几种特殊情况需要注意
+ 接口的初始化并不会触发其超接口的初始化
+ 静态变量的引用只会触发所在类的初始化，通过子类、子接口的引用并不会触发它们的初始化

测试类`JVMStartUpTest`中验证了这几种场景
+ `test_super_class_init_first`方法验证了，超类的初始化在子类之前
+ `test_super_interface_init_not_triggered_by_interface_init`方法验证了，接口初始化触发超接口的初始化
+ `test_static_field_reference_only_init_declaring_class`验证了，字段的引用只会初始化声明它的类或接口，而不会初始化引用它的子类或子接口

#### 具体流程
由于jvm是多线程的，类的初始化需要加锁以避免出错，大体流程如下
+ 每个类都有专属的锁
+ 类的初始化分为四个状态：未开始、进行中、已完成、异常
+ 加载类的线程首先获取到锁，然后查询状态
  + 进行中，且是由当前线程执行的初始化，说明是递归调用，释放锁并退出即可
  + 进行中，且是其他线程在执行初始化，需wait初始化线程执行完之后notify当前线程
  + 已完成，释放锁并退出
  + 异常，释放锁并抛出异常
  + 未开始，将状态改为进行中，然后释放锁，执行如下步骤
    + 初始化静态常量
    + 初始化超类和超接口
    + 执行静态变量和静态块的初始化
    + 获取锁，将状态改为已完成，唤醒等待线程，然后释放锁并退出
    + 中途发生异常，则获取锁，将状态设置为异常，唤醒等待线程，释放锁并退出

### 对象创建
除了显示使用`new`创建对象，如下操作也会触发对象创建
+ 类或接口的加载中引入的String字面量，会创建新的String对象来表示，除非已经intern过
+ 封包操作也会创建新对象，除非对象在缓冲池中
+ 非常量的字符串拼接会创建String对象
+ lambda表达式的执行会创建对应实例。

构造函数的执行也不是和代码所写的完全相同，过程如下
+ 首先为参数赋值
+ 如果第一行是本类的其他构造函数，在其他构造函数中递归执行本过程
+ 如果第一行不是本类的其他构造函数，显示或隐式执行super()，也是递归执行本过程
+ 执行完其他构造函数或super()后，执行成员变量初始化和初始化块
+ 执行剩余代码

#### 测试
```java
class SuperClassOfInstanceInit {
    public SuperClassOfInstanceInit() {
        System.out.println("super class instance created");
    }
}

public class InstanceInit extends SuperClassOfInstanceInit {
    {
        System.out.println("instance created");
    }
    
    public InstanceInit() {
        System.out.println("executed last");
    }
}
```
测试方法为`test_class_instance_create_order`, 打印结果为
```text
super class instance created
instance created
executed last
```