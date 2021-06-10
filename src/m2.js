const Vue = {
  createApp(options) {
    return {
      mount(selector) {
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

        this.update = effect(() => {
          const el = options.render();

          // 挂载到页面上去
          container.innerHTML = "";
          container.appendChild(el);
        });
        this.update();
      },
      compile(template) {
        // 吧解析好的vnode用render解析出来
        const render = (data) => {
          // 现在没有模板解析，随便模拟一个
          const h3 = document.createElement("h3");
          h3.textContent = this.proxy.state.title;
          return h3;
        };
        return render;
      },
    };
  },
  reactive(obj) {
    return new Proxy(obj, {
      get(target, key) {
        // 收集依赖
        track(target, key);
        return target[key];
      },
      set(target, key, value) {
        // 代理的值变化时触发重新渲染
        target[key] = value;
        triggler(target, key);
      },
    });
  },
};

// 依赖收集--把使用到的变量都收集到一起
const effectStack = [];
function effect(fn) {
  // 如果fn中用到了响应式数据，那么收集起来，下次数据改变的时候直接执行fn
  const eff = function () {
    try {
      effectStack.push(eff);
      // 为啥要执行：执行的时候，如果用到了a，那么就会触发a的get，就可以在里面收集依赖了
      fn();
    } finally {
      effectStack.pop();
    }
  };

  eff();

  return eff;
}

// 收集依赖的函数
// 依赖于应该类似于这种解构
const targetMap = {
  // 响应对象1：state
  // state: {
  // state中的title属性，存放多个副作用函数，当title变化时，依次触发这些函数
  // title: [eff1,eff2,eff2,...],
  // },
};
function track(target, key) {
  // get时会触发
  // 找到之前入栈的那一个方法，保存起来
  const effect = effectStack[effectStack.length - 1];
  if (effect) {
    // 如果之前存在依赖关系
    let map = targetMap[target];
    if (!map) {
      map = targetMap[target] = {};
    }

    let deps = map[key];
    if (!deps) {
      deps = map[key] = [];
    }

    if (deps.indexOf(effect) === -1) {
      deps.push(effect);
    }
  }
}

function triggler(target, key) {
  const map = targetMap[target];
  if (map) {
    const deps = map[key];
    if (deps) {
      deps.forEach((i) => i());
    }
  }
}

// 使用
const { createApp, reactive } = Vue;
const app = createApp({
  setup() {
    const state = reactive({
      title: "111111111111",
      name: "state",
    });

    setTimeout(() => {
      state.title = "22222222222";
    }, 2000);

    return {
      state,
    };
  },
});

app.mount("#app");
