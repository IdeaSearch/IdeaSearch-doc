import { HomeLayout } from "fumadocs-ui/layouts/home";
import { NavbarLink } from "fumadocs-ui/layouts/home/navbar";
import { baseOptions } from "@/lib/layout.shared";


export default function Layout({ children }: LayoutProps<"/">) {
  return <HomeLayout 
    {...baseOptions()}
    links={[
      {
        text: "Documentation",
        url: "/docs/framework", 
      },
      {
        text: "Blog",
        url: "/blog",
      },
    ]}
  >{children}</HomeLayout>;
}
