// 基本结构
// 创建阶段：调用createApp返回一个实例对象

// 挂载阶段：
// mount：把dom挂载到页面容器上去

// mount中的dom从哪来，需要进入编译阶段compile：
// compile：把template解析成vnode树
// compile中存在render方法，作用是：vnode => dom

// 历史包袱
// Vue3是做了兼容的处理的，支持setup，也支持以前的data函数

// createRenderer函数：提供一套编译解析的方法

const Vue = {
  createApp(options) {
    // createApp()返回一个app实例对象，实例中最少要有一个mount方法
    return {
      mount(selector) {
        // 将组建配置解析为dom，挂载到页面上去
        // 要讲组件解析，还需要用到compile方法
        const container = document.querySelector(selector);

        // 组件中可能是jsx，有传入render函数
        if (!options.render) {
          // 把组件的innerHTML传入compile，当做模板解析
          options.render = this.compile(container.innerHTML);
        }

        // render函数有了，然后执行下setup，拿到组件的dom实例
        if (options.setup) {
          this.setupState = options.setup();
        }

        if (options.data) {
          this.data = options.data();
        }

        this.proxy = new Proxy(this, {
          // data和setup是可以并存的，如果data和setup中都存在xx属性，那么怎么判断呢
          // 模拟一下兼容处理
          // 如果data和setup同时存在xx属性，优先取setup中的属性
          get(target, key) {
            if (key in target.setupState) {
              return target.setupState[key];
            } else {
              return target.data[key];
            }
          },
          set(target, key, value) {
            if (key in target.setupState) {
              target.setupState[key] = value;
            } else {
              target.data[key] = value;
            }
          },
        });
        const el = options.render();

        // 挂载到页面上去
        container.innerHTML = "";
        container.appendChild(el);
      },
      compile(template) {
        // 传入一个模板，把模板解析出来，这里跳过解析步骤，直接进入render
        // 。。。。

        // 吧解析好的vnode用render解析出来
        const render = (data) => {
          // 现在没有模板解析，随便模拟一个
          const h3 = document.createElement("h3");
          h3.textContent = this.proxy.title + "-----" + this.proxy.xxx;
          return h3;
        };
        return render;
      },
    };
  },
  createRenderer({ querySelector, insert }) {
    // 可以通过传递的参数，来执行编译的方法
    // 至少返回一个自定义渲染器，其中createApp和其中的所有方法
    // 传入createRenderer用于跨平台处理渲染
    // 完整的vue中render只是负责调用，不关心render内部逻辑实现的，只是vue默认传入了dom操作
    // 像uni-app中，如果传入的是小程序的处理逻辑，那么vue也只是调用一下，其他都不用管
    // 数据变化只是会触发vnode更新，vnode更新diff之后触发render函数，至于render里面干什么？就不去关心其他平台的处理逻辑了
    return {
      createApp() {
        return {
          mount: () => {},
          compile: () => {},
        };
      },
    };
  },
};

// 使用
const { createApp } = Vue;
const app = createApp({
  data() {
    return {
      title: "我是data中的title",
      xxx: "data中的xxx",
    };
  },
  setup() {
    const title = "我是setup中的key";

    return {
      title,
    };
  },
});

app.mount("#app");
