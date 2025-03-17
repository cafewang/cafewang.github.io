---
title:  "算法漫谈-数学计算"
date: 2025-02-17 12:50:00 +0800
categories: algorithm math-calculation 算法 数学计算
---

程序语言的标准库中都有大量的数学运算相关的函数，本章我们就来实现一些基本的数学运算。

## 整数乘法
使用补码形式的二进制乘法，以四位二进制表示(-2 * 3)

$$
\begin{array}{cc:cccc}
  & & 1 & 1 & 1 & 0 \\
+ & 1 & 1 & 1 & 0 &  \\
  \hline
 1 & 0 & 1 & 0 & 1 & 0 \\
\end{array}
$$

如上图，和普通乘法没有区别，就是将-2和3最低位和第二位的一相乘后相加，结果为-6（忽略超过四位的部分）。  
可见二进制补码乘法也能正确反映符号（没有溢出的情况下）。

```java
// https://leetcode.cn/problems/recursive-mulitply-lcci/submissions/611566492
    public int multiply(int A, int B) {
        int sum = 0;
        int pow = 0;
        while (pow != 32) {
            if ((A & (1 << pow)) != 0) {
                sum += B;
            }
            B = B + B;
            pow += 1;
        }
        return sum;
    }
```

时间复杂度为$$O(n)$$，n为数字的二进制长度。

## 整数除法
以`15/2`举例  
+ 先将除数y不断倍增，直到刚好不大于被除数x，也就是`2、4、6、8`，变到8，记录变大的倍数m=4
+ 再将除数不断减半，倍数也同时减半，如果被除数大于除数，则减去除数，结果r加上倍数

|  x | y | m |       r       |
|:--:|:-:|:-:|:-------------:|
| 15 | 8 | 4 | 0 + 4(15 > 8) |
|  7 | 4 | 2 |  4 + 2(7 > 4) |
|  3 | 2 | 1 |  6 + 1(3 > 2) |

```java
// https://leetcode.cn/problems/divide-two-integers/submissions/611667809/
    private int yMultiple;

    public int divide(int dividend, int divisor) {
        if (dividend == divisor) {
            return 1;
        }
        if (Integer.MIN_VALUE == divisor) {
            return 0;
        }
        if (Integer.MIN_VALUE == dividend) {
            if (divisor == -1) {
                return Integer.MAX_VALUE;
            }
            if (divisor > 0) {
                return divide(dividend + divisor, divisor) - 1;
            } else {
                return divide(dividend - divisor, divisor) + 1;
            }
        }

        if (dividend < 0 || divisor < 0) {
            if (dividend < 0 && divisor < 0) {
                return divide(-dividend, -divisor);
            } else {
                return dividend < 0 ? -divide(-dividend, divisor) : -divide(dividend, -divisor);
            }
        }

        yMultiple = 0;
        return doDivide(dividend, divisor);
    }

    private int doDivide(int x, int y) {
        // x >= 0, y > 0
        if (x < y) {
            return 0;
        }
        int yPlusY = y + y;
        if (yPlusY < 0) {
            yMultiple = y;
            return 1;
        }

        int q = doDivide(x, yPlusY);
        if (x - yMultiple < y) {
            return q + q;
        } else {
            yMultiple += y;
            return q + q + 1;
        }
    }
```
完整的实现还处理了一些边界情况
+ 除数为最小值，商为0(被除数不为最小值)
+ 被除数为最小值，由于不能直接取反，需要减去再加上一个除数(除数为正数)，再取反运算

到了doDivide中，x >= 0，y > 0，就是按照上述的倍增算法计算了，  
yMultiple就是每一步求得的，刚好不大于x的y的倍数，如果y减半之后仍不大于x，则倍数还可以加一。  
时间复杂度也是$$O(n)$$，和乘法相同。

## 平方根
这里希望求一个非负整数x的平方根的整数部分。  
考虑两种方式，一是求出平方根的近似解，省略小数部分。  
我们可以用牛顿法，假设要求$$\sqrt{2}$$即$$x^2=2$$也就是$$f(x)=x^2-2$$的正根。  
根据泰勒一级展开$$f(x)\approx f(x_0)+f^{'}(x_0)(x-x_0)$$，$$x_0$$为正根附近的一点。  
我们希望找到的下个点$$x_1$$更接近根，带入$$f(x_1)=f(x_0)+f^{'}(x_0)(x_1-x_0)=0$$，  
得到$$x_1=x_0-\frac{f(x_0)}{f^{'}(x_0)}$$，这就是牛顿法的递推公式。  
但是牛顿法的问题在于收敛速度和初值的设定极大影响求解的效果，对于本题实用性有限。

```java
// https://leetcode.cn/problems/sqrtx/submissions/611818108
    private static double PRECISION = 1E-5;
    public int mySqrt(int x) {
        return (int)sqrt(x);
    }
    
    private double sqrt(int x) {
        if (x == 0 || x == 1) {
            return x;
        }
        double result = x;
        while (Math.abs((result = result / 2 + x / (result + result)) * result - x) > PRECISION) {}
        return result;
    }
```
注意迭代公式$$x_1=\frac{x_0}{2}+\frac{x}{2x_0}$$和检验结果的条件$$x_n^2-x < PRECISION$$

方法二从二进制高位开始置一，如果平方大于目标值则置零，可以在$$O(n)$$复杂度下求解平方根，n是数字的二进制长度。

```java
// https://leetcode.cn/problems/sqrtx/submissions/611833310
    public int mySqrt(int x) {
        int result = 0;
        for (int i = 15; i >= 0; i--) {
            int sum = result + (1 << i);
            if (sum * sum < 0) {
                continue;
            }
            result = sum * sum <= x ? sum : result;
        }
        return result;
    }
```
由于sum的平方可能溢出，需要加上判断。

## 快速幂
既然整数乘法和除法都可以用倍增思想来求解，求整数次幂当然也可以。  
假设要求x的n次方，n为正整数，可以分为如下两种情况
+ n为偶数，则$$pow(x,n)=pow(x^2,\frac{n}{2})$$
+ n为奇数，则$$pow(x,n)=x\times pow(x,n-1)$$

```java
// https://leetcode.cn/problems/powx-n/submissions/611695191
public double myPow(double x, int n) {
        if (x == 0d) {
            return 0;
        }
        if (n == 0) {
            return 1;
        }
        if (n < 0) {
            if (n == Integer.MIN_VALUE) {
                return x / myPow(x, -(n + 1));
            } else {
                return 1d / myPow(x, -n);
            }
        }
        if (n % 2 == 1) {
            return x * myPow(x, n - 1);
        } else {
            return myPow(x * x, n >> 1);
        }
    }
```
仍然单独处理了指数n为最小值的边界情况。

## 阶乘后的零
```text
给定一个整数n，返回n的阶乘中尾随零的数量。
```

每个尾随零都是一个2和一个5的乘积，由于因子2的个数是足够的，我们只需要看有多少个因子5就可以了。  
这样问题就变成了，`1~n`中有多少个因子5，这样就需要统计5的倍数、$$5^2$$的倍数、$$5^3$$的倍数...  
由于每五个连续的数中肯定有一个5的倍数，`n/5`就是`1~n`中5的倍数，同理`n/5/5`就是25的倍数。

```java
// https://leetcode.cn/problems/factorial-trailing-zeroes/submissions/537946034
    public int trailingZeroes(int n) {
        int result = 0;
        while (n != 0) {
            n /= 5;
            result += n;
        }
        return result;
    }
```