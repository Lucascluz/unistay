import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
  index("routes/home.tsx"),
  route("login", "routes/login.tsx"),
  route("register", "routes/register.tsx"),
  route("company/login", "routes/company.login.tsx"),
  route("company/register", "routes/company.register.tsx"),
  route("company/dashboard", "routes/company.dashboard.tsx"),
  route("admin/dashboard", "routes/admin.dashboard.tsx"),
  route("reviews/:location", "routes/reviews.$location.tsx"),
] satisfies RouteConfig;
