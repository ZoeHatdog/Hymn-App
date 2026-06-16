import type { NavigatorScreenParams } from "@react-navigation/native";

/**
 * Bottom tab sections. Each maps to its own self-contained screen container.
 */
export type MainTabParamList = {
  Home: undefined;
  Browse: undefined;
  Favorites: undefined;
  Contents: undefined;
  Settings: undefined;
};

/**
 * Root stack. The hymn detail lives here (above the tabs) so any tab can open
 * a hymn without duplicating the screen in every section.
 */
export type RootStackParamList = {
  Landing: undefined;
  Main: NavigatorScreenParams<MainTabParamList> | undefined;
  HymnDetail: { hymnId: string };
};

declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
}
