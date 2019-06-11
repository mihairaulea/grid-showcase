
(function(l, i, v, e) { v = l.createElement(i); v.async = 1; v.src = '//' + (location.host || 'localhost').split(':')[0] + ':35729/livereload.js?snipver=1'; e = l.getElementsByTagName(i)[0]; e.parentNode.insertBefore(v, e)})(document, 'script');
var app = (function () {
    'use strict';

    function noop() { }
    function add_location(element, file, line, column, char) {
        element.__svelte_meta = {
            loc: { file, line, column, char }
        };
    }
    function run(fn) {
        return fn();
    }
    function blank_object() {
        return Object.create(null);
    }
    function run_all(fns) {
        fns.forEach(run);
    }
    function is_function(thing) {
        return typeof thing === 'function';
    }
    function safe_not_equal(a, b) {
        return a != a ? b == b : a !== b || ((a && typeof a === 'object') || typeof a === 'function');
    }

    function append(target, node) {
        target.appendChild(node);
    }
    function insert(target, node, anchor) {
        target.insertBefore(node, anchor || null);
    }
    function detach(node) {
        node.parentNode.removeChild(node);
    }
    function destroy_each(iterations, detaching) {
        for (let i = 0; i < iterations.length; i += 1) {
            if (iterations[i])
                iterations[i].d(detaching);
        }
    }
    function element(name) {
        return document.createElement(name);
    }
    function text(data) {
        return document.createTextNode(data);
    }
    function space() {
        return text(' ');
    }
    function children(element) {
        return Array.from(element.childNodes);
    }
    function set_style(node, key, value) {
        node.style.setProperty(key, value);
    }

    let current_component;
    function set_current_component(component) {
        current_component = component;
    }

    const dirty_components = [];
    const resolved_promise = Promise.resolve();
    let update_scheduled = false;
    const binding_callbacks = [];
    const render_callbacks = [];
    const flush_callbacks = [];
    function schedule_update() {
        if (!update_scheduled) {
            update_scheduled = true;
            resolved_promise.then(flush);
        }
    }
    function add_render_callback(fn) {
        render_callbacks.push(fn);
    }
    function flush() {
        const seen_callbacks = new Set();
        do {
            // first, call beforeUpdate functions
            // and update components
            while (dirty_components.length) {
                const component = dirty_components.shift();
                set_current_component(component);
                update(component.$$);
            }
            while (binding_callbacks.length)
                binding_callbacks.shift()();
            // then, once components are updated, call
            // afterUpdate functions. This may cause
            // subsequent updates...
            while (render_callbacks.length) {
                const callback = render_callbacks.pop();
                if (!seen_callbacks.has(callback)) {
                    callback();
                    // ...so guard against infinite loops
                    seen_callbacks.add(callback);
                }
            }
        } while (dirty_components.length);
        while (flush_callbacks.length) {
            flush_callbacks.pop()();
        }
        update_scheduled = false;
    }
    function update($$) {
        if ($$.fragment) {
            $$.update($$.dirty);
            run_all($$.before_render);
            $$.fragment.p($$.dirty, $$.ctx);
            $$.dirty = null;
            $$.after_render.forEach(add_render_callback);
        }
    }
    function mount_component(component, target, anchor) {
        const { fragment, on_mount, on_destroy, after_render } = component.$$;
        fragment.m(target, anchor);
        // onMount happens after the initial afterUpdate. Because
        // afterUpdate callbacks happen in reverse order (inner first)
        // we schedule onMount callbacks before afterUpdate callbacks
        add_render_callback(() => {
            const new_on_destroy = on_mount.map(run).filter(is_function);
            if (on_destroy) {
                on_destroy.push(...new_on_destroy);
            }
            else {
                // Edge case - component was destroyed immediately,
                // most likely as a result of a binding initialising
                run_all(new_on_destroy);
            }
            component.$$.on_mount = [];
        });
        after_render.forEach(add_render_callback);
    }
    function destroy(component, detaching) {
        if (component.$$) {
            run_all(component.$$.on_destroy);
            component.$$.fragment.d(detaching);
            // TODO null out other refs, including component.$$ (but need to
            // preserve final state?)
            component.$$.on_destroy = component.$$.fragment = null;
            component.$$.ctx = {};
        }
    }
    function make_dirty(component, key) {
        if (!component.$$.dirty) {
            dirty_components.push(component);
            schedule_update();
            component.$$.dirty = blank_object();
        }
        component.$$.dirty[key] = true;
    }
    function init(component, options, instance, create_fragment, not_equal$$1, prop_names) {
        const parent_component = current_component;
        set_current_component(component);
        const props = options.props || {};
        const $$ = component.$$ = {
            fragment: null,
            ctx: null,
            // state
            props: prop_names,
            update: noop,
            not_equal: not_equal$$1,
            bound: blank_object(),
            // lifecycle
            on_mount: [],
            on_destroy: [],
            before_render: [],
            after_render: [],
            context: new Map(parent_component ? parent_component.$$.context : []),
            // everything else
            callbacks: blank_object(),
            dirty: null
        };
        let ready = false;
        $$.ctx = instance
            ? instance(component, props, (key, value) => {
                if ($$.ctx && not_equal$$1($$.ctx[key], $$.ctx[key] = value)) {
                    if ($$.bound[key])
                        $$.bound[key](value);
                    if (ready)
                        make_dirty(component, key);
                }
            })
            : props;
        $$.update();
        ready = true;
        run_all($$.before_render);
        $$.fragment = create_fragment($$.ctx);
        if (options.target) {
            if (options.hydrate) {
                $$.fragment.l(children(options.target));
            }
            else {
                $$.fragment.c();
            }
            if (options.intro && component.$$.fragment.i)
                component.$$.fragment.i();
            mount_component(component, options.target, options.anchor);
            flush();
        }
        set_current_component(parent_component);
    }
    class SvelteComponent {
        $destroy() {
            destroy(this, true);
            this.$destroy = noop;
        }
        $on(type, callback) {
            const callbacks = (this.$$.callbacks[type] || (this.$$.callbacks[type] = []));
            callbacks.push(callback);
            return () => {
                const index = callbacks.indexOf(callback);
                if (index !== -1)
                    callbacks.splice(index, 1);
            };
        }
        $set() {
            // overridden by instance, if it has props
        }
    }
    class SvelteComponentDev extends SvelteComponent {
        constructor(options) {
            if (!options || (!options.target && !options.$$inline)) {
                throw new Error(`'target' is a required option`);
            }
            super();
        }
        $destroy() {
            super.$destroy();
            this.$destroy = () => {
                console.warn(`Component was already destroyed`); // eslint-disable-line no-console
            };
        }
    }

    /* src/common/components/Grid.svelte generated by Svelte v3.4.4 */

    const file = "src/common/components/Grid.svelte";

    function get_each_context(ctx, list, i) {
    	const child_ctx = Object.create(ctx);
    	child_ctx.id = list[i].id;
    	child_ctx.name = list[i].name;
    	child_ctx.i = i;
    	return child_ctx;
    }

    function get_each_context_1(ctx, list, i) {
    	const child_ctx = Object.create(ctx);
    	child_ctx.id = list[i].id;
    	child_ctx.name = list[i].name;
    	child_ctx.i = i;
    	return child_ctx;
    }

    // (71:32) {#each tableColumns as { id, name }
    function create_each_block_1(ctx) {
    	var th, t_value = ctx.tableColumns[ctx.i], t;

    	return {
    		c: function create() {
    			th = element("th");
    			t = text(t_value);
    			th.className = "bdwT-0";
    			add_location(th, file, 71, 32, 2340);
    		},

    		m: function mount(target, anchor) {
    			insert(target, th, anchor);
    			append(th, t);
    		},

    		p: noop,

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach(th);
    			}
    		}
    	};
    }

    // (77:28) {#each tableData as { id, name }
    function create_each_block(ctx) {
    	var tr, td0, t0_value = ctx.tableData[ctx.i].itemName, t0, t1, td1, span0, t2_value = ctx.tableData[ctx.i].status, t2, span0_class_value, t3, td2, t4_value = ctx.tableData[ctx.i].date, t4, t5, td3, span1, t6_value = ctx.tableData[ctx.i].price, t6;

    	return {
    		c: function create() {
    			tr = element("tr");
    			td0 = element("td");
    			t0 = text(t0_value);
    			t1 = space();
    			td1 = element("td");
    			span0 = element("span");
    			t2 = text(t2_value);
    			t3 = space();
    			td2 = element("td");
    			t4 = text(t4_value);
    			t5 = space();
    			td3 = element("td");
    			span1 = element("span");
    			t6 = text(t6_value);
    			td0.className = "fw-600";
    			add_location(td0, file, 78, 32, 2651);
    			span0.className = span0_class_value = " " + getRandomBadge() + " ";
    			add_location(span0, file, 79, 36, 2737);
    			add_location(td1, file, 79, 32, 2733);
    			add_location(td2, file, 80, 32, 2842);
    			span1.className = "text-success";
    			add_location(span1, file, 81, 36, 2909);
    			add_location(td3, file, 81, 32, 2905);
    			add_location(tr, file, 77, 28, 2614);
    		},

    		m: function mount(target, anchor) {
    			insert(target, tr, anchor);
    			append(tr, td0);
    			append(td0, t0);
    			append(tr, t1);
    			append(tr, td1);
    			append(td1, span0);
    			append(span0, t2);
    			append(tr, t3);
    			append(tr, td2);
    			append(td2, t4);
    			append(tr, t5);
    			append(tr, td3);
    			append(td3, span1);
    			append(span1, t6);
    		},

    		p: noop,

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach(tr);
    			}
    		}
    	};
    }

    function create_fragment(ctx) {
    	var div10, div9, div7, div0, h6, t1, div6, div4, div3, div1, h5, t2, t3, p, t5, div2, h3, t6, t7, div5, table, thead, tr, t8, tbody, t9, div8, a;

    	var each_value_1 = ctx.tableColumns;

    	var each_blocks_1 = [];

    	for (var i = 0; i < each_value_1.length; i += 1) {
    		each_blocks_1[i] = create_each_block_1(get_each_context_1(ctx, each_value_1, i));
    	}

    	var each_value = ctx.tableData;

    	var each_blocks = [];

    	for (var i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block(get_each_context(ctx, each_value, i));
    	}

    	return {
    		c: function create() {
    			div10 = element("div");
    			div9 = element("div");
    			div7 = element("div");
    			div0 = element("div");
    			h6 = element("h6");
    			h6.textContent = "Sales Report";
    			t1 = space();
    			div6 = element("div");
    			div4 = element("div");
    			div3 = element("div");
    			div1 = element("div");
    			h5 = element("h5");
    			t2 = text(reportDate);
    			t3 = space();
    			p = element("p");
    			p.textContent = "Sales Report";
    			t5 = space();
    			div2 = element("div");
    			h3 = element("h3");
    			t6 = text(totalAmount);
    			t7 = space();
    			div5 = element("div");
    			table = element("table");
    			thead = element("thead");
    			tr = element("tr");

    			for (var i = 0; i < each_blocks_1.length; i += 1) {
    				each_blocks_1[i].c();
    			}

    			t8 = space();
    			tbody = element("tbody");

    			for (var i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			t9 = space();
    			div8 = element("div");
    			a = element("a");
    			a.textContent = "Check all the sales";
    			h6.className = "lh-1";
    			add_location(h6, file, 54, 16, 1513);
    			div0.className = "layer w-100 p-20";
    			add_location(div0, file, 53, 12, 1466);
    			add_location(h5, file, 59, 28, 1794);
    			p.className = "mB-0";
    			add_location(p, file, 60, 28, 1844);
    			div1.className = "peer peer-greed";
    			add_location(div1, file, 58, 24, 1736);
    			h3.className = "text-right";
    			add_location(h3, file, 63, 28, 1979);
    			div2.className = "peer";
    			add_location(div2, file, 62, 24, 1932);
    			div3.className = "peers ai-c jc-sb gap-40";
    			add_location(div3, file, 57, 20, 1674);
    			div4.className = "bgc-light-blue-500 c-white p-20";
    			add_location(div4, file, 56, 16, 1608);
    			add_location(tr, file, 69, 28, 2231);
    			add_location(thead, file, 68, 24, 2195);
    			add_location(tbody, file, 75, 24, 2513);
    			table.className = "table";
    			add_location(table, file, 67, 20, 2149);
    			div5.className = "table-responsive p-20";
    			add_location(div5, file, 66, 16, 2093);
    			div6.className = "layer w-100";
    			add_location(div6, file, 55, 12, 1566);
    			div7.className = "layers";
    			add_location(div7, file, 52, 8, 1433);
    			a.href = "https://dashboardhero.net";
    			add_location(a, file, 89, 41, 3201);
    			div8.className = "ta-c bdT w-100 p-20";
    			add_location(div8, file, 89, 8, 3168);
    			div9.className = "bd bgc-white";
    			add_location(div9, file, 51, 4, 1398);
    			set_style(div10, "padding", "70px");
    			div10.className = "masonry-item col-md-6";
    			add_location(div10, file, 50, 0, 1335);
    		},

    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},

    		m: function mount(target, anchor) {
    			insert(target, div10, anchor);
    			append(div10, div9);
    			append(div9, div7);
    			append(div7, div0);
    			append(div0, h6);
    			append(div7, t1);
    			append(div7, div6);
    			append(div6, div4);
    			append(div4, div3);
    			append(div3, div1);
    			append(div1, h5);
    			append(h5, t2);
    			append(div1, t3);
    			append(div1, p);
    			append(div3, t5);
    			append(div3, div2);
    			append(div2, h3);
    			append(h3, t6);
    			append(div6, t7);
    			append(div6, div5);
    			append(div5, table);
    			append(table, thead);
    			append(thead, tr);

    			for (var i = 0; i < each_blocks_1.length; i += 1) {
    				each_blocks_1[i].m(tr, null);
    			}

    			append(table, t8);
    			append(table, tbody);

    			for (var i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(tbody, null);
    			}

    			append(div9, t9);
    			append(div9, div8);
    			append(div8, a);
    		},

    		p: function update(changed, ctx) {
    			if (changed.tableColumns) {
    				each_value_1 = ctx.tableColumns;

    				for (var i = 0; i < each_value_1.length; i += 1) {
    					const child_ctx = get_each_context_1(ctx, each_value_1, i);

    					if (each_blocks_1[i]) {
    						each_blocks_1[i].p(changed, child_ctx);
    					} else {
    						each_blocks_1[i] = create_each_block_1(child_ctx);
    						each_blocks_1[i].c();
    						each_blocks_1[i].m(tr, null);
    					}
    				}

    				for (; i < each_blocks_1.length; i += 1) {
    					each_blocks_1[i].d(1);
    				}
    				each_blocks_1.length = each_value_1.length;
    			}

    			if (changed.tableData || changed.getRandomBadge) {
    				each_value = ctx.tableData;

    				for (var i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(changed, child_ctx);
    					} else {
    						each_blocks[i] = create_each_block(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(tbody, null);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}
    				each_blocks.length = each_value.length;
    			}
    		},

    		i: noop,
    		o: noop,

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach(div10);
    			}

    			destroy_each(each_blocks_1, detaching);

    			destroy_each(each_blocks, detaching);
    		}
    	};
    }

    let reportDate = "June 2019";

    let totalAmount = "$30,000";

    function getRandomBadge() {
    let possibleBadgeValues =
                   ["badge bgc-red-50 c-red-700 p-10 lh-0 tt-c badge-pill",
                    "badge bgc-deep-purple-50 c-deep-purple-700 p-10 lh-0 tt-c badge-pill",
                    "badge bgc-pink-50 c-pink-700 p-10 lh-0 tt-c badge-pill",
                    "badge bgc-green-50 c-green-700 p-10 lh-0 tt-c badge-pill",
                    "badge bgc-red-50 c-red-700 p-10 lh-0 tt-c badge-pill",
                    "badge bgc-orange-50 c-orange-700 p-10 lh-0 tt-c badge-pill"
                  ];
    return possibleBadgeValues[Math.floor(Math.random()*possibleBadgeValues.length)];
    }

    function instance($$self) {
    	
    let tableColumns = ["Name", "Status", "Date", "Price"];
    let tableData = [
    {
      itemName: "UI consulting services",
      status: "Shipped",
      date: "12 Jun 2019",
      price: "9500 EUR"
    },
    {
      itemName: "Lean startup consulting",
      status: "Pending pay",
      date: "15 Jun 2019",
      price: "8300 USD"
    },
    {
      itemName: "MVP development",
      status: "Shipped",
      date: "17 Jun 2019",
      price: "18600 USD"
    },
    {
      itemName: "Consulting services - hourly",
      status: "Shipped",
      date: "18 Jun 2019",
      price: "1000 USD"
    },
    {
      itemName: "Consulting services - project",
      status: "Shipped",
      date: "20 Jun 2019",
      price: "1200 USD"
    },
    ];

    	return { tableColumns, tableData };
    }

    class Grid extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance, create_fragment, safe_not_equal, []);
    	}
    }

    /* src/App.svelte generated by Svelte v3.4.4 */

    const file$1 = "src/App.svelte";

    function create_fragment$1(ctx) {
    	var body, t, div1, div0, current;

    	var grid = new Grid({ $$inline: true });

    	return {
    		c: function create() {
    			body = element("body");
    			grid.$$.fragment.c();
    			t = space();
    			div1 = element("div");
    			div0 = element("div");
    			div0.className = "spinner svelte-1vruiw";
    			add_location(div0, file$1, 63, 1, 1190);
    			div1.id = "loader";
    			div1.className = "svelte-1vruiw";
    			add_location(div1, file$1, 62, 0, 1171);
    			body.className = "app";
    			add_location(body, file$1, 58, 0, 1142);
    		},

    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},

    		m: function mount(target, anchor) {
    			insert(target, body, anchor);
    			mount_component(grid, body, null);
    			append(body, t);
    			append(body, div1);
    			append(div1, div0);
    			current = true;
    		},

    		p: noop,

    		i: function intro(local) {
    			if (current) return;
    			grid.$$.fragment.i(local);

    			current = true;
    		},

    		o: function outro(local) {
    			grid.$$.fragment.o(local);
    			current = false;
    		},

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach(body);
    			}

    			grid.$destroy();
    		}
    	};
    }

    function instance$1($$self) {
    	console.log("START");
    window.addEventListener('load', function load() {
    			const loader = document.getElementById('loader');
    			loader.parentNode.removeChild(loader);
    });

    	return {};
    }

    class App extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$1, create_fragment$1, safe_not_equal, []);
    	}
    }

    const app = new App({
    	target: document.body
    });

    return app;

}());
//# sourceMappingURL=bundle.js.map
