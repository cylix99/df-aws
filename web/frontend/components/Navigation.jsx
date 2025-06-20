import { Navigation } from "@shopify/polaris";
import { HomeMajor, OrdersMajor } from "@shopify/polaris-icons";

export default function NavigationMenu() {
  return (
    <Navigation location="/">
      <Navigation.Section
        items={[
          {
            label: "Home",
            icon: HomeMajor,
            destination: "/",
          },
          {
            label: "Orders",
            icon: OrdersMajor,
            destination: "/orders",
          },
        ]}
      />
    </Navigation>
  );
}
