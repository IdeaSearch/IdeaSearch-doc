# Detailed Balance 网页风格交接包

这是 IdeaSearch「Detailed Balance」完整静态网页的离线副本，供另一项目参考页面结构、排版、组件、图表和交互风格。包内包含网页源码、数据文件、插图、独立交互图和离线字体。页面内容仅来自 Detailed Balance 网页。

## 离线查看

解压后进入 `detailed_balance_style_handoff` 目录，运行：

```bash
python3 -m http.server 8000
```

在浏览器打开 <http://127.0.0.1:8000>。需要通过本地 HTTP 服务查看；直接双击 `index.html` 会因浏览器对本地文件的限制而影响数据读取或交互。

网页正文、图表、语言切换和本地资源均可离线查看。页面内原有的论文、代码和数据集外链仍指向其原始网站，离线时这些外部链接不可访问。

## 目录

- `index.html`：页面结构及中英文内容
- `styles.css`：页面样式与响应式布局
- `script.js`：语言切换、图表与交互逻辑
- `assets/data/`：页面使用的数据
- `assets/figs/`：本地插图和独立交互式图表
- `assets/fonts/`：离线字体与字体声明
- `favicon.svg`、`favicon.ico`：页面图标
- `LICENSE`、`NOTICE-*.txt`：原项目及随附字体的许可信息

## 字体

网页优先使用包内字体。为保证离线显示，西文字体使用随包提供的兼容 fallback 字体，中文字体使用按本页字符子集化的 Noto Sans SC 与 Noto Serif SC。字体许可证见 `NOTICE-*.txt`。
