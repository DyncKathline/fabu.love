let baseURL = process.env.VUE_APP_FABU_BASE_URL;
let publicPath = "/";
const prefix = "project_";

// if (process.env.NODE_ENV === "development") {
//   baseURL = "http://localhost:9003/api";
//   publicPath = "/";
// }

module.exports = {
  baseURL,
  publicPath,
  prefix,
  title: "爱发布",
  //路由模式，可选值为 history 或 hash
  routerMode: "history",
  //不经过token校验的路由
  routesWhiteList: [
    "/login",
    "/register",
    "/",
    "/404",
    "/403"
  ],
  //标题分隔符
  titleSeparator: " - ",
  //标题是否反转 如果为false:"page - title"，如果为ture:"title - page"
  titleReverse: false,
  //token失效回退到登录页时是否记录本次的路由
  recordRoute: true,
  /** 是否允许页面滚动 */
  overflow: false,
  /** 是否固定顶部导航栏 */
  fixedHeader: true,
  /** 是否展开侧边栏 */
  sidebarLogo: true
};
