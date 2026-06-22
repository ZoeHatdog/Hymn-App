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
 * Root stack. Hymn flows live here (above the tabs) so any tab can open
 * a hymn without duplicating screens in every section.
 */
export type RootStackParamList = {
  Landing: undefined;
  Main: NavigatorScreenParams<MainTabParamList> | undefined;
  HymnViewPicker: { hymnId: string };
  HymnTextDetail: { hymnId: string };
  HymnImageDetail: { hymnId: string };
};

declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
}
